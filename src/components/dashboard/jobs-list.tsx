"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Building2,
  CalendarClock,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  PanelRightClose,
  Search,
  X,
  Zap,
} from "lucide-react";
import {
  jobAtsStatusBadgeClass,
  jobAtsStatusLabel,
} from "@/lib/application-status-badge";
import { fetchJobsList } from "@/lib/jobs-api";
import { mapApiJobListItemToJob } from "@/lib/job-mapper";
import { cn } from "@/lib/utils";
import { useJobFiltersStore } from "@/store/job-filters";
import type { ExperienceLevel, Job, JobType } from "@/types/job";

type ViewMode = "list" | "card";

type DetailPhase = "closed" | "entering" | "open" | "leaving";

const PAGE_SIZE = 20;

/** Must match Tailwind `duration-[…ms]` on the overlay / sheet. */
const DETAIL_TRANSITION_MS = 320;

function normalizeExperienceBucket(level: string): ExperienceLevel | null {
  const x = level.toLowerCase();
  if (x.includes("junior") || x.includes("entry") || x.includes("intern")) return "Junior";
  if (x.includes("senior") || x.includes("lead") || x.includes("staff") || x.includes("principal"))
    return "Senior";
  if (x.includes("mid") || x.includes("intermediate") || x.includes("medium")) return "Mid-Level";
  return null;
}

function matchesFilters(
  job: Job,
  query: string,
  experience: ExperienceLevel | "All",
  jobType: JobType | "All",
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  const matchesText =
    normalizedQuery.length === 0 ||
    job.title.toLowerCase().includes(normalizedQuery) ||
    job.company.toLowerCase().includes(normalizedQuery) ||
    job.description.toLowerCase().includes(normalizedQuery) ||
    job.skills.some((skill) => skill.toLowerCase().includes(normalizedQuery));

  const bucket = normalizeExperienceBucket(job.experienceLevel);
  const matchesExperience =
    experience === "All" || bucket === experience || job.experienceLevel === experience;

  const jt = job.jobType.toLowerCase();
  const matchesType =
    jobType === "All" ||
    (jobType === "Remote" && job.isRemote) ||
    jt.includes(jobType.toLowerCase());

  return matchesText && matchesExperience && matchesType;
}

function companyInitials(company: string): string {
  const parts = company.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }
  const first = parts[0];
  if (!first) return "?";
  return first.slice(0, 2).toUpperCase();
}

function externalHref(url: string): string {
  const t = url.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/** Pulls a few readable lines from a long job description for the card body. */
function extractHighlightLines(description: string, max = 3): string[] {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter((l) => l.length > 0 && l.length < 320);
  const out: string[] = [];
  for (const line of lines) {
    if (out.length >= max) break;
    if (/^(overview|responsibilities|requirements|description)\b[:：]?\s*$/i.test(line)) continue;
    out.push(line.length > 180 ? `${line.slice(0, 177)}…` : line);
  }
  return out;
}

function isInteractiveCardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("a, button"));
}

type JobDetailPanelProps = {
  job: Job;
  onClose: () => void;
};

