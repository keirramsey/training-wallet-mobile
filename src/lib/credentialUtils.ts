import type { Credential } from '@/src/types/credential';

/**
 * Merge remote and local credentials, deduplicating by ID.
 * Returns sorted by issued_at (newest first).
 */
export function mergeCredentials(remote: Credential[], local: Credential[]): Credential[] {
  const map = new Map<string, Credential>();
  for (const r of remote) {
    if (r?.id) map.set(r.id, r);
  }
  for (const l of local) {
    if (l?.id) map.set(l.id, l);
  }
  return Array.from(map.values()).sort((a, b) => {
    const da = a.issued_at ? new Date(a.issued_at).getTime() : 0;
    const db = b.issued_at ? new Date(b.issued_at).getTime() : 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da; // Newest first
  });
}

/**
 * Check if a credential is expired.
 */
export function isExpired(credential: Credential): boolean {
  if (!credential.expires_at) return false;
  const expiresAt = new Date(credential.expires_at).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt < Date.now();
}

/**
 * Check if a credential is expiring soon (within 30 days).
 */
export function isExpiringSoon(credential: Credential, daysThreshold = 30): boolean {
  if (!credential.expires_at) return false;
  const expiresAt = new Date(credential.expires_at).getTime();
  if (Number.isNaN(expiresAt)) return false;
  const now = Date.now();
  const threshold = daysThreshold * 24 * 60 * 60 * 1000;
  return expiresAt > now && expiresAt - now < threshold;
}

/**
 * Format date for display.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

/**
 * Get year from ISO date string.
 */
export function getYear(iso: string | undefined): number {
  if (!iso) return new Date().getFullYear();
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  return date.getFullYear();
}

/**
 * Normalize API error to consistent format.
 */
export function normalizeApiError(err: unknown): { message: string; httpStatus?: number } {
  const anyErr = err as { message?: unknown; status?: unknown };
  const rawMessage = typeof anyErr?.message === 'string' ? anyErr.message.trim() : '';
  const httpStatus = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (!rawMessage) return { message: 'Request failed', httpStatus };
  return { message: rawMessage, httpStatus };
}

/**
 * Parse credentials from API response.
 */
export function parseCredentials(payload: unknown): Credential[] {
  if (Array.isArray(payload)) return payload as Credential[];
  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected /api/credentials response');
  }
  const anyPayload = payload as { ok?: unknown; items?: unknown };
  if (anyPayload.ok !== true) throw new Error('Unexpected /api/credentials response');
  if (!Array.isArray(anyPayload.items)) throw new Error('Unexpected /api/credentials response');
  return anyPayload.items as Credential[];
}

/**
 * Calculate action required counts from credentials.
 */
export function getActionCounts(credentials: Credential[]) {
  let expiredCount = 0;
  let expiringSoonCount = 0;
  let processingCount = 0;

  for (const cred of credentials) {
    if (isExpired(cred)) {
      expiredCount++;
    } else if (isExpiringSoon(cred)) {
      expiringSoonCount++;
    }
    if (cred.status === 'processing') {
      processingCount++;
    }
  }

  return {
    expired: expiredCount,
    expiringSoon: expiringSoonCount,
    processing: processingCount,
    total: expiredCount + expiringSoonCount,
  };
}
