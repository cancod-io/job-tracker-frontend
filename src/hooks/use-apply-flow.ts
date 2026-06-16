"use client";

import { useCallback, useState } from "react";
import { notify } from "@/lib/notify";
import { useApplicationsStore } from "@/store/applications-store";
import type { Job } from "@/types/job";

type UseApplyFlowReturn = {
  pendingApplyJobs: ReturnType<typeof useApplicationsStore.getState>["pendingApplyJobs"];
  confirmingIds: Set<string>;
  handleApplyClick: (job: Job) => void;
  handleConfirmApply: (id: string) => Promise<void>;
  dismissPending: (id: string) => void;
};

/**
 * Drives the "click Apply → confirm tracked" flow.
 *
 * - Apply buttons open the posting in a new tab via `<a target="_blank">`.
 * - Adds an entry to the pending-apply confirmation banner stack.
 * - On confirm, persists the application via `createApp` and shows feedback.
 */
export function useApplyFlow(): UseApplyFlowReturn {
  const pendingApplyJobs = useApplicationsStore((s) => s.pendingApplyJobs);
  const addPendingApplyJob = useApplicationsStore((s) => s.addPendingApplyJob);
  const removePendingApplyJob = useApplicationsStore((s) => s.removePendingApplyJob);
  const createApp = useApplicationsStore((s) => s.createApp);

  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(() => new Set());

  const handleApplyClick = useCallback(
    (job: Job) => {
      const applyUrl = job.applyUrl?.trim() ?? "";
      const jobId = Number(job.id);

      if (pendingApplyJobs.some((p) => p.jobId === jobId)) {
        return;
      }

      addPendingApplyJob({
        jobId,
        jobTitle: job.title,
        company: job.company,
        applyUrl,
      });
    },
    [addPendingApplyJob, pendingApplyJobs],
  );

  const handleConfirmApply = useCallback(
    async (id: string) => {
      const pending = pendingApplyJobs.find((p) => p.id === id);
      if (!pending) return;

      setConfirmingIds((prev) => new Set(prev).add(id));
      try {
        await createApp(pending.jobId);
        notify.success(`Marked as applied — ${pending.jobTitle}`, {
          title: "Application tracked",
        });
        removePendingApplyJob(id);
      } catch (e) {
        notify.error(e instanceof Error ? e.message : "Could not save application.");
      } finally {
        setConfirmingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [pendingApplyJobs, createApp, removePendingApplyJob],
  );

  return {
    pendingApplyJobs,
    confirmingIds,
    handleApplyClick,
    handleConfirmApply,
    dismissPending: removePendingApplyJob,
  };
}
