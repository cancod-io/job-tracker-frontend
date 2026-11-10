"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

type EmployerDeleteConfirmProps = {
  employerName: string;
  credentialCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function EmployerDeleteConfirm({
  employerName,
  credentialCount,
  onClose,
  onConfirm,
}: EmployerDeleteConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      aria-label="Delete employer confirmation"
      title="Delete employer folder"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <p className="text-sm text-foreground">
          Delete <span className="break-all font-semibold">&apos;{employerName}&apos;</span>?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {credentialCount > 0
            ? `This folder still has ${credentialCount} credential${credentialCount === 1 ? "" : "s"}. Move or delete them first.`
            : "This removes the empty employer folder."}
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {busy ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
          Delete
        </button>
      </div>
    </Modal>
  );
}
