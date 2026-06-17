"use client";

import { cn } from "@/lib/utils";
import {
  API_FETCH_CHANGE_TYPES,
  fetchChangeLabel,
  type ApiFetchChangeType,
  type ApiFetchRun,
} from "@/types/api-fetch-runs";

type FetchChangeTabsProps = {
  run: ApiFetchRun;
  activeChange: ApiFetchChangeType;
  onChange: (change: ApiFetchChangeType) => void;
};

const CHANGE_DOT_CLASS: Record<ApiFetchChangeType, string> = {
  added: "bg-emerald-500",
  updated: "bg-sky-500",
  unchanged: "bg-muted-foreground/60",
  removed: "bg-rose-500",
};

function countForChange(run: ApiFetchRun, change: ApiFetchChangeType): number {
  switch (change) {
    case "added":
      return run.added_count;
    case "updated":
      return run.updated_count;
    case "unchanged":
      return run.unchanged_count;
    case "removed":
      return run.removed_count;
  }
}

export function FetchChangeTabs({ run, activeChange, onChange }: FetchChangeTabsProps) {
  return (
    <div
      className="mb-4 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter jobs by fetch change type"
    >
      {API_FETCH_CHANGE_TYPES.map((change) => {
        const active = activeChange === change;
        const count = countForChange(run, change);
        return (
          <button
            key={change}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(change)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              active
                ? "border-primary/45 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <span className={cn("size-2 rounded-full", CHANGE_DOT_CLASS[change])} aria-hidden />
            {fetchChangeLabel(change)}
            <span
              className={cn(
                "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-px text-[10px] tabular-nums",
                active ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
