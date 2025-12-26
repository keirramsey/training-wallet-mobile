import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Credential, CredentialEvidence, CredentialUnit } from '@/src/types/credential';

const STORAGE_KEY = 'training_wallet.local_credentials.v1';

type LocalCredentialInput = {
  title: string;
  issuer_name: string;
  issued_at: string;
  expires_at?: string | null;
  units?: CredentialUnit[];
  evidence?: CredentialEvidence[];
};

function isValidIsoDate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function normalizeCredential(raw: Credential): Credential {
  const expiresAt = raw.expires_at ?? null;
  const issuerLogo = typeof raw.issuer_logo_url === 'string' ? raw.issuer_logo_url : null;
  const units = Array.isArray(raw.units) ? raw.units.filter((u) => u && typeof u.code === 'string') : undefined;
  const status = raw.status === 'verified' ? 'verified' : 'unverified';
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.filter((e) => e && typeof e.uri === 'string' && typeof e.kind === 'string')
    : undefined;

  return {
    id: raw.id,
    title: raw.title,
    issuer_name: raw.issuer_name,
    issuer_logo_url: issuerLogo,
    issued_at: raw.issued_at,
    expires_at: expiresAt,
    units,
    status,
    evidence,
  };
}

async function writeAll(credentials: Credential[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export async function getLocalCredentials(): Promise<Credential[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Credential => {
        if (!item || typeof item !== 'object') return false;
        const anyItem = item as Partial<Credential>;
        return (
          typeof anyItem.id === 'string' &&
          anyItem.id.startsWith('local_') &&
          typeof anyItem.title === 'string' &&
          typeof anyItem.issuer_name === 'string' &&
          typeof anyItem.issued_at === 'string' &&
          isValidIsoDate(anyItem.issued_at)
        );
      })
      .map((c) => normalizeCredential(c));
  } catch {
    return [];
  }
}

export async function getLocalCredential(id: string): Promise<Credential | null> {
  const all = await getLocalCredentials();
  return all.find((c) => c.id === id) ?? null;
}

export async function addLocalCredential(input: LocalCredentialInput): Promise<Credential> {
  if (!input.title.trim()) throw new Error('Title is required');
  if (!input.issuer_name.trim()) throw new Error('Issuer name is required');
  if (!input.issued_at.trim()) throw new Error('Issue date is required');
  if (!isValidIsoDate(input.issued_at)) throw new Error('Issue date must be a valid date');
  if (input.expires_at && !isValidIsoDate(input.expires_at)) throw new Error('Expiry date must be a valid date');

  const now = Date.now();
  const id = `local_${now}_${Math.random().toString(16).slice(2, 8)}`;

  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((e) => e && typeof e.uri === 'string' && e.uri.trim().length > 0)
    : undefined;

  const credential: Credential = normalizeCredential({
    id,
    title: input.title.trim(),
    issuer_name: input.issuer_name.trim(),
    issuer_logo_url: null,
    issued_at: new Date(input.issued_at).toISOString(),
    expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
    units: input.units?.filter((u) => u.code.trim().length > 0).map((u) => ({ code: u.code.trim(), title: u.title?.trim() || undefined })),
    status: 'unverified',
    evidence,
  });

  const all = await getLocalCredentials();
  await writeAll([credential, ...all]);
  return credential;
}

export async function deleteLocalCredential(id: string): Promise<void> {
  const all = await getLocalCredentials();
  const next = all.filter((c) => c.id !== id);
  await writeAll(next);
}
