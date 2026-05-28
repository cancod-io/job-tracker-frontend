"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/lib/notify";
import { openApplyUrlInBackground } from "@/lib/open-apply-url";
import { fetchJobsList } from "@/lib/jobs-api";
import { mapApiJobListItemToJob } from "@/lib/job-mapper";
import { readJobsViewMode, writeJobsViewMode } from "@/lib/jobs-view-mode";
import { cn } from "@/lib/utils";
import { useJobFiltersStore } from "@/store/job-filters";
import { useApplicationsStore } from "@/store/applications-store";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { JobsToolbar } from "@/components/jobs/jobs-toolbar";
import { ApplyConfirmBanner } from "@/components/jobs/apply-confirm-banner";
import {
  buildJobsListHref,
  buildPaginationItems,
  parseAtsStatusFromSearchParams,
  parsePageFromSearchParams,
  parsePerPageFromSearchParams,
  parseSortFromSearchParams,
  type DetailPhase,
  type JobsListAtsStatusFilter,
  type JobsViewMode,
  type PageSizeOption,
  type TrackedInfo,
  DETAIL_TRANSITION_MS,
} from "@/components/jobs/types";
import type { ExperienceLevel, Job, JobType } from "@/types/job";

// ─── Client-side filter helper ─────────────────────────────────────────────

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

// ─── Scroll helper ─────────────────────────────────────────────────────────

