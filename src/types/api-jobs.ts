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
};

export type ApiJobListResponse = {
  items: ApiJobListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiJobsListSort = "relevance" | "newest";

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
      return "new";
    default:
      return "new";
  }
}

/** Maps UI filter status to the query value expected by the Python API. */
export function toBackendAtsStatus(status: ApiJobAtsStatus): string {
  return status === "failed" ? "rejected" : status;
}

export type FetchJobsListParams = {
  limit?: number;
  offset?: number;
  sort?: ApiJobsListSort;
  ats_status?: ApiJobAtsStatus;
  include_inactive?: boolean;
  include_duplicates?: boolean;
  q?: string;
  title?: string;
  company?: string;
  location?: string;
};
