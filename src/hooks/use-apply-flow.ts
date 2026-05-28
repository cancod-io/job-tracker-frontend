"use client";

import { useCallback, useState } from "react";
import { notify } from "@/lib/notify";
import { openApplyUrlInBackground } from "@/lib/open-apply-url";
import { useApplicationsStore } from "@/store/applications-store";
import type { Job } from "@/types/job";

type UseApplyFlowReturn = {
  pendingApplyJobs: ReturnType<typeof useApplicationsStore.getState>["pendingApplyJobs"];
  confirmingIds: Set<string>;
  handleApplyClick: (job: Job) => void;
  handleApplyAndTrackDirectly: (job: Job) => Promise<void>;
  handleConfirmApply: (id: string) => Promise<void>;
  dismissPending: (id: string) => void;
};

/**
 * Drives the "click Apply → confirm tracked" flow.
 *
 * - Opens the job's apply URL in a background tab when available.
 * - Adds an entry to the pending-apply banners stack.
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
      if (applyUrl && applyUrl !== "#") {
        const opened = openApplyUrlInBackground(applyUrl);
        if (!opened) {
          notify.error("Pop-up blocked. Allow pop-ups for this site to open apply links.");
        }
      }
      addPendingApplyJob({
        jobId: Number(job.id),
        jobTitle: job.title,
        company: job.company,
        applyUrl,
      });
    },
    [addPendingApplyJob],
  );

  const handleApplyAndTrackDirectly = useCallback(
    async (job: Job) => {
      const applyUrl = job.applyUrl?.trim() ?? "";
      if (applyUrl && applyUrl !== "#") {
        const opened = openApplyUrlInBackground(applyUrl);
        if (!opened) {
          notify.error("Pop-up blocked. Allow pop-ups for this site to open apply links.");
        }
      }

      try {
        await createApp(Number(job.id));
        notify.success(`Marked as applied — ${job.title}`, {
          title: "Application tracked",
        });
      } catch (e) {
        notify.error(e instanceof Error ? e.message : "Could not save application.");
      }
    },
    [createApp],
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
    handleApplyAndTrackDirectly,
    handleConfirmApply,
    dismissPending: removePendingApplyJob,
  };
}
