"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/auth-token";
import {
  formatJobsIngestMessage,
  jobsIngestNotificationTitle,
  normalizeAddedJobIds,
} from "@/lib/realtime-jobs-ingest";
import {
  requestNotificationPermission,
  showJobIngestNotification,
} from "@/lib/browser-notifications";
import { notify } from "@/lib/notify";
import { RealtimeClient } from "@/lib/realtime-client";
import { realtimeLog } from "@/lib/realtime-logger";
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";
import type { JobsIngestedPayload, RealtimeEvent } from "@/types/realtime";
import { JOBS_PATH } from "@/config/auth-routes";

const JOBS_INGEST_DEBOUNCE_MS = 3_000;

function isJobsIngestedPayload(payload: Record<string, unknown>): payload is JobsIngestedPayload {
  return typeof payload.added === "number" && typeof payload.updated === "number";
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status, user, accessToken, logout, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const clientRef = useRef<RealtimeClient | null>(null);
  const ingestDebounceRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const handleJobsIngested = useCallback(
    (payload: JobsIngestedPayload) => {
      const shouldRefresh = useRealtimeJobsStore.getState().handleJobsIngested(payload);
      if (!shouldRefresh) return;

      const addedJobIds = normalizeAddedJobIds(payload);
      const summary = formatJobsIngestMessage(payload);
      const title = jobsIngestNotificationTitle(payload);

      realtimeLog.info("jobs.ingested handled", {
        added: payload.added,
        updated: payload.updated,
        addedJobIds,
        summary,
      });

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
        void queryClient.invalidateQueries({ queryKey: ["jobs-list"] });
      }, JOBS_INGEST_DEBOUNCE_MS);
    },
    [queryClient, router],
  );

  const onEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type !== "jobs.ingested") {
        realtimeLog.debug("unhandled event type", event.type);
      }
      if (event.type === "jobs.ingested" && isJobsIngestedPayload(event.payload)) {
        handleJobsIngested(event.payload);
      }
    },
    [handleJobsIngested],
  );

  const canConnect =
    status === "authenticated" &&
    Boolean(accessToken) &&
    user?.approval_status === "approved";

  useEffect(() => {
    if (!canConnect || !accessToken) {
      realtimeLog.info("not connecting", { status, approved: user?.approval_status });
      clientRef.current?.disconnect();
      clientRef.current = null;
      return;
    }

    realtimeLog.info("starting client");

    void requestNotificationPermission();

    const client = new RealtimeClient();
    clientRef.current = client;

    client.connect(accessToken, {
      onEvent,
      onAuthError: () => {
        void (async () => {
          await refreshSession();
          if (!getStoredAccessToken()) {
            logout();
          }
        })();
      },
      onDisabled: () => {
        clientRef.current?.disconnect();
        clientRef.current = null;
      },
    });

    return () => {
      client.disconnect();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [canConnect, accessToken, onEvent, logout, refreshSession]);

  useEffect(() => {
    if (status === "unauthenticated") {
      useRealtimeJobsStore.getState().reset();
      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
        ingestDebounceRef.current = null;
      }
    }
  }, [status]);

  useEffect(() => {
    return () => {
      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
      }
    };
  }, []);

  return children;
}
