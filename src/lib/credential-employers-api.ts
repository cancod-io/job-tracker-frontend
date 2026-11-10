/**
 * User employer folders (`/api/v1/credential-employers`) — own vault only.
 */
import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerListResponse,
  CredentialEmployerUpdateRequest,
} from "@/types/secure-credentials";

const BASE = "/api/v1/credential-employers";

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
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

function normalizeEmployer(
  raw: Partial<CredentialEmployer> & Record<string, unknown> & { id: number },
): CredentialEmployer {
  return {
    id: raw.id,
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    name: typeof raw.name === "string" ? raw.name : "Employer",
    website_url: normalizeNullableString(raw.website_url),
    notes: normalizeNullableString(raw.notes),
    sort_order: nonNegativeInt(raw.sort_order, 0),
    credential_count: nonNegativeInt(raw.credential_count, 0),
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

function isRawEmployer(value: unknown): value is Partial<CredentialEmployer> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export async function listCredentialEmployers(): Promise<CredentialEmployerListResponse> {
  const res = await fetchAuthed(BASE);
  await assertOkResponse(res, "Failed to load employers.");
  const raw = (await res.json()) as { items?: unknown; total?: unknown };
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawEmployer).map(normalizeEmployer)
    : [];
  return { items, total: nonNegativeInt(raw.total, items.length) };
}

export async function createCredentialEmployer(
  payload: CredentialEmployerCreateRequest,
): Promise<CredentialEmployer> {
  const res = await fetchAuthed(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not create employer.");
  const raw = (await res.json()) as Partial<CredentialEmployer> & { id: number };
  return normalizeEmployer(raw);
}

export async function updateCredentialEmployer(
  employerId: number,
  payload: CredentialEmployerUpdateRequest,
): Promise<CredentialEmployer> {
  const res = await fetchAuthed(`${BASE}/${employerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not update employer.");
  const raw = (await res.json()) as Partial<CredentialEmployer> & { id: number };
  return normalizeEmployer(raw);
}

export async function deleteCredentialEmployer(employerId: number): Promise<void> {
  const res = await fetchAuthed(`${BASE}/${employerId}`, {
    method: "DELETE",
  });
  await assertOkResponse(res, "Could not delete employer.");
}
