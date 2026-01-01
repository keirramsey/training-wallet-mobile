import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';

const AUTH_TOKEN_KEY = '@training_wallet/auth_token';
const AUTH_USER_KEY = '@training_wallet/auth_user';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

const DEMO_EMAILS = new Set([
  'demo@example.com',
  'demo@searchtraining.com.au',
]);

function toDemoResponse(email: string): LoginResponse {
  return {
    token: `demo-token-${Date.now()}`,
    user: {
      id: 'demo-user',
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    },
  };
}

/**
 * Attempt to login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const isDemoEmail = DEMO_EMAILS.has(normalizedEmail);

  // Demo mode: accept demo credentials or explicit demo env
  if (__DEV__ || isDemoEmail || process.env.EXPO_PUBLIC_DEMO_LOGIN === '1') {
    const demoResponse = toDemoResponse(normalizedEmail);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, demoResponse.token);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoResponse.user));
    return demoResponse;
  }

  let response: LoginResponse;
  try {
    response = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    if (isDemoEmail) {
      const demoResponse = toDemoResponse(normalizedEmail);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, demoResponse.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoResponse.user));
      return demoResponse;
    }
    throw error;
  }

  // Store auth data
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

  return response;
}

/**
 * Login with Search Training SSO token
 */
export async function loginWithSearchTraining(ssoToken: string): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/api/auth/sso', {
    method: 'POST',
    body: JSON.stringify({ provider: 'search_training', token: ssoToken }),
  });

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

  return response;
}

/**
 * Logout and clear stored credentials
 */
export async function logout(): Promise<void> {
  try {
    const token = await getStoredToken();
    if (token) {
      // Attempt to notify server (non-blocking)
      apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Ignore logout API errors
      });
    }
  } finally {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  }
}

/**
 * Get stored auth token
 */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored user data
 */
export async function getStoredUser(): Promise<AuthUser | null> {
  const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Restore auth state from storage
 */
export async function restoreAuthState(): Promise<{ token: string | null; user: AuthUser | null }> {
  const [token, user] = await Promise.all([getStoredToken(), getStoredUser()]);
  return { token, user };
}

/**
 * Check if token is valid by calling a protected endpoint
 */
export async function validateToken(token: string): Promise<boolean> {
  if (process.env.EXPO_PUBLIC_DEMO_LOGIN === '1' || token.startsWith('demo-token')) {
    return true;
  }
  try {
    await apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
}
