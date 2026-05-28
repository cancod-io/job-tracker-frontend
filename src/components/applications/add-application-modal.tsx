"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { COLUMNS } from "@/components/applications/constants";
import type { ApiApplicationStatus } from "@/types/application";

type AddApplicationModalProps = {
  onClose: () => void;
  onAdd: (jobId: number, status: ApiApplicationStatus, notes: string) => Promise<void>;
};

/**
 * Modal dialog for manually tracking a job by its numeric ID.
 * Lets the user choose an initial Kanban column and add optional notes.
 */
export function AddApplicationModal({ onClose, onAdd }: AddApplicationModalProps) {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<ApiApplicationStatus>("applied");
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
    <Modal
      aria-label="Track a job application"
      title="Track a job"
      description="Enter the Job ID from the listings page to add it to your pipeline."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Job ID */}
        <div className="space-y-1.5">
          <label htmlFor="add-app-job-id" className="text-xs font-semibold text-foreground">
            Job ID <span className="text-rose-500" aria-hidden>*</span>
          </label>
          <input
            ref={inputRef}
            id="add-app-job-id"
            type="number"
            min={1}
            placeholder="e.g. 42"
            value={jobId}
            onChange={(e) => { setJobId(e.target.value); setError(null); }}
            className={cn(
              "form-control w-full",
              error && "border-destructive/70 focus-visible:border-destructive",
            )}
            aria-describedby={error ? "add-app-error" : "add-app-hint"}
            aria-invalid={!!error}
            aria-required="true"
          />
          {error ? (
            <p id="add-app-error" className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <p id="add-app-hint" className="text-[11px] text-muted-foreground">
              You can find the Job ID in the URL or job listing details.
            </p>
          )}
        </div>

        {/* Initial column */}
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
            Notes{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
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
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="size-3.5 border-primary-foreground/30 border-t-primary-foreground" />
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
    </Modal>
  );
}
