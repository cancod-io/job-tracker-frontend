/** Added-only ingest model — every posted job is new by `apply_url`. */
export const API_FETCH_CHANGE_TYPES = ["added"] as const;

export type ApiFetchChangeType = (typeof API_FETCH_CHANGE_TYPES)[number];

export function fetchChangeLabel(_change: ApiFetchChangeType = "added"): string {
  return "Added";
}

/** Summary row from `GET /api/v1/jobs/fetch-runs`. */
export type ApiFetchRun = {
  id: number;
  source: string;
  external_run_id?: string | null;
  scraper_name?: string | null;
  started_at: string;
  previous_run_id: number | null;
  total_jobs: number;
  added_count: number;
  /** Mapped rows before filters — optional from backend/scraper. */
  received_count?: number;
  blocked_count?: number;
  /** @deprecated always 0 — added-only model */
  updated_count?: number;
  /** @deprecated always 0 — added-only model */
  unchanged_count?: number;
  /** @deprecated always 0 — added-only model */
  removed_count?: number;
  created_at?: string;
};

export type FetchRunSummary = Pick<
  ApiFetchRun,
  | "id"
  | "source"
  | "external_run_id"
  | "added_count"
  | "received_count"
  | "blocked_count"
  | "updated_count"
  | "unchanged_count"
  | "removed_count"
> & {
  run_id?: number;
};

export type ApiFetchRunsListResponse = {
  items: ApiFetchRun[];
  total: number;
  page: number;
  page_size: number;
};

export type ApiLatestFetchRunResponse = {
  source: string;
  run: ApiFetchRun | null;
};

export type ApiFetchRunDiffItem = {
  id: number;
  change_type: ApiFetchChangeType;
  apply_url?: string | null;
  job_id?: number | null;
  job_title?: string | null;
  company?: string | null;
};

export type ApiFetchRunDetailResponse = ApiFetchRun & {
  items: ApiFetchRunDiffItem[];
};

export type ApiFetchRunItemsResponse = {
  run_id: number;
  change_type: ApiFetchChangeType | null;
  items: ApiFetchRunDiffItem[];
  total: number;
  page: number;
  page_size: number;
};

export type FetchRunsListParams = {
  source?: string;
  page?: number;
  page_size?: number;
};

export type FetchLatestRunParams = {
  source: string;
};

export type FetchRunItemsParams = {
  change_type?: ApiFetchChangeType;
  page?: number;
  page_size?: number;
};

/** Compact run card label: "Added: N · Blocked: N" */
export function formatFetchRunCountSummary(
  run: Pick<ApiFetchRun, "added_count" | "blocked_count" | "received_count">,
): string {
  const parts = [`Added: ${run.added_count}`];
  if (run.blocked_count != null && run.blocked_count > 0) {
    parts.push(`Blocked: ${run.blocked_count}`);
  }
  if (run.received_count != null && run.received_count > 0) {
    parts.push(`Received: ${run.received_count}`);
  }
  return parts.join(" · ");
}

export function fetchRunEmptyMessage(
  run: Pick<ApiFetchRun, "added_count" | "blocked_count">,
): string {
  if (run.added_count === 0) {
    return "No new jobs — all apply URLs already exist.";
  }
  return "No jobs in this ingest run.";
}
