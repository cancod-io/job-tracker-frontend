"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJobsList } from "@/lib/jobs-api";
import { mapApiJobListItemToJob } from "@/lib/job-mapper";
import type { Job } from "@/types/job";
import type { ApiJobsSortBy, ApiJobsStack } from "@/types/api-jobs";
import type { ApiFetchChangeType } from "@/types/api-fetch-runs";

type UseJobsListQueryParams = {
  page: number;
  perPage: number;
  sortBy: ApiJobsSortBy;
  source: string;
  stack: ApiJobsStack;
  query: string;
  fetchRunId: number | null;
  fetchChange: ApiFetchChangeType | null;
  postedFrom: string;
  postedTo: string;
};

type JobsListQueryData = {
  total: number;
  jobs: Job[];
};

export type { JobsListQueryData };

export function useJobsListQuery({
  page,
  perPage,
  sortBy,
  source,
  stack,
  query,
  fetchRunId,
  fetchChange,
  postedFrom,
  postedTo,
}: UseJobsListQueryParams) {
  const trimmedSource = source.trim();
  const inDiffMode = Boolean(trimmedSource && fetchChange);

  return useQuery<JobsListQueryData>({
    queryKey: [
      "jobs-list",
      page,
      perPage,
      sortBy,
      trimmedSource,
      stack,
      query,
      fetchRunId,
      fetchChange,
      postedFrom,
      postedTo,
    ],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const offset = (page - 1) * perPage;
      const data = await fetchJobsList({
        limit: perPage,
        offset,
        sort_by: sortBy,
        source: trimmedSource || undefined,
        stack,
        include_inactive: false,
        include_duplicates: false,
        q: query.trim() || undefined,
        fetch_run_id: inDiffMode && fetchRunId != null ? fetchRunId : undefined,
        fetch_change: inDiffMode ? fetchChange ?? undefined : undefined,
        posted_from: postedFrom || undefined,
        posted_to: postedTo || undefined,
      });
      return {
        total: data.total,
        jobs: data.items.map(mapApiJobListItemToJob),
      };
    },
  });
}
