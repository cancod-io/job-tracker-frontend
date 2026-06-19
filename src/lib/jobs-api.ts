import { fetchAuthed } from "@/lib/auth-session";
import { dateKeyToPostedFromUtc, dateKeyToPostedToUtc, isDateKey } from "@/lib/date-utils";
import { assertOkResponse } from "@/lib/http";
import type { ApiJobListResponse, ApiJobSourcesResponse, FetchJobsListParams } from "@/types/api-jobs";

function appendPostedDateRange(
  search: URLSearchParams,
  postedFrom?: string,
  postedTo?: string,
): void {
  const from = postedFrom?.trim();
  const to = postedTo?.trim();
  if (from && isDateKey(from)) search.set("posted_from", dateKeyToPostedFromUtc(from));
  if (to && isDateKey(to)) search.set("posted_to", dateKeyToPostedToUtc(to));
}

function appendJobsQueryParams(search: URLSearchParams, params: FetchJobsListParams): void {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  search.set("limit", String(limit));
  search.set("offset", String(offset));
  search.set("sort_by", params.sort_by ?? "new");
  search.set("include_inactive", String(params.include_inactive ?? false));
  search.set("include_duplicates", String(params.include_duplicates ?? false));

  const source = params.source?.trim();
  if (source) search.set("source", source);

  const q = params.q?.trim();
  if (q) search.set("q", q);
  const title = params.title?.trim();
  if (title) search.set("title", title);
  const company = params.company?.trim();
  if (company) search.set("company", company);
  const location = params.location?.trim();
  if (location) search.set("location", location);

  if (params.fetch_run_id != null) {
    search.set("fetch_run_id", String(params.fetch_run_id));
  }
  if (params.fetch_change) search.set("fetch_change", params.fetch_change);

  appendPostedDateRange(search, params.posted_from, params.posted_to);
}

export async function fetchJobSources(): Promise<string[]> {
  const res = await fetchAuthed("/api/v1/jobs/sources");

  await assertOkResponse(res, "Could not load job sources.");

  const data = (await res.json()) as ApiJobSourcesResponse;
  return (data.sources ?? []).map((s) => String(s).trim()).filter(Boolean);
}

export async function fetchJobsList(params: FetchJobsListParams = {}): Promise<ApiJobListResponse> {
  const search = new URLSearchParams();
  appendJobsQueryParams(search, params);

  /** Same-origin Next route proxies to the real API — avoids browser CORS for any dev host/IP. */
  const res = await fetchAuthed(`/api/v1/jobs?${search.toString()}`);

  await assertOkResponse(res, "Could not load jobs.");

  return (await res.json()) as ApiJobListResponse;
}
