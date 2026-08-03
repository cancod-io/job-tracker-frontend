import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_LIST_ROW_GRID } from "@/components/jobs/job-list-row";
import type { JobsViewMode } from "@/components/jobs/types";

type JobCardSkeletonProps = {
  viewMode: JobsViewMode;
};

/**
 * Per-card loading placeholder. Mirrors the real `JobCard` layout one-for-one
 * so every element a user expects has its own skeleton bone.
 *
 * Two layouts, one per view mode — same as `JobCard`.
 */
export function JobCardSkeleton({ viewMode }: JobCardSkeletonProps) {
  /* ── LIST view ────────────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <div className={JOB_LIST_ROW_GRID} aria-hidden="true">
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="ml-auto h-3 w-14" />
        <div className="flex items-center justify-end gap-1">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ── CARD view ────────────────────────────────────────────────── */
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 shadow-sm",
      )}
      aria-hidden="true"
    >
      {/* Body */}
      <div className="flex flex-1 flex-col gap-3.5 p-4">
        {/* Header row: logo + title (2 lines) + date + location */}
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 shrink-0 rounded-sm" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>

        {/* Badges row: salary, Remote, employment, experience */}
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Company + description (line-clamp-2) */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
        </div>

        {/* Skill chips (real card caps at 6 — show 4 here) */}
        <ul className="flex flex-wrap gap-1.5" aria-hidden>
          <li><Skeleton className="h-5 w-14 rounded-md" /></li>
          <li><Skeleton className="h-5 w-20 rounded-md" /></li>
          <li><Skeleton className="h-5 w-16 rounded-md" /></li>
          <li><Skeleton className="h-5 w-12 rounded-md" /></li>
        </ul>
      </div>

      {/* Footer actions: Apply (full width) + Save for later (full width) */}
      <div className="flex flex-col gap-1.5 border-t border-border/60 px-4 py-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </article>
  );
}
