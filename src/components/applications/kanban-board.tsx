"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Kanban, List, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import {
  readApplicationsViewMode,
  writeApplicationsViewMode,
  type ApplicationsViewMode,
} from "@/lib/applications-view-mode";
import { companyName, jobTitle, sortApplications, filterByDateRange } from "@/lib/application-utils";
import { formatDateRange } from "@/lib/date-utils";
import { useKanbanDnd } from "@/hooks/use-kanban-dnd";
import { useApplicationsStore } from "@/store/applications-store";
import { COLUMNS } from "@/components/applications/constants";
import { StatsBar } from "@/components/applications/stats-bar";
import { KanbanColumn } from "@/components/applications/kanban-column";
import {
  ApplicationsListView,
  type ApplicationListStatusFilter,
} from "@/components/applications/applications-list-view";
import { DateRangeFilter } from "@/components/applications/date-range-filter";
import { SortMenu } from "@/components/applications/sort-menu";
import { AddApplicationModal } from "@/components/applications/add-application-modal";
import { NotesModal } from "@/components/applications/notes-modal";
import { NotesPreviewModal } from "@/components/applications/notes-preview-modal";
import { ApplicationDetailModal } from "@/components/applications/application-detail-modal";
import { SearchInput } from "@/components/ui/search-input";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";
import type { ApplicationSortKey } from "@/lib/application-utils";

/** Fallback sort for any column without an explicit per-column override. */
const DEFAULT_SORT: ApplicationSortKey = "date_applied_desc";

/**
 * Full Kanban board for job-application pipeline management.
 *
 * Responsibilities:
 * - Fetches and owns the applications list (via Zustand store).
 * - Provides search + sort toolbar.
 * - Delegates drag-and-drop to `useKanbanDnd`.
 * - Opens Add / Notes modals on demand.
 * - Shows loading skeleton and empty state.
 */
