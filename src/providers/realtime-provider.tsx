"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";
import type { JobsIngestedEvent, JobsIngestedPayload } from "@/types/realtime";
import type { RealtimeConnectionStatus, RealtimeStatusMeta } from "@/types/realtime-connection";
import { JOBS_PATH } from "@/config/auth-routes";

const JOBS_INGEST_DEBOUNCE_MS = 3_000;

type RealtimeConnectionContextValue = {
  status: RealtimeConnectionStatus;
  retryInMs: number | null;
  connectedAt: number | null;
  lastCloseCode: number | null;
  lastCloseReason: string | null;
  reconnect: () => void;
  enabled: boolean;
};

const RealtimeConnectionContext = createContext<RealtimeConnectionContextValue | null>(null);

function isJobsIngestedPayload(payload: Record<string, unknown>): payload is JobsIngestedPayload {
  return typeof payload.added === "number" && typeof payload.updated === "number";
}

export function useRealtimeConnection(): RealtimeConnectionContextValue {
  const ctx = useContext(RealtimeConnectionContext);
  if (!ctx) {
    return {
      status: "unavailable",
      retryInMs: null,
      connectedAt: null,
      lastCloseCode: null,
      lastCloseReason: null,
      reconnect: () => {},
      enabled: false,
    };
  }
  return ctx;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus, user, accessToken, logout, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const clientRef = useRef<RealtimeClient | null>(null);
  const ingestDebounceRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("unavailable");
  const [retryInMs, setRetryInMs] = useState<number | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [lastCloseCode, setLastCloseCode] = useState<number | null>(null);
  const [lastCloseReason, setLastCloseReason] = useState<string | null>(null);

  const canConnect =
    authStatus === "authenticated" &&
    Boolean(accessToken) &&
    user?.approval_status === "approved";

  const showIndicator = authStatus === "authenticated" && Boolean(accessToken);

  const handleStatusChange = useCallback((status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta) => {
    setConnectionStatus(status);
    setRetryInMs(meta?.retryInMs ?? null);
    if (meta?.closeCode != null) setLastCloseCode(meta.closeCode);
    if (meta?.closeReason) setLastCloseReason(meta.closeReason);
    if (status === "connected") {
      setConnectedAt(Date.now());
      setRetryInMs(null);
      setLastCloseCode(null);
      setLastCloseReason(null);
    }
  }, []);

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
        void queryClient.invalidateQueries({ queryKey: ["jobs-list"] });
      }, JOBS_INGEST_DEBOUNCE_MS);
    },
    [queryClient, router],
  );

  const onJobsIngested = useCallback(
    (event: JobsIngestedEvent) => {
      if (!isJobsIngestedPayload(event.payload)) return;
      handleJobsIngested(event.payload);
    },
    [handleJobsIngested],
  );

  const reconnect = useCallback(() => {
    if (!canConnect) return;
    setConnectionStatus("connecting");
    setRetryInMs(null);
    clientRef.current?.reconnect();
  }, [canConnect]);

  useEffect(() => {
    if (!canConnect || !accessToken || !user?.id) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setConnectionStatus("unavailable");
      setRetryInMs(null);
      return;
    }

    useRealtimeJobsStore.getState().hydrateForUser(user.id);
    void requestNotificationPermission();

    const client = new RealtimeClient();
    clientRef.current = client;

    client.connect(accessToken, {
      onJobsIngested,
      onStatusChange: handleStatusChange,
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
  }, [canConnect, accessToken, user?.id, onJobsIngested, handleStatusChange, logout, refreshSession]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      useRealtimeJobsStore.getState().reset();
      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
        ingestDebounceRef.current = null;
      }
    }
  }, [authStatus]);

  useEffect(() => {
    return () => {
      if (ingestDebounceRef.current != null) {
        clearTimeout(ingestDebounceRef.current);
      }
    };
  }, []);

  const connectionValue = useMemo<RealtimeConnectionContextValue>(
    () => ({
      status: canConnect ? connectionStatus : "unavailable",
      retryInMs: canConnect ? retryInMs : null,
      connectedAt: canConnect ? connectedAt : null,
      lastCloseCode: canConnect ? lastCloseCode : null,
      lastCloseReason: canConnect ? lastCloseReason : null,
      reconnect,
      enabled: showIndicator,
    }),
    [
      canConnect,
      showIndicator,
      connectionStatus,
      retryInMs,
      connectedAt,
      lastCloseCode,
      lastCloseReason,
      reconnect,
    ],
  );

  return (
    <RealtimeConnectionContext.Provider value={connectionValue}>
      {children}
    </RealtimeConnectionContext.Provider>
  );
}