function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden bg-card"
      aria-label={`Job details: ${job.title}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4 md:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Job details
          </p>
          <h3
            id="job-detail-heading"
            className="mt-1 text-base font-semibold leading-snug tracking-tight text-foreground md:text-lg"
          >
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{job.company}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close job details"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-wrap gap-2">
          {job.salary ? (
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              {job.salary}
            </span>
          ) : null}
          {job.isRemote ? (
            <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Remote
            </span>
          ) : null}
          {job.employmentLabel !== "—" ? (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {job.employmentLabel}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              jobAtsStatusBadgeClass(job.atsStatus),
            )}
          >
            {jobAtsStatusLabel(job.atsStatus)}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            Posted {job.datePosted}
          </span>
          {job.publisher ? (
            <span className="inline-flex items-center gap-1.5">
              <Search className="size-3.5 shrink-0" aria-hidden />
              {job.publisher}
            </span>
          ) : null}
        </div>

        {job.skills.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Skills
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Skills">
              {job.skills.map((skill) => (
                <li key={skill}>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 px-2 py-1 text-xs text-secondary-foreground">
                    <Zap className="size-3 shrink-0 text-primary" aria-hidden />
                    {skill}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </p>
          {job.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{job.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No description was provided for this listing.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/70 bg-muted/20 px-4 py-4 md:flex-row md:flex-wrap md:items-center md:px-5">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-primary/92 inline-flex h-10 min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-[transform,background-color] active:scale-[0.99] motion-reduce:active:scale-100 md:flex-initial"
        >
          Apply now
          <ExternalLink className="size-4 shrink-0" aria-hidden />
        </a>
        {/* {job.googleJobUrl ? (
          <a
            href={job.googleJobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Google listing
            <ExternalLink className="size-4 shrink-0 opacity-70" aria-hidden />
          </a>
        ) : null} */}
        {job.employerWebsite ? (
          <a
            href={externalHref(job.employerWebsite)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Building2 className="size-4 shrink-0 opacity-70" aria-hidden />
            Company site
          </a>
        ) : null}
      </div>
    </aside>
  );
}

type JobCardProps = {
  job: Job;
  viewMode: ViewMode;
  selected: boolean;
  onSelect: () => void;
};

function JobCard({ job, viewMode, selected, onSelect }: JobCardProps) {
  const highlights = useMemo(() => extractHighlightLines(job.description), [job.description]);

  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    if (isInteractiveCardTarget(e.target)) return;
    onSelect();
  }

  const badgeOutline =
    "inline-flex items-center rounded-full border border-border/90 bg-background/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  const cardShell = cn(
    "rounded-2xl border bg-card text-left shadow-sm outline-none transition-[transform,box-shadow,border-color,background-color] duration-200 motion-reduce:transition-none",
    "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg motion-reduce:hover:translate-y-0",
    selected && "border-primary/55 bg-muted/15 ring-2 ring-primary/25 shadow-md",
    !selected && "border-border/80",
    viewMode === "card" && "flex h-full flex-col",
  );

  const inner = (
    <>
      <div
        className={cn(
          "flex flex-1 flex-col gap-4 p-5",
          viewMode === "list" && "md:flex-row md:items-start md:gap-6",
        )}
      >
        <div className={cn("min-w-0 flex-1 space-y-3", viewMode === "list" && "md:space-y-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                {job.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary employer logo hosts from API
                  <img
                    src={job.logoUrl}
                    alt=""
                    className="size-full object-contain p-1"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="flex size-full items-center justify-center bg-muted text-[11px] font-bold text-muted-foreground"
                    aria-hidden
                  >
                    {companyInitials(job.company)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2 md:text-base">
                    {job.title}
                  </h3>
                  <span className="shrink-0 tabular-nums text-[11px] font-medium text-muted-foreground">
                    {job.datePosted}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{job.location}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.salary ? (
              <span className={cn(badgeOutline, "text-foreground")}>{job.salary}</span>
            ) : null}
            {job.isRemote ? (
              <span
                className={cn(
                  badgeOutline,
                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                )}
              >
                Remote
              </span>
            ) : null}
            {job.employmentLabel !== "—" ? (
              <span className={cn(badgeOutline)}>{job.employmentLabel}</span>
            ) : null}
            {job.experienceLevel !== "—" ? (
              <span className={cn(badgeOutline)}>{job.experienceLevel}</span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                jobAtsStatusBadgeClass(job.atsStatus),
              )}
            >
              {jobAtsStatusLabel(job.atsStatus)}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">{job.company}</p>
            {job.description ? (
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
            ) : (
              <p className="mt-1 text-sm italic text-muted-foreground">No short description available.</p>
            )}
          </div>

          {/* {highlights.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-secondary-foreground" aria-label="Role highlights">
              {highlights.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
                  <span className="leading-snug">{line}</span>
                </li>
              ))}
            </ul>
          ) : null} */}

          {job.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Key skills">
              {job.skills.slice(0, 10).map((skill) => (
                <li key={skill}>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {skill}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {job.publisher ? (
            <p className="text-[11px] text-muted-foreground">
              Source: <span className="font-medium text-foreground/80">{job.publisher}</span>
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 border-t border-border/60 pt-4",
            viewMode === "list"
              ? "md:w-52 md:shrink-0 md:border-l md:border-t-0 md:pl-6 md:pt-0"
              : "mt-auto",
          )}
        >
          <div className="flex flex-wrap gap-2">
            {/* <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted min-[360px]:flex-none"
            >
              <PanelRightClose className="size-3.5 shrink-0 opacity-70" aria-hidden />
              More detail
            </button> */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full hover:bg-primary/92 inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-[transform,background-color] active:scale-[0.98] motion-reduce:active:scale-100 min-[360px]:flex-none"
              aria-label={`Apply to ${job.title} at ${job.company} (opens in a new tab)`}
            >
              Apply
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </a>
          </div>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground md:w-auto"
            aria-pressed={job.saved}
            aria-label={
              job.saved
                ? `Remove ${job.title} at ${job.company} from saved jobs`
                : `Save ${job.title} at ${job.company} for later`
            }
          >
            <Bookmark className="size-3.5 shrink-0" aria-hidden />
            {job.saved ? "Saved" : "Save for later"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <article
      className={cn(cardShell, "cursor-pointer")}
      onClick={handleCardClick}
      aria-current={selected ? "true" : undefined}
    >
      {inner}
    </article>
  );
}

export function JobsList() {
  const { query, experience, jobType } = useJobFiltersStore();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailPhase, setDetailPhase] = useState<DetailPhase>("closed");
  const prevSelectedRef = useRef<string | null>(null);
  const detailPhaseRef = useRef<DetailPhase>("closed");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 400);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const gen = ++fetchGeneration.current;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJobsList({
          limit: PAGE_SIZE,
          offset: 0,
          sort: "relevance",
          include_inactive: false,
          include_duplicates: false,
          q: debouncedQuery.trim() || undefined,
        });
        if (gen !== fetchGeneration.current) return;
        setTotal(data.total);
        setJobs(data.items.map(mapApiJobListItemToJob));
        setSelectedId(null);
      } catch (e) {
        if (gen !== fetchGeneration.current) return;
        setError(e instanceof Error ? e.message : "Could not load jobs.");
        setJobs([]);
        setTotal(0);
      } finally {
        if (gen === fetchGeneration.current) setLoading(false);
      }
    })();
  }, [debouncedQuery]);

  const filteredJobs = useMemo(
    () => jobs.filter((job) => matchesFilters(job, query, experience, jobType)),
    [jobs, query, experience, jobType],
  );
  const companyCount = new Set(filteredJobs.map((j) => j.company)).size;

  const selectedJob = useMemo(
    () => (selectedId ? filteredJobs.find((j) => j.id === selectedId) ?? null : null),
    [filteredJobs, selectedId],
  );

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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setDetailJob(null);
      setDetailPhase("closed");
      prevSelectedRef.current = null;
      return;
    }
    const job = filteredJobs.find((j) => j.id === selectedId);
    if (!job) {
      setSelectedId(null);
      return;
    }
    setDetailJob(job);
    const prev = prevSelectedRef.current;
    if (prev === selectedId) return;
    prevSelectedRef.current = selectedId;
    if (prev === null) {
      setDetailPhase("entering");
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setDetailPhase("open")),
      );
      return () => cancelAnimationFrame(id);
    }
    setDetailPhase("open");
  }, [selectedId, filteredJobs]);

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

  const canLoadMore = jobs.length < total;

  async function handleLoadMore() {
    if (!canLoadMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchJobsList({
        limit: PAGE_SIZE,
        offset: jobs.length,
        sort: "relevance",
        include_inactive: false,
        include_duplicates: false,
        q: debouncedQuery.trim() || undefined,
      });
      setTotal(data.total);
      setJobs((prev) => [...prev, ...data.items.map(mapApiJobListItemToJob)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more jobs.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section
      id="jobs"
      className="scroll-mt-24 md:scroll-mt-28"
      aria-labelledby="jobs-heading"
    >
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2
            id="jobs-heading"
            className="text-lg font-semibold tracking-tight text-foreground md:text-xl"
          >
            Job listings
          </h2>
          <p className="text-xs tabular-nums text-muted-foreground md:text-sm" aria-live="polite">
            {loading ? (
              "Loading…"
            ) : (
              <>
                {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                <span className="mx-1 text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                {companyCount} {companyCount === 1 ? "company" : "companies"}
                {total > jobs.length ? (
                  <>
                    <span className="mx-1 text-muted-foreground/50" aria-hidden>
                      ·
                    </span>
                    {jobs.length} of {total} loaded
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>
        <div
          className="inline-flex shrink-0 rounded-full border border-input bg-muted/50 p-1 shadow-sm"
          role="group"
          aria-label="Job list layout"
        >
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <List className="size-3.5 shrink-0" aria-hidden />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            aria-pressed={viewMode === "card"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none",
              viewMode === "card"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
            Cards
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div
        className={cn(
          "min-w-0",
          viewMode === "list"
            ? "space-y-3"
            : "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]",
        )}
      >
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            viewMode={viewMode}
            selected={selectedId === job.id}
            onSelect={() => setSelectedId(job.id)}
          />
        ))}

        {!loading && filteredJobs.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {jobs.length > 0
              ? "No jobs match your current filters. Adjust search criteria to discover more roles."
              : total === 0
                ? "No job listings are available from the server yet."
                : "No jobs match your current filters. Try loading more or broadening your search."}
          </div>
        ) : null}
      </div>

      {detailJob ? (
        <div
          className="fixed inset-0 z-50 h-full w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-detail-heading"
        >
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
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-stretch md:justify-end">
            <div
              className={cn(
                "pointer-events-auto flex max-h-[min(92dvh,100%)] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-[0_-16px_64px_rgba(0,0,0,0.18)] transition-[transform,opacity] ease-out motion-reduce:transform-none motion-reduce:transition-none dark:shadow-[0_-16px_64px_rgba(0,0,0,0.55)] md:h-full md:max-h-none md:w-[43%] md:min-w-[min(20rem,100%)] md:rounded-none md:rounded-l-2xl md:border-b md:border-l md:shadow-2xl",
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

      {!loading && canLoadMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-input bg-background px-6 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
