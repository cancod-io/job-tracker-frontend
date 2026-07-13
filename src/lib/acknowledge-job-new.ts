import type { QueryClient } from "@tanstack/react-query";
import { acknowledgeJob } from "@/lib/jobs-api";
import { markJobAcknowledgedInJobsListCache } from "@/lib/jobs-list-cache";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";

export type AcknowledgeJobNewOptions = {
  /** Current API `is_new` flag for this job. */
  isNew?: boolean;
};

/**
 * Clears the discovery New badge after the user opens/applies a job.
 *
 * 1. Drops in-session socket highlight immediately
 * 2. Sets `isNew: false` in the jobs-list cache (optimistic)
 * 3. `POST /api/v1/jobs/{id}/acknowledge` so other browsers see `is_new: false`
 *
 * Safe to call after opening the detail panel — does not throw.
 */
export async function acknowledgeJobNewBadge(
  queryClient: QueryClient,
  jobId: string,
  options?: AcknowledgeJobNewOptions,
): Promise<boolean> {
  const trimmed = jobId.trim();
  if (!trimmed) return false;

  const store = useRealtimeJobsStore.getState();
  const wasSocketNew = store.socketNewJobIds.has(trimmed);
  const isNew = options?.isNew === true;

  store.clearSocketNew(trimmed);

  if (!isNew && !wasSocketNew) return false;

  markJobAcknowledgedInJobsListCache(queryClient, trimmed);

  try {
    await acknowledgeJob(trimmed);
    return true;
  } catch {
    // Keep optimistic cache clear for this session; server may still report is_new.
    return false;
  }
}
