import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  ApiApplication,
  ApiApplicationsListResponse,
  ApiApplicationStatus,
  CreateApplicationPayload,
  UpdateApplicationPayload,
} from "@/types/application";

export async function fetchApplicationsList(params: {
  limit?: number;
  offset?: number;
  status?: ApiApplicationStatus;
} = {}): Promise<ApiApplicationsListResponse> {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 100));
  search.set("offset", String(params.offset ?? 0));
  if (params.status) search.set("status", params.status);

  const res = await fetchAuthed(`/api/v1/applications?${search.toString()}`);

  await assertOkResponse(res, "Failed to load applications.");

  const data = await res.json();
  if (Array.isArray(data)) {
    return { items: data as ApiApplication[], total: data.length, limit: params.limit ?? 100, offset: params.offset ?? 0 };
  }
  return data as ApiApplicationsListResponse;
}

export async function createApplication(payload: CreateApplicationPayload): Promise<ApiApplication> {
  const res = await fetchAuthed("/api/v1/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOkResponse(res, "Could not save application.");

  return (await res.json()) as ApiApplication;
}

export async function updateApplication(
  id: number,
  payload: UpdateApplicationPayload,
): Promise<ApiApplication> {
  const res = await fetchAuthed(`/api/v1/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOkResponse(res, "Could not update application.");

  return (await res.json()) as ApiApplication;
}

export async function deleteApplication(id: number): Promise<void> {
  const res = await fetchAuthed(`/api/v1/applications/${id}`, {
    method: "DELETE",
  });

  await assertOkResponse(res, "Could not remove application.");
}
