import type { Job } from "@/types/job";

type TrackedLike = unknown;

/**
 * Whether a job should show the discovery New badge / highlight.
 * Uses API `is_new` (`job.isNew`) and in-session socket ingest ids — never `ats_status`.
 * Cleared when the user opens the job, clicks Apply, or marks applied.
 */
export function shouldShowJobNewBadge(
  job: Job,
  socketNewJobIds: Set<string>,
  acknowledgedJobIds: Set<string>,
  trackedInfo?: TrackedLike,
): boolean {
  if (trackedInfo) return false;
  if (acknowledgedJobIds.has(job.id)) return false;
  return job.isNew || socketNewJobIds.has(job.id);
}
