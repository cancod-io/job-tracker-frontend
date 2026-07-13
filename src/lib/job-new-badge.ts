import type { Job } from "@/types/job";

type TrackedLike = unknown;

/**
 * Whether a job should show the discovery New badge / highlight.
 * Uses API `is_new` (`job.isNew`) and in-session socket ingest ids — never `ats_status`.
 * Cleared by `POST /api/v1/jobs/{id}/acknowledge` (cache sets `isNew: false`).
 */
export function shouldShowJobNewBadge(
  job: Job,
  socketNewJobIds: Set<string>,
  trackedInfo?: TrackedLike,
): boolean {
  if (trackedInfo) return false;
  return job.isNew || socketNewJobIds.has(job.id);
}
