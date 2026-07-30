"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import type { SecureCredential } from "@/types/secure-credentials";

type CredentialsDeleteConfirmProps = {
  credential: SecureCredential;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function CredentialsDeleteConfirm({
  credential,
  onClose,
  onConfirm,
}: CredentialsDeleteConfirmProps) {
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
      aria-label="Delete credential confirmation"
      title="Delete credential?"
      description="This action cannot be undone."
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-500" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground/90">
            Permanently remove{" "}
            <strong className="font-semibold break-all text-foreground">
              {credential.service_name}
            </strong>
            ? The encrypted secret will be deleted.
          </p>
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
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-rose-600"
          >
            {busy ? (
              <>
                <Spinner className="size-3.5 border-white/30 border-t-white" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 shrink-0" aria-hidden />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
