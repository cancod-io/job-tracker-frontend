/**
 * Browser-side client for the user Secure Credentials vault.
 *
 * Endpoints (own rows only):
 *   GET    /api/v1/credentials              — list (+ vault_scope, employer_id)
 *   GET    /api/v1/credentials/tree         — personal + employers tree
 *   POST   /api/v1/credentials              — create (requires secret)
 *   GET    /api/v1/credentials/{id}         — detail, includes the owner's secret
 *   PUT    /api/v1/credentials/{id}         — update (omit secret to keep)
 *   DELETE /api/v1/credentials/{id}         — delete (204)
 */
import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  CredentialTreeResponse,
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
  VaultScope,
} from "@/types/secure-credentials";

const BASE = "/api/v1/credentials";

export type ListSecureCredentialsParams = {
  page: number;
  page_size: number;
  q?: string;
  credential_type?: CredentialType;
  vault_scope?: VaultScope;
  employer_id?: number;
};

const CREDENTIAL_TYPES: readonly CredentialType[] = [
  "pc_login",
  "gmail",
  "outlook",
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
  if (value === "api_key") return "other";
  return "other";
}

function normalizeVaultScope(value: unknown): VaultScope {
  return value === "job" ? "job" : "personal";
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

export function normalizeCredential(
  raw: Partial<SecureCredential> & Record<string, unknown> & { id: number },
): SecureCredential {
  const username = typeof raw.username === "string" && raw.username.trim() ? raw.username : null;
  const notes = typeof raw.notes === "string" ? raw.notes : null;
  const secret = typeof raw.secret === "string" && raw.secret.length > 0 ? raw.secret : null;

  return {
    id: raw.id,
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    vault_scope: normalizeVaultScope(raw.vault_scope),
    employer_id: normalizeNullableNumber(raw.employer_id),
    employer_name: normalizeNullableString(raw.employer_name),
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

function normalizeTree(raw: Record<string, unknown>): CredentialTreeResponse {
  const personalRaw =
    typeof raw.personal === "object" && raw.personal !== null
      ? (raw.personal as Record<string, unknown>)
      : {};
  const jobsRaw =
    typeof raw.jobs === "object" && raw.jobs !== null ? (raw.jobs as Record<string, unknown>) : {};
  const employersRaw = Array.isArray(jobsRaw.employers) ? jobsRaw.employers : [];

  const personalItems = Array.isArray(personalRaw.items)
    ? (personalRaw.items as unknown[]).filter(isRawCredential).map(normalizeCredential)
    : [];

  const employers = employersRaw
    .filter((e): e is Record<string, unknown> & { id: number } => {
      return typeof e === "object" && e !== null && typeof (e as { id?: unknown }).id === "number";
    })
    .map((emp) => {
      const items = Array.isArray(emp.items)
        ? (emp.items as unknown[]).filter(isRawCredential).map(normalizeCredential)
        : [];
      return {
        id: emp.id,
        name: typeof emp.name === "string" ? emp.name : "Employer",
        website_url: normalizeNullableString(emp.website_url),
        notes: normalizeNullableString(emp.notes),
        sort_order: nonNegativeInt(emp.sort_order, 0),
        count: nonNegativeInt(emp.count, items.length),
        items,
      };
    });

  return {
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    personal: {
      count: nonNegativeInt(personalRaw.count, personalItems.length),
      items: personalItems,
    },
    jobs: {
      employer_count: nonNegativeInt(jobsRaw.employer_count, employers.length),
      credential_count: nonNegativeInt(
        jobsRaw.credential_count,
        employers.reduce((sum, e) => sum + e.count, 0),
      ),
      employers,
    },
  };
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
  if (params.vault_scope) q.set("vault_scope", params.vault_scope);
  if (params.employer_id != null && params.employer_id > 0) {
    q.set("employer_id", String(params.employer_id));
  }

  const res = await fetchAuthed(`${BASE}?${q}`);
  await assertOkResponse(res, "Failed to load credentials.");
  const raw = (await res.json()) as RawListResponse;
  return normalizeListResponse(raw, params.page, params.page_size);
}

export async function getCredentialTree(): Promise<CredentialTreeResponse> {
  const res = await fetchAuthed(`${BASE}/tree`);
  await assertOkResponse(res, "Failed to load vault tree.");
  const raw = (await res.json()) as Record<string, unknown>;
  return normalizeTree(raw);
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
