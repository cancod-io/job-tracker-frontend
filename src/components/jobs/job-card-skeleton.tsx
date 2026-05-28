import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobsViewMode } from "@/components/jobs/types";

type JobCardSkeletonProps = {
  viewMode: JobsViewMode;
};

/**
 * Per-card loading placeholder. Mirrors the real `JobCard` layout one-for-one
 * so every element a user expects (logo, title, date, company, location with
 * pin icon, salary, Remote / employment / experience badges, description,
 * skill chips, Apply + Save buttons) has its own skeleton bone.
 *
 * Two layouts, one per view mode — same as `JobCard`.
 */
export function JobCardSkeleton({ viewMode }: JobCardSkeletonProps) {
  /* ── LIST view ────────────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <article
        className="overflow-hidden rounded-xl border border-border/60 bg-card/60 shadow-sm"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Logo */}
          <Skeleton className="size-9 shrink-0 rounded-lg" />

          {/* Body */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Title + date posted */}
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="ml-auto h-3 w-12 shrink-0" />
            </div>

            {/* Meta row: company · pin+location · salary · Remote · employment · experience */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Skeleton className="h-3 w-20" />
              <span className="text-muted-foreground/40" aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Skeleton className="size-3 rounded-sm" />
                <Skeleton className="h-3 w-24" />
              </span>
              <span className="text-muted-foreground/40" aria-hidden>·</span>
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>

            {/* Description (truncated single line) */}
            <Skeleton className="h-3 w-5/6" />
          </div>

          {/* Actions */}
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </article>
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
