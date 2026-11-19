import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  CredentialIdentity,
  CredentialIdentityCreateRequest,
  CredentialIdentityListResponse,
  CredentialIdentityUpdateRequest,
} from "@/types/secure-credentials";

const BASE = "/api/v1/credential-identities";

function normalizeIdentity(raw: Partial<CredentialIdentity> & { id: number }): CredentialIdentity {
  return {
    id: raw.id,
    owner_user_id: typeof raw.owner_user_id === "number" ? raw.owner_user_id : 0,
    owner_name: typeof raw.owner_name === "string" ? raw.owner_name : null,
    display_name: typeof raw.display_name === "string" ? raw.display_name : "Identity",
    country_code: typeof raw.country_code === "string" ? raw.country_code : null,
    notes: typeof raw.notes === "string" ? raw.notes : null,
    credential_count: typeof raw.credential_count === "number" ? raw.credential_count : 0,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

export async function listCredentialIdentities(): Promise<CredentialIdentityListResponse> {
  const res = await fetchAuthed(BASE);
  await assertOkResponse(res, "Failed to load identities.");
  const raw = (await res.json()) as { items?: unknown; total?: unknown };
  const items = Array.isArray(raw.items)
    ? (raw.items as Array<Partial<CredentialIdentity> & { id: number }>)
        .filter((row) => typeof row?.id === "number")
        .map(normalizeIdentity)
    : [];
  return { items, total: typeof raw.total === "number" ? raw.total : items.length };
}

export async function createCredentialIdentity(
  payload: CredentialIdentityCreateRequest,
): Promise<CredentialIdentity> {
  const res = await fetchAuthed(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not create identity.");
  return normalizeIdentity((await res.json()) as Partial<CredentialIdentity> & { id: number });
}

export async function updateCredentialIdentity(
  identityId: number,
  payload: CredentialIdentityUpdateRequest,
): Promise<CredentialIdentity> {
  const res = await fetchAuthed(`${BASE}/${identityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not update identity.");
  return normalizeIdentity((await res.json()) as Partial<CredentialIdentity> & { id: number });
}

export async function deleteCredentialIdentity(identityId: number): Promise<void> {
  const res = await fetchAuthed(`${BASE}/${identityId}`, { method: "DELETE" });
  await assertOkResponse(res, "Could not delete identity.");
}
