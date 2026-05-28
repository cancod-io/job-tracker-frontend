"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { readJobsViewMode, writeJobsViewMode } from "@/lib/jobs-view-mode";
import { cn } from "@/lib/utils";
import { useJobFiltersStore } from "@/store/job-filters";
import { useApplicationsStore } from "@/store/applications-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useJobsListQuery } from "@/hooks/use-jobs-list-query";
import { useJobsListUrlState } from "@/hooks/use-jobs-list-url-state";
import { useSlideOverPanel } from "@/hooks/use-slide-over-panel";
import { useApplyFlow } from "@/hooks/use-apply-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/jobs/job-card";
import { JobCardSkeleton } from "@/components/jobs/job-card-skeleton";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { JobsToolbar } from "@/components/jobs/jobs-toolbar";
import { ApplyConfirmBanner } from "@/components/jobs/apply-confirm-banner";
import {
  buildJobsListHref,
  buildPaginationItems,
  type JobsListAtsStatusFilter,
  type JobsViewMode,
  type PageSizeOption,
  type TrackedInfo,
  DETAIL_TRANSITION_MS,
} from "@/components/jobs/types";
import type { ExperienceLevel, Job, JobType } from "@/types/job";

// ─── Helpers ───────────────────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 400;

function normalizeExperienceBucket(level: string): ExperienceLevel | null {
  const x = level.toLowerCase();
  if (x.includes("junior") || x.includes("entry") || x.includes("intern")) return "Junior";
  if (x.includes("senior") || x.includes("lead") || x.includes("staff") || x.includes("principal"))
    return "Senior";
  if (x.includes("mid") || x.includes("intermediate") || x.includes("medium")) return "Mid-Level";
  return null;
}

function matchesClientFilters(
  job: Job,
  experience: ExperienceLevel | "All",
  jobType: JobType | "All",
): boolean {
  const bucket = normalizeExperienceBucket(job.experienceLevel);
  const matchesExperience =
    experience === "All" || bucket === experience || job.experienceLevel === experience;

  const jt = job.jobType.toLowerCase();
  const matchesType =
    jobType === "All" ||
    (jobType === "Remote" && job.isRemote) ||
    jt.includes(jobType.toLowerCase());

  return matchesExperience && matchesType;
}

function renderEmptyStateMessage(args: {
  query: string;
  hasClientFilters: boolean;
  total: number;
  pageJobs: number;
}): string {
  const trimmed = args.query.trim();
  // Search returned zero hits from the server.
  if (trimmed && args.total === 0) {
    return `No jobs match “${trimmed}”. Try a different keyword or clear the search.`;
  }
  // The server page had results but client-side filters (experience / job type) hid them all.
  if (args.pageJobs > 0 && args.hasClientFilters) {
    return "All results on this page were hidden by your experience / job-type filters. Adjust the filters or try another page.";
  }
  // No active query, no client filters, but server returned nothing at all.
  if (args.total === 0) {
    return "No job listings are available yet. Check back soon.";
  }
  // Out-of-range page (auto-correct effect will navigate momentarily).
  return "No jobs on this page. Loading the next one…";
}

