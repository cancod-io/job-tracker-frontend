"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRange, toDateKey } from "@/lib/date-utils";
import { Popover } from "@/components/ui/popover";

type DateRangeFilterProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** "button" = labelled toolbar control · "icon" = compact column control. */
  variant?: "button" | "icon";
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Builds a week-aligned grid (null-padded) of `Date`s for a given month. */
function buildMonth(year: number, month: number): (Date | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

type Preset = { label: string; range: () => [string, string] };

const PRESETS: Preset[] = [
  { label: "Today", range: () => { const k = toDateKey(new Date()); return [k, k]; } },
  {
    label: "Last 7 days",
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [toDateKey(start), toDateKey(end)];
    },
  },
  {
    label: "This week",
    range: () => {
      const start = startOfWeek(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return [toDateKey(start), toDateKey(end)];
    },
  },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return [
        toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
        toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      ];
    },
  },
  {
    label: "Last 30 days",
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return [toDateKey(start), toDateKey(end)];
    },
  },
];

type RangePanelProps = {
  from: string;
  to: string;
  monthsToShow: 1 | 2;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
};

/**
 * The calendar body. Mounted fresh each time the popover opens, so its draft
 * state always starts from the committed `from`/`to` props.
 */
function RangePanel({ from, to, monthsToShow, onApply, onClear }: RangePanelProps) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [viewDate, setViewDate] = useState(() => {
    const anchor = from || to;
    if (anchor) {
      const parts = anchor.split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  const months = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const list = [{ year: y, month: m }];
    if (monthsToShow === 2) {
      list.push({ year: m === 11 ? y + 1 : y, month: (m + 1) % 12 });
    }
    return list.map((mo) => ({ ...mo, cells: buildMonth(mo.year, mo.month) }));
  }, [viewDate, monthsToShow]);

  const todayKey = toDateKey(new Date());

  function handleDayClick(date: Date) {
    const key = toDateKey(date);
    // Start a fresh range when none is in progress or a complete one exists.
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(key);
      setDraftTo("");
      return;
    }
    // Complete the range, ordering the two endpoints.
    if (key < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(key);
    } else {
      setDraftTo(key);
    }
  }

  function inRange(key: string): boolean {
    if (!draftFrom) return false;
    return key >= draftFrom && key <= (draftTo || draftFrom);
  }

  return (
    <div className="flex rounded-2xl border border-border bg-card shadow-2xl">
      {/* Quick ranges */}
      <div className="flex w-36 shrink-0 flex-col gap-0.5 border-r border-border/60 p-2">
        <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick ranges
        </p>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { const [f, t] = p.range(); setDraftFrom(f); setDraftTo(t); }}
            className="rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="flex flex-1 justify-around text-sm font-semibold text-foreground">
            {months.map((mo) => (
              <span key={`${mo.year}-${mo.month}`}>
                {new Date(mo.year, mo.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex gap-4">
          {months.map((mo) => (
            <div key={`grid-${mo.year}-${mo.month}`} className="w-[15rem]">
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1">{w}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {mo.cells.map((cell, i) => {
                  if (!cell) return <span key={i} aria-hidden />;
                  const key = toDateKey(cell);
                  const selected = inRange(key);
                  const isStart = key === draftFrom;
                  const isEnd = Boolean(draftFrom) && key === (draftTo || draftFrom);
                  const isEndpoint = isStart || isEnd;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDayClick(cell)}
                      className={cn(
                        "flex h-8 items-center justify-center text-xs transition-colors",
                        selected ? "bg-primary/10" : "hover:bg-muted",
                        isStart && "rounded-l-lg",
                        isEnd && "rounded-r-lg",
                        !selected && "rounded-lg",
                        isEndpoint
                          ? "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                          : selected
                            ? "text-foreground"
                            : key === todayKey
                              ? "font-semibold text-primary"
                              : "text-foreground/80",
                      )}
                      aria-label={key}
                      aria-pressed={selected}
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">
            {formatDateRange(draftFrom, draftTo || draftFrom)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onApply(draftFrom, draftTo || draftFrom)}
              disabled={!draftFrom}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DateRangeFilter({ from, to, onChange, variant = "button" }: DateRangeFilterProps) {
  const hasActive = Boolean(from || to);

  return (
    <Popover
      align="end"
      panelClassName="overflow-hidden rounded-2xl relative"
      button={({ open, toggle }) =>
        variant === "icon" ? (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "relative flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground",
              open || hasActive ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
            title={hasActive ? formatDateRange(from, to) : "Filter by date"}
            aria-label="Filter column by date"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {hasActive ? (
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </button>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "inline-flex re h-10 items-center gap-2 rounded-xl border bg-background px-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground",
              hasActive ? "border-primary/40 text-foreground" : "border-border text-muted-foreground",
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <span className="max-w-[14rem] truncate">{formatDateRange(from, to)}</span>
            {hasActive ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onChange("", ""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange("", ""); }
                }}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                aria-label="Clear date range"
              >
                {/* <X className="size-3" aria-hidden /> */}
              </span>
            ) : null}
          </button>
        )
      }
    >
      {({ close }) => (
        <RangePanel
          from={from}
          to={to}
          monthsToShow={variant === "icon" ? 1 : 2}
          onApply={(f, t) => { onChange(f, t); close(); }}
          onClear={() => { onChange("", ""); close(); }}
        />
      )}
    </Popover>
  );
}
