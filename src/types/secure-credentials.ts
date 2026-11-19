/** Mirrors OpenAPI schemas for `/api/v1/credentials` (user vault — own rows only). */

export type CredentialType =
  | "pc_login"
  | "gmail"
  | "outlook"
  | "company_email"
  | "two_fa_key"
  | "linkedin"
  | "anydesk"
  | "whatsapp"
  | "other";

export type VaultScope = "personal" | "job";

export type SecureCredential = {
  id: number;
  owner_user_id: number;
  owner_name: string | null;
  vault_scope: VaultScope;
  employer_id: number | null;
  employer_name: string | null;
  identity_id: number | null;
  identity_name: string | null;
  identity_country_code: string | null;
  service_name: string;
  credential_type: CredentialType;
  username: string | null;
  notes: string | null;
  secret: string | null;
  has_username: boolean;
  has_secret: boolean;
  has_notes: boolean;
  has_qr_image: boolean;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCredentialListResponse = {
  items: SecureCredential[];
  total: number;
  page: number;
  page_size: number;
};

export type SecureCredentialCreateRequest = {
  service_name: string;
  credential_type?: CredentialType;
  vault_scope?: VaultScope;
  employer_id?: number | null;
  identity_id?: number | null;
  username?: string | null;
  secret?: string | null;
  notes?: string | null;
};

export type SecureCredentialUpdateRequest = {
  service_name?: string;
  credential_type?: CredentialType;
  vault_scope?: VaultScope;
  employer_id?: number | null;
  clear_employer?: boolean;
  identity_id?: number | null;
  clear_identity?: boolean;
  username?: string | null;
  secret?: string;
  notes?: string | null;
  clear_username?: boolean;
  clear_notes?: boolean;
  clear_secret?: boolean;
  clear_qr_image?: boolean;
};

export type CredentialQrExtras = {
  qrFile?: File | null;
  removeQr?: boolean;
};

export type CredentialEmployer = {
  id: number;
  owner_user_id: number;
  owner_name: string | null;
  name: string;
  website_url: string | null;
  notes: string | null;
  sort_order: number;
  credential_count: number;
  created_at: string;
  updated_at: string;
};

export type CredentialEmployerListResponse = {
  items: CredentialEmployer[];
  total: number;
};

export type CredentialEmployerCreateRequest = {
  name: string;
  website_url?: string | null;
  notes?: string | null;
  sort_order?: number;
};

export type CredentialEmployerUpdateRequest = {
  name?: string;
  website_url?: string | null;
  notes?: string | null;
  sort_order?: number;
  clear_website_url?: boolean;
  clear_notes?: boolean;
};

export type CredentialIdentity = {
  id: number;
  owner_user_id: number;
  owner_name: string | null;
  display_name: string;
  country_code: string | null;
  notes: string | null;
  credential_count: number;
  created_at: string;
  updated_at: string;
};

export type CredentialIdentityListResponse = {
  items: CredentialIdentity[];
  total: number;
};

export type CredentialIdentityCreateRequest = {
  display_name: string;
  country_code?: string | null;
  notes?: string | null;
};

export type CredentialIdentityUpdateRequest = {
  display_name?: string;
  country_code?: string | null;
  notes?: string | null;
  clear_country_code?: boolean;
  clear_notes?: boolean;
};

export type CredentialTreeIdentityNode = {
  id: number;
  display_name: string;
  country_code: string | null;
  notes: string | null;
  count: number;
  items: SecureCredential[];
  missing_slots: CredentialType[];
};

export type CredentialTreeEmployerNode = {
  id: number;
  name: string;
  website_url: string | null;
  notes: string | null;
  sort_order: number;
  count: number;
  items: SecureCredential[];
};

export type CredentialTreeResponse = {
  owner_user_id: number;
  owner_name: string | null;
  personal: {
    count: number;
    accounts: {
      identity_count: number;
      credential_count: number;
      identities: CredentialTreeIdentityNode[];
    };
    devices: { count: number; items: SecureCredential[] };
    apps: { count: number; items: SecureCredential[] };
    items: SecureCredential[];
  };
  jobs: {
    employer_count: number;
    credential_count: number;
    employers: CredentialTreeEmployerNode[];
  };
};
