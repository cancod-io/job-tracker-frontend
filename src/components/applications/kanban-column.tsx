"use client";

import { Inbox, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "@/components/applications/application-card";
import { DateRangeFilter } from "@/components/applications/date-range-filter";
import type { KanbanColumn as KanbanColumnConfig } from "@/components/applications/constants";
import type { ApplicationSortKey } from "@/lib/application-utils";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

type KanbanColumnProps = {
  column: KanbanColumnConfig;
  applications: ApiApplication[];
  draggingId: number | null;
  dragOverColumn: ApiApplicationStatus | null;
  onDragStart: (e: React.DragEvent, app: ApiApplication) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, colId: ApiApplicationStatus) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: ApiApplicationStatus) => void;
  onCardClick: (app: ApiApplication) => void;
  onNotesPreview: (app: ApiApplication) => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  sortKey: ApplicationSortKey;
  onSortChange: (key: ApplicationSortKey) => void;
  dateFrom: string;
  dateTo: string;
  onDateChange: (from: string, to: string) => void;
};

export function KanbanColumn({
  column,
  applications,
  draggingId,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onNotesPreview,
  onEditNotes,
  onDelete,
  sortKey,
  onSortChange,
  dateFrom,
  dateTo,
  onDateChange,
}: KanbanColumnProps) {
  const isDragTarget = dragOverColumn === column.id;

  return (
    <div
      className={cn(
        "flex min-w-[220px] flex-1 flex-col rounded-2xl border transition-all duration-200",
        isDragTarget
          ? cn(column.colorClass, "scale-[1.01] shadow-lg")
          : "border-border/60 bg-muted/20",
      )}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* ── Column header ── */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 rounded-full", column.dotClass)} aria-hidden />
          <h3 className={cn("text-sm font-semibold", column.headerClass)}>
            {column.label}
          </h3>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
            {applications.length}
          </span>
        </div>

        {/* Per-column filter + sort */}
        <div className="flex items-center gap-0.5">
          <DateRangeFilter variant="icon" from={dateFrom} to={dateTo} onChange={onDateChange} />
        </div>
      </div>

      {/* ── Cards / drop zone — grows with content, no fixed height ── */}
      <div className="flex flex-col gap-2.5 px-3 pb-4 pt-1">
        {applications.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors duration-200",
              isDragTarget
                ? "border-primary/50 bg-primary/5"
                : "border-border/50 text-muted-foreground",
            )}
          >
            {isDragTarget ? (
              <>
                <Plus className="size-5 text-primary" aria-hidden />
                <p className="text-xs font-medium text-primary">Drop here</p>
              </>
            ) : (
              <>
                <Inbox className="size-5 opacity-40" aria-hidden />
                <p className="text-xs">{column.emptyMessage}</p>
              </>
            )}
          </div>
        ) : (
          <>
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                isDragging={draggingId === app.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onCardClick={onCardClick}
                onNotesPreview={onNotesPreview}
                onEditNotes={onEditNotes}
                onDelete={onDelete}
              />
            ))}

            {isDragTarget ? (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 py-4">
                <Plus className="size-4 text-primary" aria-hidden />
                <span className="ml-1.5 text-xs font-medium text-primary">Drop here</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
