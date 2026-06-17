"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronRight,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { freshnessColor, relativeDate } from "@/lib/date-utils";
import { companyInitials } from "@/lib/company-utils";
import { companyName, jobTitle } from "@/lib/application-utils";
import { COLUMNS } from "@/components/applications/constants";
import { FloatingMenuPortal } from "@/components/ui/floating-menu";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { notify } from "@/lib/notify";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

function copyLink(applyUrl: string) {
  if (!applyUrl || applyUrl === "#") {
    notify.error("No apply link available for this job.");
    return;
  }
  void (async () => {
    try {
      await copyTextToClipboard(applyUrl);
      notify.success("Link copied to clipboard");
    } catch {
      notify.error("Failed to copy link");
    }
  })();
}

type ApplicationListRowProps = {
  application: ApiApplication;
  onOpen: (app: ApiApplication) => void;
  onNotesPreview: (app: ApiApplication) => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
  onMoveToColumn: (app: ApiApplication, status: ApiApplicationStatus) => void | Promise<void>;
};

export function ApplicationListRow({
  application: app,
  onOpen,
  onNotesPreview,
  onEditNotes,
  onDelete,
  onMoveToColumn,
}: ApplicationListRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const title = jobTitle(app);
  const company = companyName(app);
  const logoUrl = app.job?.company_logo_url?.trim() || null;
  const location = app.job?.location?.trim() ?? null;
  const isRemote = app.job?.is_remote ?? false;
  const salary = app.job?.salary?.trim() ?? null;
  const applyUrl = app.job?.apply_url?.trim() ?? "#";
  const dateField = app.applied_at ?? app.created_at;
  const column = COLUMNS.find((c) => c.id === app.status);

  async function handleStatusChange(next: ApiApplicationStatus) {
    if (next === app.status || moving) return;
    setMoving(true);
    try {
      await onMoveToColumn(app, next);
    } finally {
      setMoving(false);
    }
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all",
        "hover:border-primary/35 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-3.5",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(app)}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
        aria-label={`Open ${title} at ${company}`}
      />

      <div className="relative z-10 flex shrink-0 items-center gap-2 sm:w-[9.5rem]">
        <span className={cn("size-2 shrink-0 rounded-full", column?.dotClass)} aria-hidden />
        <select
          value={app.status}
          disabled={moving}
          onChange={(e) => void handleStatusChange(e.target.value as ApiApplicationStatus)}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "form-control h-8 min-w-0 flex-1 cursor-pointer rounded-lg border border-border bg-background px-2 text-xs font-semibold shadow-sm",
            column?.headerClass,
            moving && "opacity-60",
          )}
          aria-label={`Change status for ${title}`}
        >
          {COLUMNS.map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{company}</span>
          </p>
          {(location || isRemote || salary) ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              {(location || isRemote) ? (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  {isRemote && location ? `${location} · Remote` : isRemote ? "Remote" : location}
                </span>
              ) : null}
              {salary ? <span className="font-medium text-foreground/75">{salary}</span> : null}
            </p>
          ) : null}
          {app.notes?.trim() ? (
            <p className="mt-1.5 line-clamp-1 text-[11px] italic text-muted-foreground">
              {app.notes.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <span className={cn("flex items-center gap-1 text-[11px] tabular-nums", freshnessColor(dateField))}>
          <Calendar className="size-3 shrink-0" aria-hidden />
          {relativeDate(dateField)}
        </span>

        <div className="flex items-center gap-1">
          {app.notes?.trim() ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNotesPreview(app); }}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="View notes"
            >
              <MessageSquare className="size-3.5" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditNotes(app); }}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
              aria-label="Add notes"
            >
              <MessageSquare className="size-3.5" aria-hidden />
            </button>
          )}

          <div>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Application options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>

            <FloatingMenuPortal
              open={menuOpen}
              anchorRef={menuButtonRef}
              onClose={() => setMenuOpen(false)}
              className="min-w-[11rem] rounded-xl border border-border bg-card py-1 shadow-xl"
            >
              <div role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { onOpen(app); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <ChevronRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  View details
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { onEditNotes(app); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <MessageSquare className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  Edit notes
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { copyLink(applyUrl); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <LinkIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  Copy link
                </button>
                <div className="my-1 border-t border-border/60" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { onDelete(app); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  Remove
                </button>
              </div>
            </FloatingMenuPortal>
          </div>
        </div>
      </div>
    </article>
  );
}
