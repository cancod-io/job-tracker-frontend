"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Calendar,
  ExternalLink,
  GripVertical,
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
import { useClickOutside } from "@/hooks/use-click-outside";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { notify } from "@/lib/notify";
import type { ApiApplication } from "@/types/application";

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

type ApplicationCardProps = {
  application: ApiApplication;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, app: ApiApplication) => void;
  onDragEnd: () => void;
  onCardClick: (app: ApiApplication) => void;
  onNotesPreview: (app: ApiApplication) => void;
  onEditNotes: (app: ApiApplication) => void;
  onDelete: (app: ApiApplication) => void;
};

export function ApplicationCard({
  application: app,
  isDragging,
  onDragStart,
  onDragEnd,
  onCardClick,
  onNotesPreview,
  onEditNotes,
  onDelete,
}: ApplicationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const title = jobTitle(app);
  const company = companyName(app);
  const logoUrl = app.job?.company_logo_url?.trim() || null;
  const location = app.job?.location?.trim() ?? null;
  const salary = app.job?.salary?.trim() ?? null;
  const isRemote = app.job?.is_remote ?? false;
  const applyUrl = app.job?.apply_url?.trim() ?? "#";
  const jobType = app.job?.job_type?.trim() ?? null;
  const experienceLevel = app.job?.experience_level?.trim() ?? null;
  const dateField = app.applied_at ?? app.created_at;

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, app)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if ((e.target as Element).closest("button, a")) return;
        onCardClick(app);
      }}
      className={cn(
        "group relative rounded-xl border bg-card p-4 shadow-sm",
        "select-none cursor-pointer active:cursor-grabbing",
        "transition-all duration-200",
        isDragging
          ? "scale-95 opacity-40 shadow-none"
          : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        "border-border/80",
      )}
      aria-label={`${title} at ${company}`}
    >
      {/* Drag handle hint */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-30">
        <GripVertical className="size-3.5 text-muted-foreground" aria-hidden />
      </div>

      {/* ── Header ── */}
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
          <h4 className="line-clamp-1 text-[13px] font-semibold leading-snug text-foreground">
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
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Application options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-8 z-20 min-w-[11rem] rounded-xl border border-border bg-card py-1 shadow-xl"
            >
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

              {/* <button
                type="button"
                role="menuitem"
                onClick={() => { onCardClick(app); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                View job posting
              </button> */}

              <div className="my-1 border-t border-border/60" role="separator" />

              <button
                type="button"
                role="menuitem"
                onClick={() => { onDelete(app); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="size-3.5 shrink-0" aria-hidden />
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Meta chips ── */}
      {(location || isRemote || salary || jobType || experienceLevel) ? (
        <div className="mt-2.5 space-y-1.5">
          {(location || isRemote || salary) ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {(location || isRemote) ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  {isRemote && location ? `${location} · Remote` : isRemote ? "Remote" : location}
                </span>
              ) : null}
              {salary ? <span className="font-medium text-foreground/80">{salary}</span> : null}
            </div>
          ) : null}

          {(jobType || experienceLevel || (isRemote && !location)) ? (
            <div className="flex flex-wrap gap-1">
              {isRemote && !location ? (
                <span className="inline-flex items-center rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                  Remote
                </span>
              ) : null}
              {jobType ? (
                <span className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {jobType}
                </span>
              ) : null}
              {experienceLevel ? (
                <span className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {experienceLevel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Notes preview ── */}
      {app.notes?.trim() ? (
        <p className="mt-2 line-clamp-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {app.notes.trim()}
        </p>
      ) : null}

      {/* ── Footer ── */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
        <span className={cn("flex items-center gap-1 text-[11px]", freshnessColor(dateField))}>
          <Calendar className="size-3 shrink-0" aria-hidden />
          {relativeDate(dateField)}
        </span>

        {app.notes?.trim() ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNotesPreview(app); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            aria-label="View notes"
          >
            <MessageSquare className="size-3 shrink-0" aria-hidden />
            Notes
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEditNotes(app); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Add notes"
          >
            <MessageSquare className="size-3 shrink-0" aria-hidden />
            Add notes
          </button>
        )}
      </div>
    </article>
  );
}
