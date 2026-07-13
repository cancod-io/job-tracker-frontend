import type { QueryClient } from "@tanstack/react-query";
import { acknowledgeJob } from "@/lib/jobs-api";
import { markJobAcknowledgedInJobsListCache } from "@/lib/jobs-list-cache";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";

/**
 * Clear the discovery New badge for a job after the user opens it, clicks Apply,
 * or marks it as applied.
 *
 * Always updates local UI state (session acknowledged set + jobs cache). Then
 * best-effort `POST /api/v1/jobs/{id}/acknowledge` for server `is_new`.
 */
export async function acknowledgeJobNewBadge(
  queryClient: QueryClient,
  jobId: string,
): Promise<boolean> {
  const trimmed = jobId.trim();
  if (!trimmed) return false;

  // 1) Session + socket — prevents processJobsSnapshot from re-adding the badge.
  useRealtimeJobsStore.getState().markJobAcknowledged(trimmed);

  // 2) Optimistic list cache so `job.isNew` flips immediately.
  markJobAcknowledgedInJobsListCache(queryClient, trimmed);

  // 3) Persist on the API (may 404 until backend ships the route).
  try {
    await acknowledgeJob(trimmed);
    return true;
  } catch {
    return false;
  }
}
