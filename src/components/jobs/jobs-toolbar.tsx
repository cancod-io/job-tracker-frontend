"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { JobsDateRangeFilter } from "@/components/jobs/jobs-date-range-filter";
import { ALL_JOB_SOURCES_VALUE } from "@/components/jobs/types";
import { API_JOBS_SORT_BY, jobsSortByLabel } from "@/types/api-jobs";
import type { JobSourceOption } from "@/types/api-jobs";
import type { JobsViewMode } from "@/components/jobs/types";
import type { ApiJobsSortBy } from "@/types/api-jobs";
import { useJobFiltersStore } from "@/store/job-filters";

type JobsToolbarProps = {
  total: number;
  loading: boolean;
  viewMode: JobsViewMode;
  onViewModeChange: (mode: JobsViewMode) => void;
  sortBy: ApiJobsSortBy;
  onSortByChange: (sortBy: ApiJobsSortBy) => void;
  source: string;
  onSourceChange: (source: string) => void;
  sourceOptions: JobSourceOption[];
  sourcesLoading?: boolean;
  postedFrom: string;
  postedTo: string;
  onPostedDateChange: (from: string, to: string) => void;
};

/**
 * Toolbar above the jobs list: search, source filter, sort_by, and view-mode toggle.
 */
export function JobsToolbar({
  total,
  loading,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  source,
  onSourceChange,
  sourceOptions,
  sourcesLoading = false,
  postedFrom,
  postedTo,
  onPostedDateChange,
}: JobsToolbarProps) {
  const { query, setQuery } = useJobFiltersStore();

  return (
    <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      {/* Left: heading + count */}
      <div className="min-w-0 flex-1 space-y-1">
        <h2
          id="jobs-heading"
          className="text-lg tracking-tight text-foreground md:text-xl"
        >
          Job listings
        </h2>
        <p
          className="text-xs tabular-nums text-muted-foreground md:text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {!loading && total > 0 ? `${total.toLocaleString()} jobs found` : ""}
        </p>
      </div>

      {/* Right: controls */}
      <div className="flex flex-wrap items-end justify-end gap-3 sm:shrink-0">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search jobs…"
          aria-label="Search jobs"
          className="w-full sm:w-64"
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="jobs-source-filter" className="sr-only">
            Filter by source
          </label>
          <select
            id="jobs-source-filter"
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            disabled={sourcesLoading}
            className="form-control h-10 min-w-[10.5rem] cursor-pointer rounded-xl text-sm shadow-sm sm:min-w-[12rem] disabled:cursor-wait disabled:opacity-70"
            aria-label="Filter jobs by source"
          >
            <option value={ALL_JOB_SOURCES_VALUE}>All sources</option>
            {sourceOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <JobsDateRangeFilter
          from={postedFrom}
          to={postedTo}
          onChange={onPostedDateChange}
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="jobs-sort-by" className="sr-only">
            Sort by
          </label>
          <select
            id="jobs-sort-by"
            value={sortBy}
            onChange={(e) => {
              const v = e.target.value;
              if ((API_JOBS_SORT_BY as readonly string[]).includes(v)) {
                onSortByChange(v as ApiJobsSortBy);
              }
            }}
            className="form-control h-10 min-w-[10.5rem] cursor-pointer rounded-xl text-sm shadow-sm sm:min-w-[12rem]"
            aria-label="Sort jobs"
          >
            {API_JOBS_SORT_BY.map((value) => (
              <option key={value} value={value}>
                {jobsSortByLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div
          className="inline-flex shrink-0 rounded-full border border-input bg-muted/50 p-1 shadow-sm"
          role="group"
          aria-label="Job list layout"
        >
          {(["list", "card"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              {mode === "list" ? (
                <List className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
              )}
              {mode === "list" ? "List" : "Cards"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
