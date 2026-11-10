"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerUpdateRequest,
} from "@/types/secure-credentials";

type EmployerFormDialogProps = {
  mode: "create" | "edit";
  initial?: CredentialEmployer | null;
  onClose: () => void;
  onSubmit: (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => Promise<void>;
};

export function EmployerFormDialog({
  mode,
  initial,
  onClose,
  onSubmit,
}: EmployerFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name ?? "");
    setWebsiteUrl(initial?.website_url ?? "");
    setNotes(initial?.notes ?? "");
    setError(null);
  }, [initial, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Employer name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        const payload: CredentialEmployerCreateRequest = { name: trimmed };
        if (websiteUrl.trim()) payload.website_url = websiteUrl.trim();
        if (notes.trim()) payload.notes = notes.trim();
        await onSubmit(payload);
      } else {
        const payload: CredentialEmployerUpdateRequest = { name: trimmed };
        if (websiteUrl.trim()) payload.website_url = websiteUrl.trim();
        else payload.clear_website_url = true;
        if (notes.trim()) payload.notes = notes.trim();
        else payload.clear_notes = true;
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      aria-label={mode === "create" ? "Add employer" : "Edit employer"}
      title={mode === "create" ? "Add employer" : "Edit employer"}
      description="Group job portal logins under an employer folder."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="user-employer-name" className="text-xs font-semibold">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="user-employer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            maxLength={200}
            required
            className="form-control w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="user-employer-website" className="text-xs font-semibold">
            Website
          </label>
          <input
            id="user-employer-website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://careers.example.com"
            maxLength={500}
            className="form-control w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="user-employer-notes" className="text-xs font-semibold">
            Notes
          </label>
          <textarea
            id="user-employer-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={4000}
            className="form-control w-full resize-y"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
            {mode === "create" ? "Add employer" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
