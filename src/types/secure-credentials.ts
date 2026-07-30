/** Mirrors OpenAPI schemas for `/api/v1/credentials` (user vault — own rows only). */

export type CredentialType = "pc_login" | "company_email" | "api_key" | "other";

/**
 * List/detail response.
 * Username and notes may be returned in plaintext; secret is optional (present on detail
 * for reveal in the edit form). Never render secret in the list table.
 */
export type SecureCredential = {
  id: number;
  owner_user_id: number;
  owner_name: string | null;
  service_name: string;
  credential_type: CredentialType;
  username: string | null;
  notes: string | null;
  /** Present when the API returns it (e.g. detail); used only for edit reveal. */
  secret: string | null;
  has_username: boolean;
  has_secret: boolean;
  has_notes: boolean;
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

/** Payload for `POST /api/v1/credentials`. */
export type SecureCredentialCreateRequest = {
  service_name: string;
  credential_type?: CredentialType;
  username?: string | null;
  secret: string;
  notes?: string | null;
};

/** Payload for `PUT /api/v1/credentials/{id}` — omit `secret` to keep existing. */
export type SecureCredentialUpdateRequest = {
  service_name?: string;
  credential_type?: CredentialType;
  username?: string | null;
  secret?: string;
  notes?: string | null;
  clear_username?: boolean;
  clear_notes?: boolean;
};
