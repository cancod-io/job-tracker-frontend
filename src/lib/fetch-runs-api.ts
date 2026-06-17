import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse } from "@/lib/http";
import type {
  ApiFetchRunDetailResponse,
  ApiFetchRunItemsResponse,
  ApiFetchRunsListResponse,
  ApiLatestFetchRunResponse,
  FetchLatestRunParams,
  FetchRunItemsParams,
  FetchRunsListParams,
} from "@/types/api-fetch-runs";

function appendFetchRunsListParams(search: URLSearchParams, params: FetchRunsListParams): void {
  const source = params.source?.trim();
  if (source) search.set("source", source);
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.page_size ?? 50));
}

export async function fetchFetchRunsList(
  params: FetchRunsListParams = {},
): Promise<ApiFetchRunsListResponse> {
  const search = new URLSearchParams();
  appendFetchRunsListParams(search, params);

  const res = await fetchAuthed(`/api/v1/jobs/fetch-runs?${search.toString()}`);
  await assertOkResponse(res, "Could not load fetch runs.");
  return (await res.json()) as ApiFetchRunsListResponse;
}

export async function fetchLatestFetchRun(
  params: FetchLatestRunParams,
): Promise<ApiLatestFetchRunResponse> {
  const search = new URLSearchParams();
  search.set("source", params.source.trim());

  const res = await fetchAuthed(`/api/v1/jobs/fetch-runs/latest?${search.toString()}`);
  await assertOkResponse(res, "Could not load latest fetch run.");
  return (await res.json()) as ApiLatestFetchRunResponse;
}

export async function fetchFetchRunDetail(runId: number): Promise<ApiFetchRunDetailResponse> {
  const res = await fetchAuthed(`/api/v1/jobs/fetch-runs/${runId}`);
  await assertOkResponse(res, "Could not load fetch run.");
  return (await res.json()) as ApiFetchRunDetailResponse;
}

export async function fetchFetchRunItems(
  runId: number,
  params: FetchRunItemsParams = {},
): Promise<ApiFetchRunItemsResponse> {
  const search = new URLSearchParams();
  if (params.change_type) search.set("change_type", params.change_type);
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.page_size ?? 100));

  const res = await fetchAuthed(
    `/api/v1/jobs/fetch-runs/${runId}/items?${search.toString()}`,
  );
  await assertOkResponse(res, "Could not load fetch run items.");
  return (await res.json()) as ApiFetchRunItemsResponse;
}
