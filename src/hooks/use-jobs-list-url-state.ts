"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parsePageFromSearchParams,
  parsePerPageFromSearchParams,
  parseSortByFromSearchParams,
  parseSourceFromSearchParams,
  parseFetchChangeFromSearchParams,
  parseFetchRunIdFromSearchParams,
  type PageSizeOption,
} from "@/components/jobs/types";
import type { ApiJobsSortBy } from "@/types/api-jobs";
import type { ApiFetchChangeType } from "@/types/api-fetch-runs";

export type JobsListUrlState = {
  page: number;
  sortBy: ApiJobsSortBy;
  source: string;
  perPage: PageSizeOption;
  fetchRunId: number | null;
  fetchChange: ApiFetchChangeType | null;
  /** Stable serialized form of the URL params — safe to use as a dep key. */
  searchParamsKey: string;
};

/**
 * Reads page, sort_by, source, and per_page from the URL in a single allocation,
 * memoized against the serialized search-params string.
 */
export function useJobsListUrlState(): JobsListUrlState {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  return useMemo(() => {
    const sp = new URLSearchParams(searchParamsKey);
    return {
      page: parsePageFromSearchParams(sp),
      sortBy: parseSortByFromSearchParams(sp),
      source: parseSourceFromSearchParams(sp),
      perPage: parsePerPageFromSearchParams(sp),
      fetchRunId: parseFetchRunIdFromSearchParams(sp),
      fetchChange: parseFetchChangeFromSearchParams(sp),
      searchParamsKey,
    };
  }, [searchParamsKey]);
}
