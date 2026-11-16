/**
 * Shared website links — every approved user can CRUD the same list.
 *   GET/POST /api/v1/website-links
 *   GET/PUT/DELETE /api/v1/website-links/{id}
 */
import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  WebsiteLink,
  WebsiteLinkCreateRequest,
  WebsiteLinkListResponse,
  WebsiteLinkUpdateRequest,
} from "@/types/website-links";

const BASE = "/api/v1/website-links";

function normalizeLink(raw: Partial<WebsiteLink> & { id: number }): WebsiteLink {
  return {
    id: raw.id,
    display_index:
      typeof raw.display_index === "number" && Number.isFinite(raw.display_index)
        ? raw.display_index
        : 0,
    url: typeof raw.url === "string" ? raw.url : "",
    description: typeof raw.description === "string" ? raw.description : null,
    created_by_name: typeof raw.created_by_name === "string" ? raw.created_by_name : null,
    updated_by_name: typeof raw.updated_by_name === "string" ? raw.updated_by_name : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

export async function listWebsiteLinks(q?: string): Promise<WebsiteLinkListResponse> {
  const params = new URLSearchParams();
  const search = q?.trim();
  if (search) params.set("q", search);
  const suffix = params.toString() ? `?${params}` : "";
  const res = await fetchAuthed(`${BASE}${suffix}`);
  await assertOkResponse(res, "Failed to load links.");
  const raw = (await res.json()) as { items?: unknown; total?: unknown };
  const items = Array.isArray(raw.items)
    ? (raw.items as Array<Partial<WebsiteLink> & { id: number }>)
        .filter((row) => typeof row?.id === "number")
        .map(normalizeLink)
    : [];
  const total = typeof raw.total === "number" ? raw.total : items.length;
  return { items, total };
}

export async function createWebsiteLink(
  payload: WebsiteLinkCreateRequest,
): Promise<WebsiteLink> {
  const res = await fetchAuthed(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not save link.");
  const raw = (await res.json()) as Partial<WebsiteLink> & { id: number };
  return normalizeLink(raw);
}

export async function updateWebsiteLink(
  linkId: number,
  payload: WebsiteLinkUpdateRequest,
): Promise<WebsiteLink> {
  const res = await fetchAuthed(`${BASE}/${linkId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not update link.");
  const raw = (await res.json()) as Partial<WebsiteLink> & { id: number };
  return normalizeLink(raw);
}

export async function deleteWebsiteLink(linkId: number): Promise<void> {
  const res = await fetchAuthed(`${BASE}/${linkId}`, { method: "DELETE" });
  await assertOkResponse(res, "Could not delete link.");
}
