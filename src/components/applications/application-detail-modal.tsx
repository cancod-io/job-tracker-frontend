"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { companyInitials } from "@/lib/company-utils";
import { companyName, copyAppToClipboard, jobTitle } from "@/lib/application-utils";
import { COLUMNS } from "@/components/applications/constants";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

type ApplicationDetailModalProps = {
  application: ApiApplication;
  onClose: () => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  onMoveToColumn: (app: ApiApplication, status: ApiApplicationStatus) => void | Promise<void>;
};

export function ApplicationDetailModal({
  application: app,
  onClose,
  onEditNotes,
  onDelete,
  onMoveToColumn,
}: ApplicationDetailModalProps) {
  const [movingTo, setMovingTo] = useState<ApiApplicationStatus | null>(null);

  const title = jobTitle(app);
  const company = companyName(app);
  const logoUrl = app.job?.company_logo_url?.trim() || null;
  const location = app.job?.location?.trim() ?? null;
  const salary = app.job?.salary?.trim() ?? null;
  const isRemote = app.job?.is_remote ?? false;
  const applyUrl = app.job?.apply_url?.trim() ?? "#";
  const jobType = app.job?.job_type?.trim() ?? null;
  const experienceLevel = app.job?.experience_level?.trim() ?? null;
  const description = app.job?.description?.trim() ?? null;

  const currentColumn = COLUMNS.find((c) => c.id === app.status);
  const otherColumns = COLUMNS.filter((c) => c.id !== app.status);

  async function handleMove(status: ApiApplicationStatus) {
    setMovingTo(status);
    try {
      await onMoveToColumn(app, status);
      onClose();
    } finally {
      setMovingTo(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 pt-12"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} details`}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Panel — wider, scrollable body */}
      <div className="relative z-10 mb-12 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 border-b border-border/60 p-6">
          <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-full object-contain p-0.5" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                {companyInitials(company)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-snug text-foreground">{title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              {company}
            </p>
            {currentColumn ? (
              <span className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                currentColumn.id === "applied" && "border-sky-400/40 bg-sky-400/10 text-sky-700 dark:text-sky-300",
                currentColumn.id === "interviewing" && "border-teal-400/40 bg-teal-400/10 text-teal-700 dark:text-teal-300",
                currentColumn.id === "offer" && "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
                currentColumn.id === "failed" && "border-rose-400/40 bg-rose-400/10 text-rose-700 dark:text-rose-300",
              )}>
                <span className={cn("size-1.5 rounded-full", currentColumn.dotClass)} aria-hidden />
                {currentColumn.label}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="space-y-6 p-6">

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {(location || isRemote) ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {isRemote && location ? `${location} · Remote` : isRemote ? "Remote" : location}
              </span>
            ) : null}
            {salary ? (
              <span className="inline-flex items-center rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
                {salary}
              </span>
            ) : null}
            {jobType ? (
              <span className="inline-flex items-center rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                {jobType}
              </span>
            ) : null}
            {experienceLevel ? (
              <span className="inline-flex items-center rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                {experienceLevel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              Applied {formatDate(app.applied_at ?? app.created_at)}
            </span>
          </div>

          {/* Description */}
          {description ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {description}
              </p>
            </div>
          ) : null}

          {/* Notes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <button
                type="button"
                onClick={() => { onEditNotes(app); onClose(); }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquare className="size-3 shrink-0" aria-hidden />
                {app.notes?.trim() ? "Edit notes" : "Add notes"}
              </button>
            </div>
            {app.notes?.trim() ? (
              <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm leading-relaxed text-foreground/80">
                {app.notes.trim()}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">No notes yet.</p>
            )}
          </div>

          {/* Move to column */}
          {otherColumns.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Move to
              </p>
              <div className="flex flex-wrap gap-2">
                {otherColumns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => void handleMove(col.id)}
                    disabled={movingTo !== null}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                      col.id === "applied" && "border-sky-400/40 bg-sky-400/5 text-sky-700 hover:bg-sky-400/10 dark:text-sky-300",
                      col.id === "interviewing" && "border-teal-400/40 bg-teal-400/5 text-teal-700 hover:bg-teal-400/10 dark:text-teal-300",
                      col.id === "offer" && "border-emerald-400/40 bg-emerald-400/5 text-emerald-700 hover:bg-emerald-400/10 dark:text-emerald-300",
                      col.id === "failed" && "border-rose-400/40 bg-rose-400/5 text-rose-700 hover:bg-rose-400/10 dark:text-rose-300",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", col.dotClass)} aria-hidden />
                    {movingTo === col.id ? "Moving…" : col.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          <button
            type="button"
            onClick={() => { onDelete(app); onClose(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5 shrink-0" aria-hidden />
            Remove
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyAppToClipboard(app)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Copy className="size-3.5 shrink-0" aria-hidden />
              Copy card
            </button>
            {applyUrl !== "#" ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                View posting
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
