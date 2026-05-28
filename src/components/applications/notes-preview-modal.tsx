"use client";

import { Edit2, X } from "lucide-react";
import { companyName, jobTitle } from "@/lib/application-utils";
import type { ApiApplication } from "@/types/application";

type NotesPreviewModalProps = {
  application: ApiApplication;
  onClose: () => void;
  onEdit: () => void;
};

export function NotesPreviewModal({ application: app, onClose, onEdit }: NotesPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Notes preview"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {jobTitle(app)} · {companyName(app)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        {/* Notes content */}
        <div className="px-5 py-4">
          <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm leading-relaxed text-foreground/90">
            {app.notes?.trim() || "No notes."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border/60 px-5 py-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Edit2 className="size-3.5 shrink-0" aria-hidden />
            Edit notes
          </button>
        </div>
      </div>
    </div>
  );
}
