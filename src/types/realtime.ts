export type JobsIngestedEvent = {
  id: string;
  type: "jobs.ingested";
  ts: string;
  payload: JobsIngestedPayload;
};

export type JobsIngestedPayload = {
  run_id: string | null;
  scraper_name: string;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  failed: number;
  blocked: number;
  duration_ms: number;
  /** Numeric ids of newly ingested jobs — used for badges and notifications. */
  added_job_ids?: number[];
  sources: Array<{
    source: string;
    fetch_run_id: number;
    external_run_id: string | null;
    added: number;
    updated: number;
    unchanged: number;
    removed: number;
  }>;
};
