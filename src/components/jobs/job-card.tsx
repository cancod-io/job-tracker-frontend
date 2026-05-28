import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { companyInitials } from "@/lib/company-utils";
import { TRACKED_STATUS_BADGE, type TrackedInfo, type JobsViewMode } from "@/components/jobs/types";
import type { Job } from "@/types/job";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("a, button"));
}

type JobCardProps = {
  job: Job;
  viewMode: JobsViewMode;
  selected: boolean;
  trackedInfo?: TrackedInfo;
  onSelect: () => void;
  onApplyClick: (job: Job) => void;
};

/**
 * Renders a single job in either list-row or card-grid format.
 * Clicking the card (outside interactive elements) opens the detail panel.
 */
export function JobCard({
  job,
  viewMode,
  selected,
  trackedInfo,
  onSelect,
  onApplyClick,
}: JobCardProps) {
  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    if (isInteractiveTarget(e.target)) return;
    onSelect();
  }

  const base = cn(
    "rounded-xl border bg-card text-left shadow-sm outline-none",
    "transition-[transform,box-shadow,border-color] duration-150 motion-reduce:transition-none",
    "hover:border-primary/45 hover:shadow-md motion-reduce:hover:translate-y-0",
    selected
      ? "border-primary/55 bg-primary/5 ring-2 ring-primary/25 shadow-md"
      : "border-border/80",
  );

  const LogoEl = () =>
    job.logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={job.logoUrl}
        alt=""
        className="size-full object-contain p-0.5"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    ) : (
      <div
        className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground"
        aria-hidden
      >
        {companyInitials(job.company)}
      </div>
    );

  /* ── LIST view ────────────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <article
        className={cn(base, "cursor-pointer hover:-translate-y-px")}
        onClick={handleCardClick}
        aria-current={selected ? "true" : undefined}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <LogoEl />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <h4 className="truncate text-[13px] font-semibold leading-snug text-foreground">
                {job.title}
              </h4>
              <span className="shrink-0 text-[11px] text-muted-foreground">{job.datePosted}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-px text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{job.company}</span>
              {job.location ? (
                <>
                  <span aria-hidden className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="size-3 shrink-0 opacity-60" aria-hidden />
                    {job.location}
                  </span>
                </>
              ) : null}
              {job.salary ? (
                <>
                  <span aria-hidden className="text-muted-foreground/40">·</span>
                  <span className="font-medium text-foreground/80">{job.salary}</span>
                </>
              ) : null}
              {job.isRemote ? (
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-px text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Remote
                </span>
              ) : null}
              {job.employmentLabel !== "—" ? (
                <span className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-px text-[10px] font-medium">
                  {job.employmentLabel}
                </span>
              ) : null}
              {job.experienceLevel !== "—" ? (
                <span className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-px text-[10px] font-medium">
                  {job.experienceLevel}
                </span>
              ) : null}
              {trackedInfo ? (
                <span className={cn("inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px text-[10px] font-semibold", TRACKED_STATUS_BADGE[trackedInfo.status].className)}>
                  <CheckCircle2 className="size-2.5 shrink-0" aria-hidden />
                  {TRACKED_STATUS_BADGE[trackedInfo.status].label}
                </span>
              ) : null}
            </div>
            {job.description ? (
              <p className="mt-px truncate text-[11px] text-muted-foreground/60">
                {job.description}
              </p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            {trackedInfo ? (
              <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold", TRACKED_STATUS_BADGE[trackedInfo.status].className)}>
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                {TRACKED_STATUS_BADGE[trackedInfo.status].label}
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onApplyClick(job); }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
                aria-label={`Apply to ${job.title} at ${job.company}`}
              >
                Apply <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                job.saved && "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-400",
              )}
              aria-pressed={job.saved}
              aria-label={job.saved ? "Saved" : "Save for later"}
            >
              <Bookmark className={cn("size-3.5 shrink-0", job.saved && "fill-current")} aria-hidden />
            </button>
          </div>
        </div>
      </article>
    );
  }

  /* ── CARD view ────────────────────────────────────────────────── */
  const badgeOutline =
    "inline-flex items-center rounded-full border border-border/90 bg-background/80 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground";

  return (
    <article
      className={cn(base, "flex h-full cursor-pointer flex-col hover:-translate-y-0.5")}
      onClick={handleCardClick}
      aria-current={selected ? "true" : undefined}
    >
      {/* Body */}
      <div className="flex flex-1 flex-col gap-3.5 p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            <LogoEl />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="line-clamp-2 text-[15px] leading-snug tracking-tight text-foreground">
                {job.title}
              </h4>
              <span className="shrink-0 tabular-nums text-[11px] font-medium text-muted-foreground">
                {job.datePosted}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{job.location}</span>
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {job.salary ? (
            <span className={cn(badgeOutline, "text-foreground")}>{job.salary}</span>
          ) : null}
          {job.isRemote ? (
            <span className={cn(badgeOutline, "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200")}>
              Remote
            </span>
          ) : null}
          {job.employmentLabel !== "—" ? (
            <span className={badgeOutline}>{job.employmentLabel}</span>
          ) : null}
          {job.experienceLevel !== "—" ? (
            <span className={badgeOutline}>{job.experienceLevel}</span>
          ) : null}
          {trackedInfo ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", TRACKED_STATUS_BADGE[trackedInfo.status].className)}>
              <CheckCircle2 className="size-3 shrink-0" aria-hidden />
              {TRACKED_STATUS_BADGE[trackedInfo.status].label}
            </span>
          ) : null}
        </div>

        {/* Company + description */}
        <div>
          <p className="text-sm font-medium text-foreground">{job.company}</p>
          {job.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">No description available.</p>
          )}
        </div>

        {/* Skills (capped at 6) */}
        {job.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Key skills">
            {job.skills.slice(0, 6).map((skill) => (
              <li key={skill}>
                <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-2 py-0.5 text-[11px] text-secondary-foreground">
                  {skill}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-1.5 border-t border-border/60 px-4 py-3">
        {trackedInfo ? (
          <div className="flex gap-2">
            <span className={cn("inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold", TRACKED_STATUS_BADGE[trackedInfo.status].className)}>
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              {TRACKED_STATUS_BADGE[trackedInfo.status].label}
            </span>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Open job posting for ${job.title}`}
            >
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              Open
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onApplyClick(job); }}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-[transform,background-color] hover:opacity-90 active:scale-[0.98]"
            aria-label={`Apply to ${job.title} at ${job.company}`}
          >
            Apply <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground",
            job.saved && "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-400",
          )}
          aria-pressed={job.saved}
          aria-label={job.saved ? "Saved" : "Save for later"}
        >
          <Bookmark className={cn("size-3.5 shrink-0", job.saved && "fill-current")} aria-hidden />
          {job.saved ? "Saved" : "Save for later"}
        </button>
      </div>
    </article>
  );
}