export function KanbanBoard() {
  const applications = useApplicationsStore((s) => s.applications);
  const loading = useApplicationsStore((s) => s.loading);
  const error = useApplicationsStore((s) => s.error);
  const fetchApplications = useApplicationsStore((s) => s.fetchApplications);
  const createApp = useApplicationsStore((s) => s.createApp);
  const updateStatus = useApplicationsStore((s) => s.updateStatus);
  const updateNotes = useApplicationsStore((s) => s.updateNotes);
  const removeApplication = useApplicationsStore((s) => s.removeApplication);

  // ── Local UI state ──────────────────────────────────────────────────────
  // Global filters (toolbar) — apply to every column unless a column overrides them.
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Per-column overrides, keyed by status. Absent key = inherit the global value.
  const [columnSorts, setColumnSorts] = useState<Partial<Record<ApiApplicationStatus, ApplicationSortKey>>>({});
  const [columnDates, setColumnDates] = useState<Partial<Record<ApiApplicationStatus, { from: string; to: string }>>>({});
  // Modal / dialog state.
  const [editingNotes, setEditingNotes] = useState<ApiApplication | null>(null);
  const [previewingNotes, setPreviewingNotes] = useState<ApiApplication | null>(null);
  const [detailApp, setDetailApp] = useState<ApiApplication | null>(null);
  const [addingApp, setAddingApp] = useState(false);
  const [viewMode, setViewModeState] = useState<ApplicationsViewMode>("kanban");
  const [listStatusFilter, setListStatusFilter] = useState<ApplicationListStatusFilter>("all");
  const [listSort, setListSort] = useState<ApplicationSortKey>(DEFAULT_SORT);

  useEffect(() => {
    setViewModeState(readApplicationsViewMode());
  }, []);

  const setViewMode = useCallback((mode: ApplicationsViewMode) => {
    setViewModeState(mode);
    writeApplicationsViewMode(mode);
  }, []);

  // ── Initial data fetch ──────────────────────────────────────────────────
  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  // ── Drag-and-drop ───────────────────────────────────────────────────────
  const { draggingId, draggingSourceColumn, dragOverColumn, ...dndHandlers } =
    useKanbanDnd({ updateStatus });

  // ── Derived lists ─────────────────────────────────────────────────────────
  // Search applies globally; date + sort are layered per column on top of it.
  const searchedApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) =>
        jobTitle(a).toLowerCase().includes(q) ||
        companyName(a).toLowerCase().includes(q) ||
        (a.notes ?? "").toLowerCase().includes(q),
    );
  }, [applications, searchQuery]);

  // Count shown in the toolbar summary — reflects the global filters only.
  const globalMatchCount = useMemo(
    () => filterByDateRange(searchedApps, dateFrom, dateTo).length,
    [searchedApps, dateFrom, dateTo],
  );

  function appsForColumn(colId: ApiApplicationStatus) {
    const range = columnDates[colId] ?? { from: dateFrom, to: dateTo };
    const cols = filterByDateRange(
      searchedApps.filter((a) => a.status === colId),
      range.from,
      range.to,
    );
    return sortApplications(cols, columnSorts[colId] ?? DEFAULT_SORT);
  }

  const dateFilteredApps = useMemo(
    () => filterByDateRange(searchedApps, dateFrom, dateTo),
    [searchedApps, dateFrom, dateTo],
  );

  const listStatusCounts = useMemo(() => {
    const counts: Record<ApplicationListStatusFilter, number> = {
      all: dateFilteredApps.length,
      applied: 0,
      interviewing: 0,
      offer: 0,
      failed: 0,
    };
    for (const app of dateFilteredApps) {
      counts[app.status] += 1;
    }
    return counts;
  }, [dateFilteredApps]);

  const appsForList = useMemo(() => {
    const filtered =
      listStatusFilter === "all"
        ? dateFilteredApps
        : dateFilteredApps.filter((a) => a.status === listStatusFilter);
    return sortApplications(filtered, listSort);
  }, [dateFilteredApps, listStatusFilter, listSort]);

  function handleColumnDateChange(colId: ApiApplicationStatus, from: string, to: string) {
    setColumnDates((prev) => {
      const next = { ...prev };
      if (!from && !to) delete next[colId];
      else next[colId] = { from, to };
      return next;
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleMoveToColumn = useCallback(
    async (app: ApiApplication, status: ApiApplicationStatus) => {
      try {
        await updateStatus(app.id, status);
        const col = COLUMNS.find((c) => c.id === status);
        notify.success(`Moved to ${col?.label ?? status}`);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to update status.");
      }
    },
    [updateStatus],
  );

  const handleDelete = useCallback(
    async (app: ApiApplication) => {
      if (!window.confirm(`Remove application for ${jobTitle(app)}?`)) return;
      try {
        await removeApplication(app.id);
        notify.success("Application removed.");
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to remove.");
      }
    },
    [removeApplication],
  );

  const handleSaveNotes = useCallback(
    async (notes: string) => {
      if (!editingNotes) return;
      try {
        await updateNotes(editingNotes.id, notes);
        notify.success("Notes saved.");
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to save notes.");
        throw err; // Re-throw so NotesModal stays open
      }
    },
    [editingNotes, updateNotes],
  );

  const handleAddApplication = useCallback(
    async (jobId: number, status: ApiApplicationStatus, notes: string) => {
      await createApp(jobId, notes || undefined, status);
      const col = COLUMNS.find((c) => c.id === status);
      notify.success(`Added to ${col?.label ?? status}`, { title: "Application tracked" });
    },
    [createApp],
  );

  return (
    <>
      {/* ── Stats bar ── */}
      {!loading && applications.length > 0 ? (
        <div className="mb-6">
          <StatsBar applications={applications} />
        </div>
      ) : null}

      {/* ── Toolbar ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, company, notes…"
          aria-label="Search applications"
          className="flex-1 sm:max-w-xs"
        />

        {/* Date range filter */}
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {viewMode === "list" ? (
          <SortMenu value={listSort} onChange={setListSort} />
        ) : null}

        <div
          className="inline-flex shrink-0 rounded-full border border-input bg-muted/50 p-1 shadow-sm"
          role="group"
          aria-label="Applications layout"
        >
          {([
            { mode: "kanban" as const, label: "Board", icon: Kanban },
            { mode: "list" as const, label: "List", icon: List },
          ]).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Track Job */}
        <button
          type="button"
          onClick={() => setAddingApp(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Track Job</span>
          <span className="sm:hidden">Track</span>
        </button>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => void fetchApplications()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Refresh applications"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
        </button>
      </div>

      {/* Search result count / date filter indicator */}
      {(searchQuery.trim() || dateFrom || dateTo) ? (
        <p className="mb-4 -mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <strong className="tabular-nums text-foreground">{globalMatchCount}</strong>{" "}
          {globalMatchCount === 1 ? "application" : "applications"}
          {searchQuery.trim() ? (
            <> matching <strong className="text-foreground">&ldquo;{searchQuery.trim()}&rdquo;</strong></>
          ) : null}
          {(dateFrom || dateTo) ? (
            <> · <strong className="text-foreground">{formatDateRange(dateFrom, dateTo)}</strong></>
          ) : null}
        </p>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="mb-6">
          <ErrorAlert message={error} onRetry={() => void fetchApplications()} />
        </div>
      ) : null}

      {/* Loading skeleton */}
      {loading && applications.length === 0 ? (
        viewMode === "list" ? (
          <div className="space-y-2.5" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="flex min-w-[260px] max-w-[320px] flex-1 flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4"
                aria-hidden
              >
                <div className="flex items-center gap-2">
                  <div className="size-2.5 animate-pulse rounded-full bg-muted-foreground/30" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />
                ))}
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Empty state */}
      {!loading && applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-muted/10 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Briefcase className="size-7 text-muted-foreground" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">No applications yet</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Click <strong>Apply</strong> on any job listing and confirm to track it here.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            Find jobs
          </Link>
        </div>
      ) : null}

      {/* ── Kanban board (full-bleed) ── */}
      {viewMode === "kanban" && (!loading || applications.length > 0) ? (
        <div
          className="-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 flex items-start gap-4 overflow-x-auto px-4 pb-6 pt-1 sm:px-6 lg:px-8 xl:px-10"
          aria-label="Application pipeline board"
          role="region"
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              applications={appsForColumn(col.id)}
              draggingId={draggingId}
              dragOverColumn={dragOverColumn}
              onDragStart={dndHandlers.handleDragStart}
              onDragEnd={dndHandlers.handleDragEnd}
              onDragOver={dndHandlers.handleDragOver}
              onDragLeave={dndHandlers.handleDragLeave}
              onDrop={dndHandlers.handleDrop}
              onCardClick={setDetailApp}
              onNotesPreview={setPreviewingNotes}
              onEditNotes={setEditingNotes}
              onDelete={handleDelete}
              sortKey={columnSorts[col.id] ?? DEFAULT_SORT}
              onSortChange={(key) => setColumnSorts((prev) => ({ ...prev, [col.id]: key }))}
              dateFrom={columnDates[col.id]?.from ?? ""}
              dateTo={columnDates[col.id]?.to ?? ""}
              onDateChange={(from, to) => handleColumnDateChange(col.id, from, to)}
            />
          ))}
        </div>
      ) : null}

      {/* ── List view ── */}
      {viewMode === "list" && (!loading || applications.length > 0) ? (
        <ApplicationsListView
          applications={appsForList}
          statusFilter={listStatusFilter}
          onStatusFilterChange={setListStatusFilter}
          statusCounts={listStatusCounts}
          onOpen={setDetailApp}
          onNotesPreview={setPreviewingNotes}
          onEditNotes={setEditingNotes}
          onDelete={handleDelete}
          onMoveToColumn={handleMoveToColumn}
        />
      ) : null}

      {/* ── Modals ── */}
      {detailApp ? (
        <ApplicationDetailModal
          application={detailApp}
          onClose={() => setDetailApp(null)}
          onEditNotes={(app) => { setDetailApp(null); setEditingNotes(app); }}
          onDelete={(app) => { setDetailApp(null); void handleDelete(app); }}
          onMoveToColumn={handleMoveToColumn}
        />
      ) : null}

      {previewingNotes ? (
        <NotesPreviewModal
          application={previewingNotes}
          onClose={() => setPreviewingNotes(null)}
          onEdit={() => { setEditingNotes(previewingNotes); setPreviewingNotes(null); }}
        />
      ) : null}

      {editingNotes ? (
        <NotesModal
          application={editingNotes}
          onClose={() => setEditingNotes(null)}
          onSave={handleSaveNotes}
        />
      ) : null}

      {addingApp ? (
        <AddApplicationModal
          onClose={() => setAddingApp(false)}
          onAdd={handleAddApplication}
        />
      ) : null}

      {/* Drag indicator toast */}
      {draggingId !== null && viewMode === "kanban" ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg"
          aria-live="polite"
        >
          {draggingSourceColumn ? (
            <>
              Dragging from{" "}
              <strong>{COLUMNS.find((c) => c.id === draggingSourceColumn)?.label}</strong>
              {" "}— drop on a column to move
            </>
          ) : (
            "Drop on a column to move"
          )}
        </div>
      ) : null}
    </>
  );
}
