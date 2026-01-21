import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

import * as SecureStorage from '@/src/storage/secureStorage';

WebBrowser.maybeCompleteAuthSession();

const ACCESS_TOKEN_KEY = 'tw_access_token';
const ID_TOKEN_KEY = 'tw_id_token';
const EXPIRES_AT_KEY = 'tw_expires_at';
const NONCE_KEY = 'tw_auth_nonce';
const IS_DEMO_KEY = 'tw_is_demo';

const DEFAULT_SCOPES = 'openid email profile';
const NONCE_TTL_MS = 10 * 60 * 1000;

let cachedSession: AuthSessionState | null = null;
let sessionLoaded = false;
let fallbackWarningLogged = false;

export type AuthSessionState = {
  userId: string;
  orgId: string | null;
  roles: string[];
  accessToken: string;
  idToken: string;
  expiresAt: number;
  isDemo?: boolean;
};

type NonceRecord = {
  nonce: string;
  expiresAt: number;
};

function getEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

function getRedirectUri() {
  const scheme = getEnv('EXPO_PUBLIC_COGNITO_REDIRECT_SCHEME', 'trainingwallet');
  const path = getEnv('EXPO_PUBLIC_COGNITO_REDIRECT_PATH', 'auth/callback');
  return AuthSession.makeRedirectUri({ scheme, path });
}

function getDiscovery() {
  const domain = getEnv('EXPO_PUBLIC_COGNITO_DOMAIN');
  if (!domain) throw new Error('Missing EXPO_PUBLIC_COGNITO_DOMAIN');
  return {
    authorizationEndpoint: `https://${domain}/oauth2/authorize`,
    tokenEndpoint: `https://${domain}/oauth2/token`,
    revocationEndpoint: `https://${domain}/oauth2/revoke`,
  };
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + (4 - (value.length % 4)) % 4, '=');
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }
  const bufferCtor = (globalThis as { Buffer?: { from: (value: string, encoding: string) => { toString: (enc: string) => string } } }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(padded, 'base64').toString('utf8');
  }
  throw new Error('base64 decode not available');
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function storeNonce(nonce: string) {
  const payload: NonceRecord = { nonce, expiresAt: Date.now() + NONCE_TTL_MS };
  await SecureStorage.setItemAsync(NONCE_KEY, JSON.stringify(payload));
}