function scrollToPageTop(): void {
  if (typeof window === "undefined") return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * Primary job-listings component.
 *
 * Responsibilities:
 * - Reads filter/sort/pagination state from URL search params.
 * - Fetches jobs from the API whenever params change.
 * - Applies client-side experience/type filters via `useJobFiltersStore`.
 * - Manages the slide-over detail panel with enter/leave animations.
 * - Handles the "Apply + confirm" flow via `useApplicationsStore`.
 */
export function JobsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  // ── Store slices ──────────────────────────────────────────────────────────
  const { experience, jobType, query } = useJobFiltersStore();
  const {
    addPendingApplyJob,
    removePendingApplyJob,
    pendingApplyJobs,
    createApp,
    applications,
    fetchApplications,
  } = useApplicationsStore();

  // ── URL-derived state ─────────────────────────────────────────────────────
  const urlPage = useMemo(
    () => parsePageFromSearchParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );
  const urlSort = useMemo(
    () => parseSortFromSearchParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );
  const urlPerPage = useMemo(
    () => parsePerPageFromSearchParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );
  const urlAtsStatus = useMemo(
    () => parseAtsStatusFromSearchParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );

  // ── Jobs list state ───────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchGeneration = useRef(0);

  // ── View mode (persisted to localStorage) ─────────────────────────────────
  const [viewMode, setViewModeState] = useState<JobsViewMode>("card");
  useEffect(() => { setViewModeState(readJobsViewMode()); }, []);
  const setViewMode = useCallback((mode: JobsViewMode) => {
    setViewModeState(mode);
    writeJobsViewMode(mode);
  }, []);

  // ── Search debounce ───────────────────────────────────────────────────────
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 400);
    return () => window.clearTimeout(t);
  }, [query]);

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
    if (urlPage <= 1) return;

    const sp = new URLSearchParams(searchParams.toString());
    router.replace(buildJobsListHref(pathname, sp, { page: 1 }), { scroll: false });
  }, [debouncedQuery, experience, jobType, urlPage, pathname, router, searchParams]);

  // ── Fetch jobs ────────────────────────────────────────────────────────────
  useEffect(() => {
    const gen = ++fetchGeneration.current;
    const offset = (urlPage - 1) * urlPerPage;

    setLoading(true);
    setSelectedId(null);

    void (async () => {
      try {
        const data = await fetchJobsList({
          limit: urlPerPage,
          offset,
          sort: urlSort,
          ats_status: urlAtsStatus === "all" ? undefined : urlAtsStatus,
          include_inactive: false,
          include_duplicates: false,
          q: debouncedQuery.trim() || undefined,
        });
        if (gen !== fetchGeneration.current) return;
        setTotal(data.total);
        setJobs(data.items.map(mapApiJobListItemToJob));
      } catch (e) {
        if (gen !== fetchGeneration.current) return;
        notify.error(e instanceof Error ? e.message : "Could not load jobs.");
        setJobs([]);
        setTotal(0);
      } finally {
        if (gen === fetchGeneration.current) setLoading(false);
      }
    })();
  }, [debouncedQuery, urlPage, urlPerPage, urlSort, urlAtsStatus]);

  // ── Sync applications on mount ────────────────────────────────────────────
  useEffect(() => { void fetchApplications(); }, [fetchApplications]);

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
  const totalPages = Math.max(1, Math.ceil(total / urlPerPage));
  const paginationItems = useMemo(
    () => buildPaginationItems(urlPage, totalPages),
    [urlPage, totalPages],
  );
  const rangeStart = total === 0 ? 0 : (urlPage - 1) * urlPerPage + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(urlPage * urlPerPage, total);

  // Auto-correct out-of-range page
  useEffect(() => {
    if (loading || urlPage <= totalPages) return;
    const sp = new URLSearchParams(searchParamsKey);
    router.replace(buildJobsListHref(pathname, sp, { page: totalPages }), { scroll: false });
  }, [loading, pathname, router, searchParamsKey, totalPages, urlPage]);

  function navigateList(patch: { page?: number; sort?: typeof urlSort; perPage?: PageSizeOption; atsStatus?: JobsListAtsStatusFilter }) {
    scrollToPageTop();
    const sp = new URLSearchParams(searchParamsKey);
    router.push(buildJobsListHref(pathname, sp, patch), { scroll: false });
  }

  // ── Detail panel ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailPhase, setDetailPhase] = useState<DetailPhase>("closed");
  const prevSelectedRef = useRef<string | null>(null);
  const detailPhaseRef = useRef<DetailPhase>("closed");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  detailPhaseRef.current = detailPhase;

  const closeDetail = useCallback(() => {
    if (detailPhaseRef.current === "closed" || detailPhaseRef.current === "leaving") return;
    setDetailPhase("leaving");
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setSelectedId(null);
      setDetailJob(null);
      setDetailPhase("closed");
      prevSelectedRef.current = null;
    }, DETAIL_TRANSITION_MS);
  }, []);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  useEffect(() => {
    if (selectedId === null) {
      setDetailJob(null);
      setDetailPhase("closed");
      prevSelectedRef.current = null;
      return;
    }
    const job = visibleJobs.find((j) => j.id === selectedId);
    if (!job) { setSelectedId(null); return; }

    setDetailJob(job);
    const prev = prevSelectedRef.current;
    if (prev === selectedId) return;
    prevSelectedRef.current = selectedId;

    if (prev === null) {
      setDetailPhase("entering");
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setDetailPhase("open")),
      );
      return () => cancelAnimationFrame(raf);
    }
    setDetailPhase("open");
  }, [selectedId, visibleJobs]);

  useEffect(() => {
    if (!detailJob) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDetail();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailJob, closeDetail]);

  // ── Apply flow ────────────────────────────────────────────────────────────
  const [confirmingApplyIds, setConfirmingApplyIds] = useState<Set<string>>(() => new Set());

  function handleApplyClick(job: Job) {
    const applyUrl = job.applyUrl?.trim() ?? "";
    if (applyUrl && applyUrl !== "#") {
      const opened = openApplyUrlInBackground(applyUrl);
      if (!opened) {
        notify.error("Pop-up blocked. Allow pop-ups for this site to open apply links.");
      }
    }
    addPendingApplyJob({
      jobId: Number(job.id),
      jobTitle: job.title,
      company: job.company,
      applyUrl,
    });
  }

  async function handleConfirmApply(id: string) {
    const pending = pendingApplyJobs.find((p) => p.id === id);
    if (!pending) return;

    setConfirmingApplyIds((prev) => new Set(prev).add(id));
    try {
      await createApp(pending.jobId);
      notify.success(`Marked as applied — ${pending.jobTitle}`, {
        title: "Application tracked",
      });
      removePendingApplyJob(id);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not save application.");
    } finally {
      setConfirmingApplyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const sharedPaginationProps = {
    loading,
    total,
    currentPage: urlPage,
    totalPages,
    rangeStart,
    rangeEnd,
    perPage: urlPerPage,
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
        urlAtsStatus={urlAtsStatus}
        onAtsStatusChange={(status) => navigateList({ atsStatus: status, page: 1 })}
      />

      <JobsPagination placement="top" {...sharedPaginationProps} />

      {/* Job cards */}
      <div
        className={cn(
          "min-w-0",
          viewMode === "list"
            ? "space-y-3"
            : "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]",
        )}
      >
        {visibleJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            viewMode={viewMode}
            selected={selectedId === job.id}
            trackedInfo={trackedJobsMap.get(Number(job.id))}
            onSelect={() => setSelectedId(job.id)}
            onApplyClick={handleApplyClick}
          />
        ))}

        {!loading && visibleJobs.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {jobs.length > 0
              ? "No jobs match your current filters. Adjust search criteria to discover more roles."
              : total === 0
                ? "No job listings are available from the server yet."
                : "No jobs match your current filters. Try another page or broadening your search."}
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
              <JobDetailPanel job={detailJob} onClose={closeDetail} />
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
          onDismiss={() => removePendingApplyJob(pending.id)}
          confirming={confirmingApplyIds.has(pending.id)}
        />
      ))}
    </section>
  );
}

/** Suspense fallback rendered while `useSearchParams` resolves. */
export function JobsListSkeleton() {
  return (
    <section
      id="jobs"
      className="scroll-mt-24 md:scroll-mt-28"
      aria-busy="true"
      aria-label="Loading job listings"
    >
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-muted md:h-8 md:w-48" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted/80" />
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3">
          <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-[11rem] animate-pulse rounded-full bg-muted/80" />
        </div>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
        ))}
      </div>
    </section>
  );
}
