import { cn } from "@/lib/utils";

type JobSourceBadgeProps = {
  /** Display label from API `source_label`. */
  label: string;
  className?: string;
};

const sourceBadgeClass =
  "inline-flex shrink-0 items-center gap-1 rounded-md border-2 border-violet-500/55 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-950 shadow-sm ring-1 ring-violet-500/30 dark:border-violet-400/55 dark:bg-violet-950/70 dark:text-violet-50 dark:ring-violet-400/35";

/** Listing source badge — renders API `source_label`. */
export function JobSourceBadge({ label, className }: JobSourceBadgeProps) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  return (
    <span className={cn(sourceBadgeClass, className)} title={`Source: ${trimmed}`}>
      <span className="text-[9px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-200">
        Source
      </span>
      <span aria-hidden className="font-normal text-violet-500/80 dark:text-violet-300/80">
        ·
      </span>
      <span className="text-[9px]">{trimmed}</span>
    </span>
  );
}
