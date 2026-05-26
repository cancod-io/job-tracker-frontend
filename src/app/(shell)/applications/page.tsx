"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  GripVertical,
  Inbox,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useApplicationsStore } from "@/store/applications-store";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

/* ─── Column configuration ──────────────────────────────────────────────── */

type KanbanColumn = {
  id: ApiApplicationStatus;
  label: string;
  description: string;
  colorClass: string;
  headerClass: string;
  dotClass: string;
  emptyMessage: string;
};

const COLUMNS: KanbanColumn[] = [
  {
    id: "new",
    label: "Pending",
    description: "Applications you're considering",
    colorClass: "border-amber-400/40 bg-amber-400/5",
    headerClass: "text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-400",
    emptyMessage: "No pending applications",
  },
  {
    id: "applied",
    label: "Applied",
    description: "Submitted applications",
    colorClass: "border-sky-400/40 bg-sky-400/5",
    headerClass: "text-sky-600 dark:text-sky-400",
    dotClass: "bg-sky-400",
    emptyMessage: "No applied jobs yet",
  },
  {
    id: "interviewing",
    label: "Interviewing",
    description: "Active interview processes",
    colorClass: "border-teal-400/40 bg-teal-400/5",
    headerClass: "text-teal-600 dark:text-teal-400",
    dotClass: "bg-teal-400",
    emptyMessage: "No interviews in progress",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Closed applications",
    colorClass: "border-rose-400/40 bg-rose-400/5",
    headerClass: "text-rose-600 dark:text-rose-400",
    dotClass: "bg-rose-400",
    emptyMessage: "No rejections yet — keep going!",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function companyInitials(name: string): string {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function relativeDate(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
}

function jobTitle(app: ApiApplication): string {
  return (
    app.job?.job_title?.trim() ??
    app.job?.title?.trim() ??
    `Job #${app.job_id}`
  );
}

function companyName(app: ApiApplication): string {
  return app.job?.company?.trim() ?? "Unknown Company";
}

/* ─── Stats Bar ─────────────────────────────────────────────────────────── */

type StatsBarProps = { applications: ApiApplication[] };

function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const byStatus = (s: ApiApplicationStatus) => applications.filter((a) => a.status === s).length;
  const applied = byStatus("applied");
  const interviewing = byStatus("interviewing");
  const pending = byStatus("new");

  const stats = [
    { label: "Total", value: total, icon: Briefcase, color: "text-foreground" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-500" },
    { label: "Applied", value: applied, icon: CheckCircle2, color: "text-sky-500" },
    { label: "Interviewing", value: interviewing, icon: TrendingUp, color: "text-teal-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60", color)}>
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold tabular-nums leading-none text-foreground">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Add Application Modal ─────────────────────────────────────────────── */

type AddApplicationModalProps = {
  onClose: () => void;
  onAdd: (jobId: number, status: ApiApplicationStatus, notes: string) => Promise<void>;
};

function AddApplicationModal({ onClose, onAdd }: AddApplicationModalProps) {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<ApiApplicationStatus>("new");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = parseInt(jobId.trim(), 10);
    if (!jobId.trim() || isNaN(id) || id <= 0) {
      setError("Enter a valid numeric Job ID.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdd(id, status, notes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Track a job application"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Track a job</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Enter the Job ID from the listings page to add it to your pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Job ID */}
          <div className="space-y-1.5">
            <label htmlFor="add-app-job-id" className="text-xs font-semibold text-foreground">
              Job ID <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="add-app-job-id"
              type="number"
              min={1}
              placeholder="e.g. 42"
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                setError(null);
              }}
              className={cn(
                "form-control w-full",
                error && "border-destructive/70 focus-visible:border-destructive",
              )}
              aria-describedby={error ? "add-app-error" : undefined}
              aria-invalid={!!error}
            />
            {error ? (
              <p id="add-app-error" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              You can find the Job ID in the URL or job listing details.
            </p>
          </div>

          {/* Initial status */}
          <div className="space-y-1.5">
            <label htmlFor="add-app-status" className="text-xs font-semibold text-foreground">
              Initial column
            </label>
            <select
              id="add-app-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApiApplicationStatus)}
              className="form-control w-full"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="add-app-notes" className="text-xs font-semibold text-foreground">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="add-app-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Why you're interested, referral contact, deadline…"
              className="form-control w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" aria-hidden />
                  Track job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Notes Modal ───────────────────────────────────────────────────────── */

type NotesModalProps = {
  application: ApiApplication;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
};

function NotesModal({ application, onClose, onSave }: NotesModalProps) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(notes);
      onClose();
    } catch {
      /* error surfaced upstream */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit notes"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Application notes</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {jobTitle(application)} · {companyName(application)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add notes about this application..."
          className="form-control w-full resize-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Application Card ──────────────────────────────────────────────────── */

type ApplicationCardProps = {
  application: ApiApplication;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, app: ApiApplication) => void;
  onDragEnd: () => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  onMoveToColumn: (app: ApiApplication, status: ApiApplicationStatus) => void | Promise<void>;
};

function ApplicationCard({
  application: app,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onEditNotes,
  onDelete,
  onMoveToColumn,
}: ApplicationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const title = jobTitle(app);
  const company = companyName(app);
  const logoUrl = app.job?.company_logo_url?.trim() || null;
  const location = app.job?.location?.trim() ?? null;
  const salary = app.job?.salary?.trim() ?? null;
  const isRemote = app.job?.is_remote ?? false;
  const applyUrl = app.job?.apply_url?.trim() ?? "#";

  const otherColumns = COLUMNS.filter((c) => c.id !== app.status);

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, app)}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 select-none",
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 scale-95 shadow-none",
        isDragOver && "ring-2 ring-primary/40",
        !isDragging && "hover:-translate-y-0.5 hover:shadow-md hover:border-border",
        "border-border/80",
      )}
      aria-label={`${title} at ${company}`}
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-30">
        <GripVertical className="size-3.5 text-muted-foreground" aria-hidden />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-full object-contain p-0.5"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground">
              {companyInitials(company)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
            {title}
          </h4>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{company}</span>
          </p>
        </div>

        {/* Context menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Application options"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-8 z-20 min-w-[10rem] rounded-xl border border-border bg-card py-1 shadow-xl">
              {otherColumns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    onMoveToColumn(app, col.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", col.dotClass)} aria-hidden />
                  Move to {col.label}
                </button>
              ))}
              <div className="my-1 border-t border-border/60" />
              <button
                type="button"
                onClick={() => {
                  onEditNotes(app);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-70" aria-hidden />
                Edit notes
              </button>
              {applyUrl !== "#" ? (
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  View job posting
                </a>
              ) : null}
              <div className="my-1 border-t border-border/60" />
              <button
                type="button"
                onClick={() => {
                  onDelete(app);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="size-3.5 shrink-0" aria-hidden />
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Meta info */}
      {(location || isRemote || salary) ? (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {location || isRemote ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {isRemote ? "Remote" : location}
            </span>
          ) : null}
          {salary ? (
            <span className="font-medium text-foreground/80">{salary}</span>
          ) : null}
        </div>
      ) : null}

      {/* Notes preview */}
      {app.notes?.trim() ? (
        <p className="mt-2 line-clamp-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {app.notes.trim()}
        </p>
      ) : null}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="size-3 shrink-0" aria-hidden />
          {relativeDate(app.applied_at ?? app.created_at)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditNotes(app);
          }}
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Add or edit notes"
        >
          <MessageSquare className="size-3 shrink-0" aria-hidden />
          {app.notes?.trim() ? "Notes" : "Add note"}
        </button>
      </div>
    </article>
  );
}

