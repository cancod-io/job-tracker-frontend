"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { jobAtsStatusLabel } from "@/lib/application-status-badge";
import { API_JOB_ATS_STATUSES } from "@/types/api-jobs";
import type { JobsViewMode, JobsListAtsStatusFilter } from "@/components/jobs/types";
import { useJobFiltersStore } from "@/store/job-filters";

type JobsToolbarProps = {
  total: number;
  loading: boolean;
  viewMode: JobsViewMode;
  onViewModeChange: (mode: JobsViewMode) => void;
  urlAtsStatus: JobsListAtsStatusFilter;
  onAtsStatusChange: (status: JobsListAtsStatusFilter) => void;
};

/**
 * Toolbar above the jobs list: inline search, ATS-status filter, and view-mode toggle.
 */
export function JobsToolbar({
  total,
  loading,
  viewMode,
  onViewModeChange,
  urlAtsStatus,
  onAtsStatusChange,
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
        {/* Search */}
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search jobs…"
          aria-label="Search jobs"
          className="w-full sm:w-64"
        />

        {/* ATS-status filter */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="jobs-ats-status" className="sr-only">
            Application status
          </label>
          <select
            id="jobs-ats-status"
            value={urlAtsStatus}
            onChange={(e) => {
              const v = e.target.value;
              const next: JobsListAtsStatusFilter =
                v === "all" || !(API_JOB_ATS_STATUSES as readonly string[]).includes(v)
                  ? "all"
                  : (v as JobsListAtsStatusFilter);
              onAtsStatusChange(next);
            }}
            className="form-control h-10 min-w-[10.5rem] cursor-pointer rounded-xl text-sm shadow-sm sm:min-w-[11rem]"
            aria-label="Filter by application status"
          >
            <option value="all">All statuses</option>
            {API_JOB_ATS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {jobAtsStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
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
