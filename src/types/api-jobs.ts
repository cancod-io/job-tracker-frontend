import type { ApiFetchChangeType } from "@/types/api-fetch-runs";
import type { JobAtsStatus } from "@/types/job";

/** Canonical ATS statuses used in the jobs UI and list filters. */
export type ApiJobAtsStatus = JobAtsStatus;

/** Subset of `raw_payload` from upstream job search rows. */
export type ApiJobRawPayload = {
  job_posted_at?: string | null;
  job_google_link?: string | null;
  employer_website?: string | null;
  job_publisher?: string | null;
};

/** List row returned by `GET /api/v1/jobs` (snake_case from Python API). */
export type ApiJobListItem = {
  id: number;
  /** Primary title field from upstream. */
  job_title?: string;
  /** Legacy / alternate title field. */
  title?: string;
  company: string;
  /** Upstream scrape / ingest source id (e.g. `serpapi`) — use for filtering. */
  source?: string | null;
  /** Human-readable source label from the API — use for display. */
  source_label?: string | null;
  location?: string | null;
  salary?: string | null;
  is_remote?: boolean;
  job_type?: string | null;
  experience_level?: string | null;
  skills?: string[] | null;
  shopify_relevance_score?: number | null;
  /** Raw value from the API — normalize with `normalizeAtsStatusFromApi` before display. */
  ats_status: string;
  apply_url: string;
  company_logo_url?: string | null;
  description?: string | null;
  posted_at?: string | null;
  discovered_at?: string;
  created_at?: string;
  raw_payload?: ApiJobRawPayload | null;
  is_active?: boolean;
  /**
   * Per-user “unseen” flag for the discovery New badge.
   * Cleared by `POST /api/v1/jobs/{id}/acknowledge`. Not the same as `ats_status`.
   */
  is_new?: boolean;
};

export type ApiJobListResponse = {
  items: ApiJobListItem[];
  total: number;
  limit: number;
  offset: number;
};

/** `GET /api/v1/jobs` — `sort_by` query values (pipeline sort / filter). */
export const API_JOBS_SORT_BY = [
  "new",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;
export type ApiJobsSortBy = (typeof API_JOBS_SORT_BY)[number];

export function jobsSortByLabel(sortBy: ApiJobsSortBy): string {
  switch (sortBy) {
    case "new":
      return "New (newest first)";
    case "applied":
      return "Applied";
    case "interviewing":
      return "Interviewing";
    case "offer":
      return "Offer";
    case "rejected":
      return "Failed";
  }
}

export const API_JOB_ATS_STATUSES = [
  "new",
  "applied",
  "interviewing",
  "offer",
  "failed",
] as const satisfies readonly ApiJobAtsStatus[];

/** Maps API `ats_status` strings to the canonical UI status. */
export function normalizeAtsStatusFromApi(raw: string): JobAtsStatus {
  switch (raw) {
    case "new":
    case "applied":
    case "interviewing":
    case "offer":
    case "failed":
      return raw;
    case "rejected":
      return "failed";
    case "shortlisted":
    case "archived":
      return "new";
    default:
      return "new";
  }
}

export type FetchJobsListParams = {
  limit?: number;
  offset?: number;
  sort_by?: ApiJobsSortBy;
  /** Exact match on scraper/source name; omit for all sources. */
  source?: string;
  include_inactive?: boolean;
  include_duplicates?: boolean;
  q?: string;
  title?: string;
  company?: string;
  location?: string;
  /** Filter jobs by fetch diff — requires `source`. Omit `fetch_run_id` for latest run. */
  fetch_run_id?: number;
  fetch_change?: ApiFetchChangeType;
  /** Inclusive posted-at range (`YYYY-MM-DD` keys converted to UTC ISO before send). */
  posted_from?: string;
  posted_to?: string;
  /** When true, only jobs with `is_new=true` (for global new-count queries). */
  is_new?: boolean;
};

export type JobSourceOption = {
  id: string;
  label: string;
};

export type ApiJobSourcesResponse = {
  sources: JobSourceOption[];
};
