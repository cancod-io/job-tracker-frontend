"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJobsList } from "@/lib/jobs-api";
import { mapApiJobListItemToJob } from "@/lib/job-mapper";
import type { JobsListAtsStatusFilter, JobsListSortMode } from "@/components/jobs/types";
import type { Job } from "@/types/job";

type UseJobsListQueryParams = {
  page: number;
  perPage: number;
  sort: JobsListSortMode;
  atsStatus: JobsListAtsStatusFilter;
  query: string;
};

type JobsListQueryData = {
  total: number;
  jobs: Job[];
};

export function useJobsListQuery({
  page,
  perPage,
  sort,
  atsStatus,
  query,
}: UseJobsListQueryParams) {
  return useQuery<JobsListQueryData>({
    queryKey: ["jobs-list", page, perPage, sort, atsStatus, query],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const offset = (page - 1) * perPage;
      const data = await fetchJobsList({
        limit: perPage,
        offset,
        sort,
        ats_status: atsStatus === "all" ? undefined : atsStatus,
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
