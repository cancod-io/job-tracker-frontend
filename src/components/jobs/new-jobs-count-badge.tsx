import { cn } from "@/lib/utils";

type NewJobsCountBadgeProps = {
  count: number;
  className?: string;
  /** `nav` — compact pill on the Jobs nav link; `inline` — slightly larger for page headings. */
  size?: "nav" | "inline";
};

export function formatNewJobsCount(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

/** Count badge for unread socket-ingested jobs (nav, headings). */
export function NewJobsCountBadge({
  count,
  className,
  size = "nav",
}: NewJobsCountBadgeProps) {
  if (count <= 0) return null;

  const label = formatNewJobsCount(count);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold tabular-nums text-white shadow-md shadow-amber-500/35 ring-2 ring-background animate-job-new-pulse",
        size === "nav" ? "min-h-[1.125rem] min-w-[1.125rem] px-1.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
      aria-label={`${count} new job${count === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
}
