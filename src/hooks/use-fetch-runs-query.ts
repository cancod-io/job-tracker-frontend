"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFetchRunsList } from "@/lib/fetch-runs-api";
import type { ApiFetchRun } from "@/types/api-fetch-runs";

type UseFetchRunsQueryParams = {
  source: string;
  enabled?: boolean;
};

type FetchRunsQueryData = {
  total: number;
  runs: ApiFetchRun[];
};

export function useFetchRunsQuery({ source, enabled = true }: UseFetchRunsQueryParams) {
  const trimmed = source.trim();
  return useQuery<FetchRunsQueryData>({
    queryKey: ["fetch-runs", trimmed],
    enabled: enabled && Boolean(trimmed),
    staleTime: 60_000,
    queryFn: async () => {
      const data = await fetchFetchRunsList({
        source: trimmed,
        page: 1,
        page_size: 50,
      });
      return {
        total: data.total,
        runs: data.items,
      };
    },
  });
}
