export type CredentialUnit = {
  code: string;
  title?: string;
};

export type CredentialStatus = 'verified' | 'unverified';

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
};
