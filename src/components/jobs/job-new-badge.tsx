import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type JobNewBadgeProps = {
  className?: string;
  /** Stronger treatment for live socket-ingested listings. */
  prominent?: boolean;
};

/** Highlights freshly ingested listings on the jobs dashboard. */
export function JobNewBadge({ className, prominent = true }: JobNewBadgeProps) {
  if (prominent) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-amber-300/90 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-amber-500/40 ring-2 ring-amber-400/35 animate-job-new-pulse",
          className,
        )}
      >
        <Sparkles className="size-3 shrink-0" aria-hidden />
        New
      </span>
    );
  }

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

/** Card/list row highlight when a job was just ingested via socket. */
export function jobNewHighlightClassName(): string {
  return cn(
    "border-amber-400/70 bg-gradient-to-br from-amber-500/12 via-card to-card",
    "ring-2 ring-amber-400/45 shadow-lg shadow-amber-500/15",
    "dark:from-amber-500/18 dark:ring-amber-400/35",
  );
}
