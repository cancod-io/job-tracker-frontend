"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatFetchRunCountSummary,
  type ApiFetchRun,
} from "@/types/api-fetch-runs";

type FetchRunsTimelineProps = {
  source: string;
  sourceLabel: string;
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
  alwaysShow = false,
}: {
  label: string;
  value: number;
  className?: string;
  alwaysShow?: boolean;
}) {
  if (!alwaysShow && value <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-semibold tabular-nums",
        className,
      )}
      title={`${label}: ${value}`}
    >
      <span className="font-normal opacity-80">{label}</span>
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
      <div className="flex flex-wrap items-center gap-1">
        <RunCountPill
          label="Added"
          value={run.added_count}
          alwaysShow
          className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
        />
        <RunCountPill
          label="Blocked"
          value={run.blocked_count ?? 0}
          className="bg-amber-500/15 text-amber-800 dark:text-amber-200"
        />
        <RunCountPill
          label="Received"
          value={run.received_count ?? 0}
          className="bg-muted text-muted-foreground"
        />
      </div>

      {run.added_count === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          No new jobs — all apply URLs already exist.
        </p>
      ) : (
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {formatFetchRunCountSummary(run)}
        </p>
      )}
    </button>
  );
}

export function FetchRunsTimeline({
  source,
  sourceLabel,
  runs,
  loading,
  selectedRunId,
  onSelectRun,
  onClearDiff,
  diffActive,
}: FetchRunsTimelineProps) {
  const displaySourceLabel = sourceLabel.trim() || source;

  return (
    <section
      className="mb-4 rounded-2xl border border-border bg-muted/20 p-4"
      aria-label={`Fetch history for ${displaySourceLabel}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ingest history</h3>
          <p className="text-xs text-muted-foreground">
            {displaySourceLabel} — select a run to view newly added jobs
          </p>
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
        <p className="text-sm text-muted-foreground">No ingest runs for this source yet.</p>
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
