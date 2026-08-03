"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJobsList } from "@/lib/jobs-api";

export const NEW_JOBS_COUNT_QUERY_KEY = ["jobs-new-count"] as const;

/**
 * Total unseen jobs across the whole catalog (`is_new=true`), not just the
 * current jobs list page.
 */
export function useNewJobsCountQuery(enabled = true) {
  return useQuery({
    queryKey: NEW_JOBS_COUNT_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const data = await fetchJobsList({
        is_new: true,
        limit: 1,
        offset: 0,
        include_inactive: false,
        include_duplicates: false,
      });
      return data.total;
    },
    staleTime: 30_000,
  });
}
