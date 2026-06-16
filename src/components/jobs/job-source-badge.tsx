import { cn } from "@/lib/utils";

/** Humanize API source slugs (e.g. `google_jobs` → `Google Jobs`). */
export function formatJobSourceLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "";
  if (/^[a-z0-9_-]+$/.test(trimmed)) {
    return trimmed
      .split(/[_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}

type JobSourceBadgeProps = {
  source: string | null | undefined;
  className?: string;
};

const sourceBadgeClass =
  "inline-flex shrink-0 items-center gap-1 rounded-md border-2 border-violet-500/55 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-950 shadow-sm ring-1 ring-violet-500/30 dark:border-violet-400/55 dark:bg-violet-950/70 dark:text-violet-50 dark:ring-violet-400/35";

/** Listing source from API `source` (`GET /api/v1/jobs`). */
export function JobSourceBadge({ source, className }: JobSourceBadgeProps) {
  const label = formatJobSourceLabel(source ?? "");
  if (!label) return null;

  return (
    <span className={cn(sourceBadgeClass, className)} title={`Source: ${label}`}>
      <span className="text-[9px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-200">
        Source
      </span>
      <span aria-hidden className="font-normal text-violet-500/80 dark:text-violet-300/80">
        ·
      </span>
      <span className="text-[9px]">{label}</span>
    </span>
  );
}
