"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseAtsStatusFromSearchParams,
  parsePageFromSearchParams,
  parsePerPageFromSearchParams,
  parseSortFromSearchParams,
  type JobsListAtsStatusFilter,
  type JobsListSortMode,
  type PageSizeOption,
} from "@/components/jobs/types";

export type JobsListUrlState = {
  page: number;
  sort: JobsListSortMode;
  perPage: PageSizeOption;
  atsStatus: JobsListAtsStatusFilter;
  /** Stable serialized form of the URL params — safe to use as a dep key. */
  searchParamsKey: string;
};

/**
 * Reads page/sort/perPage/atsStatus from the URL in a single allocation,
 * memoized against the serialized search-params string.
 */
export function useJobsListUrlState(): JobsListUrlState {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  return useMemo(() => {
    const sp = new URLSearchParams(searchParamsKey);
    return {
      page: parsePageFromSearchParams(sp),
      sort: parseSortFromSearchParams(sp),
      perPage: parsePerPageFromSearchParams(sp),
      atsStatus: parseAtsStatusFromSearchParams(sp),
      searchParamsKey,
    };
  }, [searchParamsKey]);
}
