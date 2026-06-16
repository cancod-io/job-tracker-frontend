import { cn } from "@/lib/utils";

type JobNewBadgeProps = {
  className?: string;
};

/** Highlights freshly discovered listings (`is_new` from `GET /api/v1/jobs`). */
export function JobNewBadge({ className }: JobNewBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-sky-500/35 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200",
        className,
      )}
    >
      New
    </span>
  );
}
