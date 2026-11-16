"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import type {
  WebsiteLink,
  WebsiteLinkCreateRequest,
  WebsiteLinkUpdateRequest,
} from "@/types/website-links";

type Mode = "create" | "edit";

type LinksFormDialogProps = {
  mode: Mode;
  initial?: WebsiteLink | null;
  defaultIndex?: number;
  onClose: () => void;
  onSubmit: (payload: WebsiteLinkCreateRequest | WebsiteLinkUpdateRequest) => Promise<void>;
};

export function LinksFormDialog({
  mode,
  initial,
  defaultIndex = 1,
  onClose,
  onSubmit,
}: LinksFormDialogProps) {
  const [displayIndex, setDisplayIndex] = useState(String(initial?.display_index ?? defaultIndex));
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [clearDescription, setClearDescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayIndex(String(initial?.display_index ?? defaultIndex));
    setUrl(initial?.url ?? "");
    setDescription(initial?.description ?? "");
    setClearDescription(false);
    setSubmitError(null);
  }, [initial, mode, defaultIndex]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const index = Number(displayIndex);
    if (!Number.isFinite(index) || index < 0) {
      setSubmitError("Display index must be a non-negative number.");
      return;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setSubmitError("URL is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: WebsiteLinkCreateRequest = {
          display_index: Math.floor(index),
          url: trimmedUrl,
        };
        const trimmedDesc = description.trim();
        if (trimmedDesc) payload.description = trimmedDesc;
        await onSubmit(payload);
      } else {
        const payload: WebsiteLinkUpdateRequest = {
          display_index: Math.floor(index),
          url: trimmedUrl,
        };
        if (clearDescription) {
          payload.clear_description = true;
        } else {
          const trimmedDesc = description.trim();
          payload.description = trimmedDesc || null;
        }
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save link.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <Modal
      aria-label={isCreate ? "Add link" : "Edit link"}
      title={isCreate ? "Add Link" : "Edit Link"}
      description="Shared with every user and admin. Display index controls sort order."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="link-display-index" className="text-xs font-semibold">
            Display index <span className="text-rose-500">*</span>
          </label>
          <input
            id="link-display-index"
            type="number"
            min={0}
            step={1}
            value={displayIndex}
            onChange={(e) => setDisplayIndex(e.target.value)}
            required
            className="form-control w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="link-url" className="text-xs font-semibold">
            URL <span className="text-rose-500">*</span>
          </label>
          <input
            id="link-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="form-control w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="link-description" className="text-xs font-semibold">
            Description
          </label>
          <textarea
            id="link-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value) setClearDescription(false);
            }}
            rows={3}
            maxLength={4000}
            disabled={!isCreate && clearDescription}
            placeholder="Optional"
            className="form-control w-full resize-y"
          />
          {!isCreate && Boolean(initial?.description?.trim()) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearDescription}
                onChange={(e) => {
                  setClearDescription(e.target.checked);
                  if (e.target.checked) setDescription("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear description
            </label>
          ) : null}
        </div>

        {submitError ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="hover:bg-primary/92 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {submitting ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
            {isCreate ? "Save Link" : "Update Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