async function getStoredNonce(): Promise<NonceRecord | null> {
  const raw = await SecureStorage.getItemAsync(NONCE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NonceRecord;
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
      await SecureStorage.deleteItemAsync(NONCE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function clearNonce() {
  await SecureStorage.deleteItemAsync(NONCE_KEY);
}

async function setSession(session: AuthSessionState) {
  cachedSession = session;
  sessionLoaded = true;
  await SecureStorage.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
  await SecureStorage.setItemAsync(ID_TOKEN_KEY, session.idToken);
  await SecureStorage.setItemAsync(EXPIRES_AT_KEY, String(session.expiresAt));
  if (session.isDemo) {
    await SecureStorage.setItemAsync(IS_DEMO_KEY, 'true');
  } else {
    await SecureStorage.deleteItemAsync(IS_DEMO_KEY);
  }
}

async function clearSession() {
  cachedSession = null;
  sessionLoaded = true;
  await SecureStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStorage.deleteItemAsync(ID_TOKEN_KEY);
  await SecureStorage.deleteItemAsync(EXPIRES_AT_KEY);
  await SecureStorage.deleteItemAsync(IS_DEMO_KEY);
}

async function loadSession(): Promise<AuthSessionState | null> {
  if (sessionLoaded) return cachedSession;

  const [accessToken, idToken, expiresAtRaw, isDemoRaw] = await Promise.all([
    SecureStorage.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStorage.getItemAsync(ID_TOKEN_KEY),
    SecureStorage.getItemAsync(EXPIRES_AT_KEY),
    SecureStorage.getItemAsync(IS_DEMO_KEY),
  ]);
  sessionLoaded = true;

  if (!accessToken || !idToken || !expiresAtRaw) {
    cachedSession = null;
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await clearSession();
    return null;
  }

  const claims = decodeJwtPayload(idToken);
  const { userId, orgId, roles } = mapClaims(claims);

  const session: AuthSessionState = {
    userId,
    orgId,
    roles,
    accessToken,
    idToken,
    expiresAt,
    isDemo: isDemoRaw === 'true',
  };
  cachedSession = session;
  return session;
}

function mapClaims(claims: Record<string, unknown>): {
  userId: string;
  orgId: string | null;
  roles: string[];
} {
  const userId = typeof claims.sub === 'string' ? claims.sub : 'unknown';
  const orgId =
    (typeof claims.org_id === 'string' && claims.org_id) ||
    (typeof claims['custom:rto_id'] === 'string' ? (claims['custom:rto_id'] as string) : null);

  if (!claims.org_id && claims['custom:rto_id'] && !fallbackWarningLogged) {
    console.warn('auth_claim_fallback_custom_rto_id');
    fallbackWarningLogged = true;
  }

  const groupClaim = claims['cognito:groups'];
  const roles = Array.isArray(groupClaim) ? groupClaim.map((role) => String(role)) : [];
  return { userId, orgId, roles };
}

export async function signInDemo(): Promise<AuthSessionState> {
  console.log('[auth] signInDemo() called');

  const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
  const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  console.log('[auth] signInDemo check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    isProduction,
    isDemoEnabled
  });

  if (isProduction && !isDemoEnabled) {
    console.error('[auth] signInDemo blocked: production without DEMO_MODE');
    throw new Error('Demo mode is not available in production');
  }

  const now = Date.now();
  // Constructed to satisfy decodeJwtPayload and mapClaims
  // payload: {"sub":"demo-user-123","org_id":"demo-org","name":"Demo User","email":"demo@example.com","cognito:groups":["demo-role"]}
  const fakePayload = 'eyJzdWIiOiJkZW1vLXVzZXItMTIzIiwib3JnX2lkIjoiZGVtby1vcmciLCJuYW1lIjoiRGVtbyBVc2VyIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiY29nbml0bzpncm91cHMiOlsiZGVtby1yb2xlIl19';
  const idToken = `fake.${fakePayload}.fake`;

  const session: AuthSessionState = {
    userId: 'demo-user-123',
    orgId: 'demo-org',
    roles: ['demo-role'],
    accessToken: 'demo_access_token',
    idToken,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    isDemo: true,
  };

  console.log('[auth] signInDemo creating session...');
  await setSession(session);
  console.log('[auth] signInDemo session stored successfully');
  return session;
}

export async function signIn(): Promise<AuthSessionState> {
  const clientId = getEnv('EXPO_PUBLIC_COGNITO_CLIENT_ID');
  if (!clientId) throw new Error('Missing EXPO_PUBLIC_COGNITO_CLIENT_ID');

  const scopes = (getEnv('EXPO_PUBLIC_COGNITO_SCOPES', DEFAULT_SCOPES) || DEFAULT_SCOPES)
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean);

  const redirectUri = getRedirectUri();
  const discovery = getDiscovery();

  const nonceBytes = await Crypto.getRandomBytesAsync(16);
  const nonce = bytesToHex(nonceBytes);
  await storeNonce(nonce);

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { nonce },
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') {
    await clearNonce();
    throw new Error('Sign-in cancelled');
  }

  const code = result.params.code;
  if (!code) {
    await clearNonce();
    throw new Error('Missing authorization code');
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      code,
      clientId,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery
  );

  const accessToken = tokenResult.accessToken;
  const idToken = tokenResult.idToken;
  const expiresIn = tokenResult.expiresIn ?? 3600;

  if (!accessToken || !idToken) {
    await clearNonce();
    throw new Error('Missing token response');
  }

  const storedNonce = await getStoredNonce();
  await clearNonce();
  const claims = decodeJwtPayload(idToken);
  if (!storedNonce || claims.nonce !== storedNonce.nonce) {
    await clearSession();
    throw new Error('Invalid nonce');
  }

  const { userId, orgId, roles } = mapClaims(claims);
  const expiresAt = Date.now() + expiresIn * 1000;
  const session: AuthSessionState = {
    userId,
    orgId,
    roles,
    accessToken,
    idToken,
    expiresAt,
  };

  await setSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  await clearSession();
}

export async function getSession(): Promise<AuthSessionState | null> {
  return loadSession();
}

export async function isSignedIn(): Promise<boolean> {
  const session = await loadSession();
  return Boolean(session);
}

export async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  const session = await loadSession();
  if (!session) return null;
  return { Authorization: `Bearer ${session.accessToken}` };
}

export async function handleAuthRedirect(_url: string): Promise<void> {
  // AuthSession handles redirect via promptAsync; left for future deep-link handling.
}
