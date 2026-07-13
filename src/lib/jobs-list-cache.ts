import type { QueryClient } from "@tanstack/react-query";
import type { Job } from "@/types/job";

export type JobsListQueryData = {
  total: number;
  jobs: Job[];
};

/** Remove a single job from every cached `jobs-list` query (all filter/page variants). */
export function removeJobFromJobsListCache(queryClient: QueryClient, jobId: number): void {
  const id = String(jobId);
  let removedFromCache = false;

  queryClient.setQueriesData<JobsListQueryData>({ queryKey: ["jobs-list"] }, (old) => {
    if (!old) return old;
    const jobs = old.jobs.filter((job) => job.id !== id);
    if (jobs.length === old.jobs.length) return old;
    removedFromCache = true;
    return { total: Math.max(0, old.total - 1), jobs };
  });

  if (!removedFromCache) {
    void queryClient.invalidateQueries({ queryKey: ["jobs-list"] });
  }
}

/** Clear `isNew` on a job across every cached `jobs-list` query (after acknowledge). */
export function markJobAcknowledgedInJobsListCache(
  queryClient: QueryClient,
  jobId: string | number,
): void {
  const id = String(jobId);

  queryClient.setQueriesData<JobsListQueryData>({ queryKey: ["jobs-list"] }, (old) => {
    if (!old) return old;
    let changed = false;
    const jobs = old.jobs.map((job) => {
      if (job.id !== id || !job.isNew) return job;
      changed = true;
      return { ...job, isNew: false };
    });
    return changed ? { ...old, jobs } : old;
  });
}