function scrollToPageTop(): void {
  if (typeof window === "undefined") return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * Primary job-listings component. Composes:
 *  - `useJobsListUrlState` for URL-derived state (page, sort, perPage, atsStatus)
 *  - `useDebouncedValue` for search input
 *  - `useSlideOverPanel` for the detail panel state machine
 *  - `useApplyFlow` for the Apply → confirm banner workflow
 */
export function JobsList() {
  const router = useRouter();
  const pathname = usePathname();

  // ── URL state ─────────────────────────────────────────────────────────────
  const { page, sort, perPage, atsStatus, searchParamsKey } = useJobsListUrlState();

  // ── Client filter store (selector-sliced to avoid extra re-renders) ───────
  const experience = useJobFiltersStore((s) => s.experience);
  const jobType = useJobFiltersStore((s) => s.jobType);
  const query = useJobFiltersStore((s) => s.query);

  // ── Applications (only the slices this component reads) ───────────────────
  const applications = useApplicationsStore((s) => s.applications);
  const fetchApplications = useApplicationsStore((s) => s.fetchApplications);

  // ── View mode (persisted to localStorage) ─────────────────────────────────
  const [viewMode, setViewModeState] = useState<JobsViewMode>("card");
  useEffect(() => {
    setViewModeState(readJobsViewMode());
  }, []);
  const setViewMode = useCallback((mode: JobsViewMode) => {
    setViewModeState(mode);
    writeJobsViewMode(mode);
  }, []);

  // ── Search debounce ───────────────────────────────────────────────────────
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // ── Reset to page 1 when filters/query change ────────────────────────────
  const prevDebouncedQueryRef = useRef(debouncedQuery);
  const prevExperienceRef = useRef(experience);
  const prevJobTypeRef = useRef(jobType);
  useEffect(() => {
    const queryChanged = prevDebouncedQueryRef.current !== debouncedQuery;
    const experienceChanged = prevExperienceRef.current !== experience;
    const jobTypeChanged = prevJobTypeRef.current !== jobType;
    prevDebouncedQueryRef.current = debouncedQuery;
    prevExperienceRef.current = experience;
    prevJobTypeRef.current = jobType;

    if (!queryChanged && !experienceChanged && !jobTypeChanged) return;
    if (page <= 1) return;

    const sp = new URLSearchParams(searchParamsKey);
    router.replace(buildJobsListHref(pathname, sp, { page: 1 }), { scroll: false });
  }, [debouncedQuery, experience, jobType, page, pathname, router, searchParamsKey]);

  // ── Fetch jobs ────────────────────────────────────────────────────────────
  const jobsQuery = useJobsListQuery({
    page,
    perPage,
    sort,
    atsStatus,
    query: debouncedQuery,
  });
  const total = jobsQuery.data?.total ?? 0;
  const loading = jobsQuery.isPending;
  const isRefreshing = jobsQuery.isFetching && !jobsQuery.isPending;
  const showCardSkeletons = loading || isRefreshing;
  const jobs = useMemo(() => jobsQuery.data?.jobs ?? [], [jobsQuery.data]);

  useEffect(() => {
    if (!jobsQuery.error) return;
    notify.error(jobsQuery.error instanceof Error ? jobsQuery.error.message : "Could not load jobs.");
  }, [jobsQuery.error]);

  // ── Sync applications on mount ────────────────────────────────────────────
  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  // ── Tracked jobs map ──────────────────────────────────────────────────────
  const trackedJobsMap = useMemo(() => {
    const map = new Map<number, TrackedInfo>();
    for (const app of applications) {
      if (!map.has(app.job_id)) {
        map.set(app.job_id, { id: app.id, status: app.status });
      }
    }
    return map;
  }, [applications]);

  // ── Client-side filtered list ─────────────────────────────────────────────
  const visibleJobs = useMemo(
    () => jobs.filter((job) => matchesClientFilters(job, experience, jobType)),
    [jobs, experience, jobType],
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages],
  );
  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * perPage, total);

  // Auto-correct out-of-range page
  useEffect(() => {
    if (loading || page <= totalPages) return;
    const sp = new URLSearchParams(searchParamsKey);
    router.replace(buildJobsListHref(pathname, sp, { page: totalPages }), { scroll: false });
  }, [loading, pathname, router, searchParamsKey, totalPages, page]);

  const navigateList = useCallback(
    (patch: {
      page?: number;
      sort?: typeof sort;
      perPage?: PageSizeOption;
      atsStatus?: JobsListAtsStatusFilter;
    }) => {
      scrollToPageTop();
      const sp = new URLSearchParams(searchParamsKey);
      router.push(buildJobsListHref(pathname, sp, patch), { scroll: false });
    },
    [pathname, router, searchParamsKey],
  );

  // ── Detail panel ──────────────────────────────────────────────────────────
  const {
    selectedId,
    phase: detailPhase,
    item: detailJob,
    open: openDetail,
    close: closeDetail,
  } = useSlideOverPanel(visibleJobs, DETAIL_TRANSITION_MS);

  // Close the slide-over whenever the visible result set may change. Includes
  // both server-side fetch triggers and the local experience / job-type filters
  // (otherwise a tracked-out selection could keep a stale detail panel open).
  useEffect(() => {
    closeDetail();
    // Identity of `closeDetail` & `visibleJobs` would re-fire this on every render;
    // we only want to fire on the inputs that change the result set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, page, perPage, sort, atsStatus, experience, jobType]);

  // ── Apply flow ────────────────────────────────────────────────────────────
  const {
    pendingApplyJobs,
    confirmingIds,
    handleApplyClick,
    handleApplyAndTrackDirectly,
    handleConfirmApply,
    dismissPending,
  } = useApplyFlow();

  // ─────────────────────────────────────────────────────────────────────────

  const sharedPaginationProps = {
    loading,
    total,
    currentPage: page,
    totalPages,
    rangeStart,
    rangeEnd,
    perPage,
    paginationItems,
    onNavigate: navigateList,
  };

  return (
    <section id="jobs" className="scroll-mt-24 md:scroll-mt-28" aria-labelledby="jobs-heading">
      <JobsToolbar
        total={total}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        urlAtsStatus={atsStatus}
        onAtsStatusChange={(status) => navigateList({ atsStatus: status, page: 1 })}
      />

      <JobsPagination placement="top" {...sharedPaginationProps} />

      {/* Job cards */}
      <div
        className={cn(
          "min-w-0",
          viewMode === "list"
            ? "space-y-3"
            : // `auto-fill` (not `auto-fit`) keeps empty tracks so a lone result
              // doesn't stretch to fill the row. Max column width is capped
              // (22rem) so cards stay a consistent size at any result count.
              "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),22rem))]",
        )}
        aria-busy={showCardSkeletons}
      >
        {showCardSkeletons
          ? Array.from({ length: Math.min(perPage, 8) }).map((_, idx) => (
              <JobCardSkeleton key={`job-skeleton-${idx}`} viewMode={viewMode} />
            ))
          : visibleJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                viewMode={viewMode}
                selected={selectedId === job.id}
                trackedInfo={trackedJobsMap.get(Number(job.id))}
                onSelect={() => openDetail(job.id)}
                onApplyClick={handleApplyClick}
              />
            ))}

        {!showCardSkeletons && visibleJobs.length === 0 ? (
          <div
            className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {renderEmptyStateMessage({
              query: debouncedQuery,
              hasClientFilters: experience !== "All" || jobType !== "All",
              total,
              pageJobs: jobs.length,
            })}
          </div>
        ) : null}
      </div>

      <JobsPagination placement="bottom" {...sharedPaginationProps} />

      {/* ── Detail slide-over panel ── */}
      {detailJob ? (
        <div
          className="fixed inset-0 z-50 h-full w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-detail-heading"
        >
          {/* Backdrop */}
          <button
            type="button"
            className={cn(
              "absolute inset-0 border-0 bg-background/50 p-0 backdrop-blur-md transition-opacity ease-out motion-reduce:transition-none dark:bg-background/60",
              `duration-[${DETAIL_TRANSITION_MS}ms]`,
              (detailPhase === "entering" || detailPhase === "leaving") && "opacity-0",
              detailPhase === "open" && "opacity-100",
            )}
            onClick={closeDetail}
            aria-label="Dismiss job details"
          />

          {/* Panel container */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-stretch md:justify-end">
            <div
              className={cn(
                "pointer-events-auto flex max-h-[min(92dvh,100%)] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card",
                "shadow-[0_-16px_64px_rgba(0,0,0,0.18)] dark:shadow-[0_-16px_64px_rgba(0,0,0,0.55)]",
                "transition-[transform,opacity] ease-out motion-reduce:transform-none motion-reduce:transition-none",
                "md:h-full md:max-h-none md:w-[43%] md:min-w-[min(20rem,100%)] md:rounded-none md:rounded-l-2xl md:border-b md:border-l md:shadow-2xl",
                `duration-[${DETAIL_TRANSITION_MS}ms]`,
                detailPhase === "entering" &&
                  "translate-y-full opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 md:translate-y-0 md:translate-x-full",
                detailPhase === "open" &&
                  "translate-y-0 opacity-100 md:translate-x-0",
                detailPhase === "leaving" &&
                  "translate-y-full opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-0 md:translate-y-0 md:translate-x-full",
              )}
            >
              <JobDetailPanel
                job={detailJob}
                onClose={closeDetail}
                trackedInfo={trackedJobsMap.get(Number(detailJob.id))}
                onApplyClick={(job) => void handleApplyAndTrackDirectly(job)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Apply confirm banners — one per Apply click, stacked at the bottom */}
      {pendingApplyJobs.map((pending, index) => (
        <ApplyConfirmBanner
          key={pending.id}
          jobTitle={pending.jobTitle}
          company={pending.company}
          stackIndex={index}
          onConfirm={() => void handleConfirmApply(pending.id)}
          onDismiss={() => dismissPending(pending.id)}
          confirming={confirmingIds.has(pending.id)}
        />
      ))}
    </section>
  );
}

const FIRST_LOAD_SKELETON_COUNT = 8;

/**
 * Suspense fallback rendered while `useSearchParams` resolves. Uses the same
 * `JobCardSkeleton` shape as the React-Query loading state so the user never
 * sees a visual swap between two different skeleton styles.
 */
export function JobsListSkeleton() {
  return (
    <section
      id="jobs"
      className="scroll-mt-24 md:scroll-mt-28"
      aria-busy="true"
      aria-label="Loading job listings"
    >
      {/* Toolbar skeleton — mirrors JobsToolbar layout */}
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-32 md:h-7 md:w-36" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3 sm:shrink-0">
          <Skeleton className="h-10 w-full rounded-xl sm:w-64" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-[11rem] rounded-full" />
        </div>
      </div>

      {/* Card grid skeleton — same shape as a real card */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),22rem))]">
        {Array.from({ length: FIRST_LOAD_SKELETON_COUNT }).map((_, i) => (
          <JobCardSkeleton key={`first-load-skel-${i}`} viewMode="card" />
        ))}
      </div>
    </section>
  );
}
