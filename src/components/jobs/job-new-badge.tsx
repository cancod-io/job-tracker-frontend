import { cn } from "@/lib/utils";

type JobNewBadgeProps = {
  className?: string;
};

/** Highlights freshly discovered listings (`is_new` from `GET /api/v1/jobs`). */
export function JobNewBadge({ className }: JobNewBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 border-sky-500/55 bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-950 shadow-sm ring-1 ring-sky-500/30 dark:border-sky-400/55 dark:bg-sky-950/70 dark:text-sky-50 dark:ring-sky-400/35",
        className,
      )}
    >
      New
    </span>
  );
}
