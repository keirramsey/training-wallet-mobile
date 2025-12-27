import type { CardThemeKey } from '@/src/theme/tokens';

export type CredentialUnit = {
  code: string;
  title?: string;
};

export type CredentialStatus = 'verified' | 'unverified' | 'expired' | 'processing';

export type CredentialEvidenceKind = 'image';

export type CredentialEvidence = {
  uri: string;
  kind: CredentialEvidenceKind;
  created_at: string;
  meta?: Record<string, unknown>;
};

export type Credential = {
  id: string;
  title: string;
  issuer_name: string;
  issuer_logo_url?: string | null;
  issued_at: string;
  expires_at?: string | null;
  units?: CredentialUnit[];
  status?: CredentialStatus;
  evidence?: CredentialEvidence[];
  // New fields for mockup matching
  category?: string;                 // e.g., "Safety Cert", "Healthcare", "Heavy Machinery"
  colorTheme?: CardThemeKey;         // Theme key from tokens.cardThemes
  licence_id?: string;               // License/certificate number
  rto_code?: string;                 // RTO (Registered Training Organisation) code
};
