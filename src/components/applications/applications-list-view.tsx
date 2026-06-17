"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationListRow } from "@/components/applications/application-list-row";
import { COLUMNS } from "@/components/applications/constants";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

export type ApplicationListStatusFilter = "all" | ApiApplicationStatus;

type ApplicationsListViewProps = {
  applications: ApiApplication[];
  statusFilter: ApplicationListStatusFilter;
  onStatusFilterChange: (filter: ApplicationListStatusFilter) => void;
  statusCounts: Record<ApplicationListStatusFilter, number>;
  onOpen: (app: ApiApplication) => void;
  onNotesPreview: (app: ApiApplication) => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  onMoveToColumn: (app: ApiApplication, status: ApiApplicationStatus) => void | Promise<void>;
};

const ALL_TAB: { id: ApplicationListStatusFilter; label: string } = {
  id: "all",
  label: "All",
};

export function ApplicationsListView({
  applications,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  onOpen,
  onNotesPreview,
  onEditNotes,
  onDelete,
  onMoveToColumn,
}: ApplicationsListViewProps) {
  const tabs: { id: ApplicationListStatusFilter; label: string; dotClass?: string }[] = [
    ALL_TAB,
    ...COLUMNS.map((col) => ({
      id: col.id,
      label: col.label,
      dotClass: col.dotClass,
    })),
  ];

  return (
    <div className="space-y-4" aria-label="Applications list view">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter by application status"
      >
        {tabs.map((tab) => {
          const active = statusFilter === tab.id;
          const count = statusCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusFilterChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary/45 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {tab.dotClass ? (
                <span className={cn("size-2 rounded-full", tab.dotClass)} aria-hidden />
              ) : null}
              {tab.label}
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

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
          <Inbox className="size-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {statusFilter === "all"
              ? "No applications match your current filters."
              : `No applications in ${COLUMNS.find((c) => c.id === statusFilter)?.label ?? statusFilter}.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {applications.map((app) => (
            <li key={app.id}>
              <ApplicationListRow
                application={app}
                onOpen={onOpen}
                onNotesPreview={onNotesPreview}
                onEditNotes={onEditNotes}
                onDelete={onDelete}
                onMoveToColumn={onMoveToColumn}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
