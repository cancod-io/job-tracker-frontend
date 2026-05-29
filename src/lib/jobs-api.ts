import { authRequestHeaders } from "@/lib/auth-token";
import { assertOkResponse, fetchWithTimeout } from "@/lib/http";
import type { ApiJobListResponse, FetchJobsListParams } from "@/types/api-jobs";

function appendJobsQueryParams(search: URLSearchParams, params: FetchJobsListParams): void {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  search.set("limit", String(limit));
  search.set("offset", String(offset));
  search.set("sort_by", params.sort_by ?? "new");
  search.set("include_inactive", String(params.include_inactive ?? false));
  search.set("include_duplicates", String(params.include_duplicates ?? false));

  const q = params.q?.trim();
  if (q) search.set("q", q);
  const title = params.title?.trim();
  if (title) search.set("title", title);
  const company = params.company?.trim();
  if (company) search.set("company", company);
  const location = params.location?.trim();
  if (location) search.set("location", location);
}

export async function fetchJobsList(params: FetchJobsListParams = {}): Promise<ApiJobListResponse> {
  const search = new URLSearchParams();
  appendJobsQueryParams(search, params);

  /** Same-origin Next route proxies to the real API — avoids browser CORS for any dev host/IP. */
  const res = await fetchWithTimeout(`/api/v1/jobs?${search.toString()}`, {
    headers: authRequestHeaders(),
    credentials: "omit",
  });

  await assertOkResponse(res, "Could not load jobs.");

  return (await res.json()) as ApiJobListResponse;
}
