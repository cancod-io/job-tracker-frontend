"use client";

import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeDate } from "@/lib/date-utils";
import { formatJobSourceLabel } from "@/components/jobs/job-source-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiFetchRun } from "@/types/api-fetch-runs";

type FetchRunsTimelineProps = {
  source: string;
  runs: ApiFetchRun[];
  loading: boolean;
  selectedRunId: number | null;
  onSelectRun: (run: ApiFetchRun) => void;
  onClearDiff: () => void;
  diffActive: boolean;
};

function RunCountPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1 py-px text-[10px] font-semibold tabular-nums",
        className,
      )}
      title={`${label}: ${value}`}
    >
      {value}
    </span>
  );
}

function FetchRunCard({
  run,
  selected,
  onSelect,
}: {
  run: ApiFetchRun;
  selected: boolean;
  onSelect: () => void;
}) {
  const isInitial = run.previous_run_id == null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-w-[11.5rem] shrink-0 flex-col gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-primary/50 bg-primary/8 shadow-sm ring-1 ring-primary/25"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">
            {relativeDate(run.started_at)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(run.started_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        {isInitial ? (
          <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Initial
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <RunCountPill
          label="Added"
          value={run.added_count}
          className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
        />
        <RunCountPill
          label="Updated"
          value={run.updated_count}
          className="bg-sky-500/15 text-sky-800 dark:text-sky-200"
        />
        <RunCountPill
          label="Unchanged"
          value={run.unchanged_count}
          className="bg-muted text-muted-foreground"
        />
        <RunCountPill
          label="Removed"
          value={run.removed_count}
          className="bg-rose-500/15 text-rose-800 dark:text-rose-200"
        />
      </div>

      <p className="text-[10px] tabular-nums text-muted-foreground">
        {run.total_jobs.toLocaleString()} jobs total
      </p>
    </button>
  );
}

export function FetchRunsTimeline({
  source,
  runs,
  loading,
  selectedRunId,
  onSelectRun,
  onClearDiff,
  diffActive,
}: FetchRunsTimelineProps) {
  const sourceLabel = formatJobSourceLabel(source);

  return (
    <section
      className="mb-4 rounded-2xl border border-border bg-muted/20 p-4"
      aria-label={`Fetch history for ${sourceLabel}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fetch history</h3>
            <p className="text-xs text-muted-foreground">
              {sourceLabel} — pick a run to compare changes
            </p>
          </div>
        </div>
        {diffActive ? (
          <button
            type="button"
            onClick={onClearDiff}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            Show all jobs
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`fetch-run-skel-${i}`} className="h-[7.5rem] min-w-[11.5rem] shrink-0 rounded-xl" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fetch runs for this source yet.</p>
      ) : (
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
          {runs.map((run) => (
            <FetchRunCard
              key={run.id}
              run={run}
              selected={selectedRunId === run.id}
              onSelect={() => onSelectRun(run)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
