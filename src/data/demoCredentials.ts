import type { Credential } from '@/src/types/credential';

/**
 * Demo credentials matching the Google Stitch mockup data.
 * Used as fallback when API is unavailable.
 */
export const DEMO_CREDENTIALS: Credential[] = [
  {
    id: 'demo_1',
    title: 'Construction Safety L2',
    issuer_name: 'OSHA Training Institute',
    category: 'Safety Cert',
    issued_at: '2021-12-12',
    expires_at: '2024-12-14',
    status: 'verified',
    colorTheme: 'blue',
    licence_id: '882-119-220',
    rto_code: 'RTO 91405',
  },
  {
    id: 'demo_2',
    title: 'First Aid / CPR',
    issuer_name: 'Australian Red Cross',
    category: 'Healthcare',
    issued_at: '2020-10-23',
    expires_at: '2023-10-23',
    status: 'expired',
    colorTheme: 'rose',
    licence_id: 'FA-2020-4521',
    rto_code: 'RTO 3067',
  },
  {
    id: 'demo_3',
    title: 'Forklift Operator',
    issuer_name: 'Warehouse Pro Training',
    category: 'Heavy Machinery',
    issued_at: '2022-11-24',
    expires_at: '2024-11-24',
    status: 'processing',
    colorTheme: 'slate',
    licence_id: 'FLT-78234',
    rto_code: 'RTO 41003',
  },
  {
    id: 'demo_4',
    title: 'Traffic Control',
    issuer_name: 'Roads Authority NSW',
    category: 'Traffic',
    issued_at: '2023-07-25',
    expires_at: '2025-07-25',
    status: 'verified',
    colorTheme: 'indigo',
    licence_id: 'TC-NSW-9921',
    rto_code: 'RTO 90155',
  },
  {
    id: 'demo_5',
    title: 'Working at Heights',
    issuer_name: 'SafeWork Australia',
    category: 'Construction',
    issued_at: '2024-01-15',
    expires_at: '2026-01-15',
    status: 'verified',
    colorTheme: 'emerald',
    licence_id: 'WAH-AU-1192',
    rto_code: 'RTO 21567',
  },
  {
    id: 'demo_6',
    title: 'White Card',
    issuer_name: 'SafeWork NSW',
    category: 'Induction',
    issued_at: '2020-03-10',
    expires_at: undefined, // Never expires
    status: 'verified',
    colorTheme: 'neutral',
    licence_id: 'WC-NSW-445678',
    rto_code: 'RTO 91172',
  },
];

/**
 * Get a color theme based on credential status or category.
 * Falls back to 'cyan' (brand default) if no match.
 */
export function inferColorTheme(credential: Credential): Credential['colorTheme'] {
  // If already has a theme, use it
  if (credential.colorTheme) return credential.colorTheme;

  // Infer from status
  if (credential.status === 'expired') return 'rose';
  if (credential.status === 'processing') return 'slate';

  // Infer from category
  const category = credential.category?.toLowerCase() ?? '';
  if (category.includes('safety') || category.includes('construction')) return 'blue';
  if (category.includes('health') || category.includes('first aid')) return 'emerald';
  if (category.includes('traffic')) return 'indigo';
  if (category.includes('machinery') || category.includes('forklift')) return 'slate';
  if (category.includes('induction') || category.includes('white card')) return 'neutral';

  // Default to brand gradient
  return 'cyan';
}

/**
 * Infer status from expiry date if not already set.
 */
export function inferStatus(credential: Credential): Credential['status'] {
  if (credential.status) return credential.status;

  if (!credential.expires_at) return 'verified'; // No expiry = always valid

  const expiryDate = new Date(credential.expires_at);
  const now = new Date();

  if (expiryDate < now) return 'expired';

  return 'verified';
}
