"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  requestNotificationPermission,
  showJobIngestNotification,
} from "@/lib/browser-notifications";
import { removeJobFromJobsListCache } from "@/lib/jobs-list-cache";
import { notify } from "@/lib/notify";
import {
  formatJobsIngestMessage,
  jobsIngestNotificationTitle,
  normalizeAddedJobIds,
} from "@/lib/realtime-jobs-ingest";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";
import type {
  JobDeletedEvent,
  JobDeletedPayload,
  JobsIngestedEvent,
  JobsIngestedPayload,
} from "@/types/realtime";
import { JOBS_PATH } from "@/config/auth-routes";

const JOBS_INGEST_DEBOUNCE_MS = 3_000;

function isJobsIngestedPayload(payload: Record<string, unknown>): payload is JobsIngestedPayload {
  return typeof payload.added === "number";
}

function isJobDeletedPayload(payload: Record<string, unknown>): payload is JobDeletedPayload {
  return typeof payload.job_id === "number";
}

/**
 * Keeps the jobs list React Query cache in sync with WebSocket job events.
 * Mount once in the authenticated shell (via `RealtimeProvider`).
 */
export function useRealtimeJobsSync() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const ingestDebounceRef = useRef<number | null>(null);

  const invalidateJobsList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["jobs-list"] });
  }, [queryClient]);

  const handleJobDeleted = useCallback(
    (payload: JobDeletedPayload) => {
      useRealtimeJobsStore.getState().handleJobDeleted(payload.job_id);
      removeJobFromJobsListCache(queryClient, payload.job_id);
    },
    [queryClient],
  );

  const handleJobsIngested = useCallback(
    (payload: JobsIngestedPayload) => {
      const shouldRefresh = useRealtimeJobsStore.getState().handleJobsIngested(payload);
      if (!shouldRefresh) return;

      const addedJobIds = normalizeAddedJobIds(payload);
      const summary = formatJobsIngestMessage(payload);
      const title = jobsIngestNotificationTitle(payload);

      notify.info(summary, {
        title,
        duration: 8_000,
      });

      void requestNotificationPermission().then(() => {
        showJobIngestNotification({
          title,
          body: summary,
          jobIds: addedJobIds,
          onClick: () => {
            if (pathnameRef.current !== JOBS_PATH) {
              router.push(JOBS_PATH);
            }
          },
        });
      });

      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
      }
      ingestDebounceRef.current = window.setTimeout(() => {
        ingestDebounceRef.current = null;
        invalidateJobsList();
      }, JOBS_INGEST_DEBOUNCE_MS);
    },
    [invalidateJobsList, router],
  );

  const onJobsIngested = useCallback(
    (event: JobsIngestedEvent) => {
      if (!isJobsIngestedPayload(event.payload)) return;
      handleJobsIngested(event.payload);
    },
    [handleJobsIngested],
  );

  const onJobDeleted = useCallback(
    (event: JobDeletedEvent) => {
      if (!isJobDeletedPayload(event.payload)) return;
      handleJobDeleted(event.payload);
    },
    [handleJobDeleted],
  );

  useEffect(() => {
    return () => {
      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
      }
    };
  }, []);

  return { onJobsIngested, onJobDeleted };
}
