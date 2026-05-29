"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parsePageFromSearchParams,
  parsePerPageFromSearchParams,
  parseSortByFromSearchParams,
  type PageSizeOption,
} from "@/components/jobs/types";
import type { ApiJobsSortBy } from "@/types/api-jobs";

export type JobsListUrlState = {
  page: number;
  sortBy: ApiJobsSortBy;
  perPage: PageSizeOption;
  /** Stable serialized form of the URL params — safe to use as a dep key. */
  searchParamsKey: string;
};

/**
 * Reads page, sort_by, and per_page from the URL in a single allocation,
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
      perPage: parsePerPageFromSearchParams(sp),
      searchParamsKey,
    };
  }, [searchParamsKey]);
}
