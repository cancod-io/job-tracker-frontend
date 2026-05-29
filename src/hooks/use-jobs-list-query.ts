"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJobsList } from "@/lib/jobs-api";
import { mapApiJobListItemToJob } from "@/lib/job-mapper";
import type { Job } from "@/types/job";
import type { ApiJobsSortBy } from "@/types/api-jobs";

type UseJobsListQueryParams = {
  page: number;
  perPage: number;
  sortBy: ApiJobsSortBy;
  query: string;
};

type JobsListQueryData = {
  total: number;
  jobs: Job[];
};

export function useJobsListQuery({
  page,
  perPage,
  sortBy,
  query,
}: UseJobsListQueryParams) {
  return useQuery<JobsListQueryData>({
    queryKey: ["jobs-list", page, perPage, sortBy, query],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const offset = (page - 1) * perPage;
      const data = await fetchJobsList({
        limit: perPage,
        offset,
        sort_by: sortBy,
        include_inactive: false,
        include_duplicates: false,
        q: query.trim() || undefined,
      });
      return {
        total: data.total,
        jobs: data.items.map(mapApiJobListItemToJob),
      };
    },
  });
}
