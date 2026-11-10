/**
 * Browser-side client for the user Secure Credentials vault.
 *
 * Endpoints (own rows only):
 *   GET    /api/v1/credentials              — list (page, page_size, q, credential_type)
 *   POST   /api/v1/credentials              — create (requires secret)
 *   GET    /api/v1/credentials/{id}         — detail, includes the owner's secret
 *   PUT    /api/v1/credentials/{id}         — update (omit secret to keep)
 *   DELETE /api/v1/credentials/{id}         — delete (204)
 *
 * The list omits secrets. Opening a credential returns the secret so it can be shown or copied.
 */
import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

const BASE = "/api/v1/credentials";

export type ListSecureCredentialsParams = {
  page: number;
  page_size: number;
  q?: string;
  credential_type?: CredentialType;
};

const CREDENTIAL_TYPES: readonly CredentialType[] = [
  "pc_login",
  "company_email",
  "two_fa_key",
  "other",
];

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function normalizeCredentialType(value: unknown): CredentialType {
  if (typeof value === "string" && CREDENTIAL_TYPES.includes(value as CredentialType)) {
    return value as CredentialType;
  }
  // Legacy value before API Key was replaced by 2FA Key.
  if (value === "api_key") return "other";
  return "other";
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeCredential(
  raw: Partial<SecureCredential> & Record<string, unknown> & { id: number },
): SecureCredential {
  const username = typeof raw.username === "string" && raw.username.trim() ? raw.username : null;
  const notes = typeof raw.notes === "string" ? raw.notes : null;
  // Secret only kept when the API explicitly returns it (for edit reveal). Never invent it.
  const secret = typeof raw.secret === "string" && raw.secret.length > 0 ? raw.secret : null;

  return {
    id: raw.id,
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    service_name: typeof raw.service_name === "string" ? raw.service_name : "—",
    credential_type: normalizeCredentialType(raw.credential_type),
    username,
    notes,
    secret,
    has_username: raw.has_username === true || Boolean(username),
    has_secret: raw.has_secret === true || Boolean(secret),
    has_notes: raw.has_notes === true || Boolean(notes?.trim()),
    created_by_name: normalizeNullableString(raw.created_by_name),
    updated_by_name: normalizeNullableString(raw.updated_by_name),
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

type RawListResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  page_size?: unknown;
};

function isRawCredential(value: unknown): value is Partial<SecureCredential> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

function normalizeListResponse(
  raw: RawListResponse,
  requestedPage: number,
  requestedPageSize: number,
): SecureCredentialListResponse {
  const pageSize = positiveInt(raw.page_size, requestedPageSize);
  const page = positiveInt(raw.page, requestedPage);
  const total = nonNegativeInt(raw.total, 0);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawCredential).map(normalizeCredential)
    : [];

  return { items, total, page, page_size: pageSize };
}

export async function listSecureCredentials(
  params: ListSecureCredentialsParams,
): Promise<SecureCredentialListResponse> {
  const q = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const search = params.q?.trim();
  if (search) q.set("q", search);
  if (params.credential_type) q.set("credential_type", params.credential_type);

  const res = await fetchAuthed(`${BASE}?${q}`);
  await assertOkResponse(res, "Failed to load credentials.");
  const raw = (await res.json()) as RawListResponse;
  return normalizeListResponse(raw, params.page, params.page_size);
}

export async function getSecureCredential(credentialId: number): Promise<SecureCredential> {
  const res = await fetchAuthed(`${BASE}/${credentialId}`);
  await assertOkResponse(res, "Failed to load credential.");
  const raw = (await res.json()) as Partial<SecureCredential> & { id: number };
  return normalizeCredential(raw);
}

export async function createSecureCredential(
  payload: SecureCredentialCreateRequest,
): Promise<SecureCredential> {
  const res = await fetchAuthed(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not save credential.");
  const raw = (await res.json()) as Partial<SecureCredential> & { id: number };
  return normalizeCredential(raw);
}

export async function updateSecureCredential(
  credentialId: number,
  payload: SecureCredentialUpdateRequest,
): Promise<SecureCredential> {
  const res = await fetchAuthed(`${BASE}/${credentialId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not update credential.");
  const raw = (await res.json()) as Partial<SecureCredential> & { id: number };
  return normalizeCredential(raw);
}

export async function deleteSecureCredential(credentialId: number): Promise<void> {
  const res = await fetchAuthed(`${BASE}/${credentialId}`, {
    method: "DELETE",
  });
  await assertOkResponse(res, "Could not delete credential.");
}
