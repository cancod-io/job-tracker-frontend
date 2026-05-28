import {
  Building2,
  CalendarClock,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  MapPin,
  Search,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jobAtsStatusBadgeClass, jobAtsStatusLabel } from "@/lib/application-status-badge";
import { notify } from "@/lib/notify";
import type { Job } from "@/types/job";

function copyJobLink(job: Job): void {
  const url = job.applyUrl?.trim();
  if (!url || url === "#") {
    notify.error("No apply link available for this job");
    return;
  }
  void navigator.clipboard.writeText(url).then(
    () => notify.success("Link copied to clipboard"),
    () => notify.error("Failed to copy link"),
  );
}

function copyJobId(job: Job): void {
  const id = job.id.trim();
  if (!id) {
    notify.error("No job ID available");
    return;
  }
  void navigator.clipboard.writeText(id).then(
    () => notify.success("Job ID copied to clipboard"),
    () => notify.error("Failed to copy job ID"),
  );
}

function externalHref(url: string): string {
  const t = url.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

type JobDetailPanelProps = {
  job: Job;
  onClose: () => void;
};

/**
 * Slide-over detail panel that shows full job information.
 * Renders inside the animated overlay managed by `JobsList`.
 */
export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden bg-card"
      aria-label={`Job details: ${job.title}`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4 md:px-5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Job details
          </p>
          <h5
            id="job-detail-heading"
            className="mt-1 text-base leading-snug tracking-tight text-foreground md:text-lg"
          >
            {job.title}
          </h5>
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

      {/* ── Scrollable body ── */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
        {/* Badges row */}
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

        {/* Meta row */}
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

        {/* Skills */}
        {job.skills.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
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

        {/* Description */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Description
          </p>
          {job.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {job.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description was provided for this listing.
            </p>
          )}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex flex-col gap-2 border-t border-border/70 bg-muted/20 px-4 py-4 md:flex-row md:flex-wrap md:items-center md:px-5">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-[transform,background-color] hover:opacity-90 active:scale-[0.99] motion-reduce:active:scale-100 md:flex-initial"
        >
          Apply now
          <ExternalLink className="size-4 shrink-0" aria-hidden />
        </a>
        <button
          type="button"
          onClick={() => copyJobLink(job)}
          className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <LinkIcon className="size-4 shrink-0 opacity-70" aria-hidden />
          Copy link
        </button>
        <button
          type="button"
          onClick={() => copyJobId(job)}
          className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-muted"
          aria-label={`Copy job ID ${job.id}`}
        >
          <Copy className="size-4 shrink-0 opacity-70" aria-hidden />
          Copy job ID
        </button>
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
