import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type JobNewBadgeProps = {
  className?: string;
  /** Stronger treatment for live socket-ingested listings. */
  prominent?: boolean;
  /** Compact dark+gold chip for dense list rows. */
  variant?: "default" | "list";
};

/** Highlights freshly ingested listings on the jobs dashboard. */
export function JobNewBadge({
  className,
  prominent = true,
  variant = "default",
}: JobNewBadgeProps) {
  if (variant === "list") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-md bg-[#2a241e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f5c518]",
          className,
        )}
      >
        New
      </span>
    );
  }

  if (prominent) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/30 animate-job-new-pulse",
          className,
        )}
      >
        <Sparkles className="size-2.5 shrink-0" aria-hidden />
        New
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-sky-500/55 bg-sky-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-sky-950 shadow-sm ring-1 ring-sky-500/25 dark:border-sky-400/55 dark:bg-sky-950/70 dark:text-sky-50 dark:ring-sky-400/30",
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
