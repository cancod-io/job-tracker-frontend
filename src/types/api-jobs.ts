/** Mirrors `JobAtsStatus` from the backend OpenAPI schema. */
export type ApiJobAtsStatus =
  | "new"
  | "shortlisted"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "archived";

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
  ats_status: ApiJobAtsStatus;
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

export type FetchJobsListParams = {
  limit?: number;
  offset?: number;
  sort?: ApiJobsListSort;
  include_inactive?: boolean;
  include_duplicates?: boolean;
  q?: string;
  title?: string;
  company?: string;
  location?: string;
};
