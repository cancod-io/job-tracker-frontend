"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { companyName, jobTitle } from "@/lib/application-utils";
import type { ApiApplication } from "@/types/application";

type NotesModalProps = {
  application: ApiApplication;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
};

/**
 * Modal for viewing and editing the free-text notes on a tracked application.
 */
export function NotesModal({ application, onClose, onSave }: NotesModalProps) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(notes);
      onClose();
    } catch {
      // Error is surfaced upstream via toast; modal stays open.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      aria-label="Edit application notes"
      title="Application notes"
      description={`${jobTitle(application)} · ${companyName(application)}`}
      onClose={onClose}
    >
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Add notes about this application…"
        className="form-control w-full resize-none"
        aria-label="Application notes"
        autoFocus
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Spinner className="size-3.5 border-primary-foreground/30 border-t-primary-foreground" />
              Saving…
            </>
          ) : (
            "Save notes"
          )}
        </button>
      </div>
    </Modal>
  );
}