/* ─── Kanban Column ─────────────────────────────────────────────────────── */

type KanbanColumnProps = {
  column: KanbanColumn;
  applications: ApiApplication[];
  draggingId: number | null;
  dragOverColumn: ApiApplicationStatus | null;
  onDragStart: (e: React.DragEvent, app: ApiApplication) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, colId: ApiApplicationStatus) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: ApiApplicationStatus) => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  onMoveToColumn: (app: ApiApplication, status: ApiApplicationStatus) => void | Promise<void>;
  onAddClick?: () => void;
};

function KanbanColumnView({
  column,
  applications,
  draggingId,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditNotes,
  onDelete,
  onMoveToColumn,
  onAddClick,
}: KanbanColumnProps) {
  const isDragTarget = dragOverColumn === column.id;

  return (
    <div
      className={cn(
        "flex min-w-[220px] flex-1 flex-col rounded-2xl border transition-all duration-200",
        isDragTarget ? column.colorClass + " scale-[1.01] shadow-lg" : "border-border/60 bg-muted/20",
      )}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 rounded-full", column.dotClass)} aria-hidden />
          <h3 className={cn("text-sm font-semibold", column.headerClass)}>{column.label}</h3>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
            {applications.length}
          </span>
        </div>
        {onAddClick ? (
          <button
            type="button"
            onClick={onAddClick}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Add application to ${column.label}`}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Drop zone + cards */}
      <div
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-4 pt-1",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/60",
        )}
      >
        {applications.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-200",
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
                isDragOver={false}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onEditNotes={onEditNotes}
                onDelete={onDelete}
                onMoveToColumn={onMoveToColumn}
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

/* ─── Sort options ──────────────────────────────────────────────────────── */

type SortKey = "date_applied_desc" | "date_applied_asc" | "company_asc" | "priority_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_applied_desc", label: "Date Applied (Newest)" },
  { value: "date_applied_asc", label: "Date Applied (Oldest)" },
  { value: "company_asc", label: "Company (A → Z)" },
  { value: "priority_desc", label: "Priority (High → Low)" },
];

function sortApplications(apps: ApiApplication[], sort: SortKey): ApiApplication[] {
  return [...apps].sort((a, b) => {
    switch (sort) {
      case "date_applied_desc":
        return new Date(b.applied_at ?? b.created_at).getTime() - new Date(a.applied_at ?? a.created_at).getTime();
      case "date_applied_asc":
        return new Date(a.applied_at ?? a.created_at).getTime() - new Date(b.applied_at ?? b.created_at).getTime();
      case "company_asc":
        return companyName(a).localeCompare(companyName(b));
      case "priority_desc":
        return (b.priority ?? 0) - (a.priority ?? 0);
    }
  });
}

/* ─── Main Kanban Board Page ─────────────────────────────────────────────── */

export default function ApplicationsPage() {
  const {
    applications,
    loading,
    error,
    fetchApplications,
    createApp,
    updateStatus,
    updateNotes,
    removeApplication,
  } = useApplicationsStore();

  const [sort, setSort] = useState<SortKey>("date_applied_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingSourceColumn, setDraggingSourceColumn] = useState<ApiApplicationStatus | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApiApplicationStatus | null>(null);
  const [editingNotes, setEditingNotes] = useState<ApiApplication | null>(null);
  const [addingApp, setAddingApp] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (!sortOpen) return;
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  /* Filter + sort */
  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? applications.filter(
          (a) =>
            jobTitle(a).toLowerCase().includes(q) ||
            companyName(a).toLowerCase().includes(q) ||
            (a.notes ?? "").toLowerCase().includes(q),
        )
      : applications;
    return sortApplications(filtered, sort);
  }, [applications, searchQuery, sort]);

  function appsForColumn(colId: ApiApplicationStatus) {
    return filteredApps.filter((a) => a.status === colId);
  }

  /* Drag-and-drop handlers */
  const handleDragStart = useCallback(
    (e: React.DragEvent, app: ApiApplication) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify({ id: app.id, status: app.status }));
      setDraggingId(app.id);
      setDraggingSourceColumn(app.status);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDraggingSourceColumn(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, colId: ApiApplicationStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverColumn !== colId) setDragOverColumn(colId);
    },
    [dragOverColumn],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, colId: ApiApplicationStatus) => {
      e.preventDefault();
      setDragOverColumn(null);
      setDraggingId(null);
      setDraggingSourceColumn(null);

      let payload: { id: number; status: ApiApplicationStatus } | null = null;
      try {
        payload = JSON.parse(e.dataTransfer.getData("application/json")) as {
          id: number;
          status: ApiApplicationStatus;
        };
      } catch {
        return;
      }

      if (!payload || payload.status === colId) return;

      try {
        await updateStatus(payload.id, colId);
        const col = COLUMNS.find((c) => c.id === colId);
        notify.success(`Moved to ${col?.label ?? colId}`);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to update status.");
      }
    },
    [updateStatus],
  );

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
        throw err;
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

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <>
      <PageHeader
        title="My Applications"
        description="Track your job search pipeline from first contact to offer."
        breadcrumbs={[{ label: "Jobs", href: "/jobs" }, { label: "Applications" }]}
        actions={
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            Browse jobs
          </Link>
        }
      />

      {/* Stats */}
      {!loading && applications.length > 0 ? (
        <div className="mb-6">
          <StatsBar applications={applications} />
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Search applications…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control h-10 w-full pl-9 text-sm"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowUpDown className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <span className="sm:hidden">Sort</span>
            <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", sortOpen && "rotate-180")} aria-hidden />
          </button>
          {sortOpen ? (
            <div className="absolute right-0 top-12 z-20 min-w-[13rem] rounded-xl border border-border bg-card py-1 shadow-xl">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSort(opt.value);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-muted",
                    sort === opt.value ? "text-primary" : "text-foreground",
                  )}
                >
                  {sort === opt.value ? (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  ) : (
                    <span className="size-1.5 rounded-full bg-transparent" aria-hidden />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Track Job button */}
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

      {/* Error state */}
      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <XCircle className="size-4 shrink-0" aria-hidden />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchApplications()}
            className="ml-auto text-xs font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Loading skeleton */}
      {loading && applications.length === 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex min-w-[260px] max-w-[320px] flex-1 flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
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
              Click Apply on any job listing and confirm to track it here.
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

      {/* Kanban board — breaks out of shell padding to use full viewport width */}
      {!loading || applications.length > 0 ? (
        <div
          className="-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 flex gap-4 overflow-x-auto px-4 pb-6 pt-1 sm:px-6 lg:px-8 xl:px-10"
          aria-label="Application pipeline board"
        >
          {COLUMNS.map((col) => (
            <KanbanColumnView
              key={col.id}
              column={col}
              applications={appsForColumn(col.id)}
              draggingId={draggingId}
              dragOverColumn={dragOverColumn}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onEditNotes={setEditingNotes}
              onDelete={handleDelete}
              onMoveToColumn={handleMoveToColumn}
              onAddClick={() => setAddingApp(true)}
            />
          ))}
        </div>
      ) : null}

      {/* Notes modal */}
      {editingNotes ? (
        <NotesModal
          application={editingNotes}
          onClose={() => setEditingNotes(null)}
          onSave={handleSaveNotes}
        />
      ) : null}

      {/* Add application modal */}
      {addingApp ? (
        <AddApplicationModal
          onClose={() => setAddingApp(false)}
          onAdd={handleAddApplication}
        />
      ) : null}

      {/* Drag-in-progress indicator */}
      {draggingId !== null ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg"
          aria-live="polite"
        >
          {draggingSourceColumn ? (
            <>Dragging from <strong>{COLUMNS.find((c) => c.id === draggingSourceColumn)?.label}</strong> — drop on a column to move</>
          ) : (
            "Drop on a column to move"
          )}
        </div>
      ) : null}

      <style>{`
        .scrollbar-thin { scrollbar-width: thin; }
        .scrollbar-track-transparent { scrollbar-color: hsl(var(--border) / 0.6) transparent; }
      `}</style>
    </>
  );
}
