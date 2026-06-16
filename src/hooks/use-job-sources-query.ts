"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJobSources } from "@/lib/jobs-api";

const STALE_MS = 5 * 60 * 1000;

/** Distinct job sources for the filter dropdown (`GET /api/v1/jobs/sources`). */
export function useJobSourcesQuery() {
  return useQuery({
    queryKey: ["job-sources"],
    queryFn: fetchJobSources,
    staleTime: STALE_MS,
  });
}
