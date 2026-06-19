"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { companyName, jobTitle } from "@/lib/application-utils";
import type { ApiApplication } from "@/types/application";

type DeleteApplicationModalProps = {
  application: ApiApplication;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
};

export function DeleteApplicationModal({
  application,
  onClose,
  onConfirm,
  deleting,
}: DeleteApplicationModalProps) {
  const title = jobTitle(application);
  const company = companyName(application);

  return (
    <Modal
      aria-label="Confirm remove application"
      title="Remove application?"
      description="This action cannot be undone."
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-500" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground/90">
            Remove <strong className="font-semibold text-foreground">{title}</strong>
            {company ? (
              <>
                {" "}
                at <strong className="font-semibold text-foreground">{company}</strong>
              </>
            ) : null}{" "}
            from your pipeline?
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={deleting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-rose-600"
          >
            {deleting ? (
              <>
                <Spinner className="size-3.5 border-white/30 border-t-white" />
                Removing…
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 shrink-0" aria-hidden />
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
