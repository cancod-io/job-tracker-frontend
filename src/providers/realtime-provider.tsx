"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStoredAccessToken } from "@/lib/auth-token";
import {
  requestNotificationPermission,
} from "@/lib/browser-notifications";
import { RealtimeClient } from "@/lib/realtime-client";
import { useRealtimeJobsSync } from "@/hooks/use-realtime-jobs-sync";
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeJobsStore } from "@/store/realtime-jobs-store";
import type { RealtimeConnectionStatus, RealtimeStatusMeta } from "@/types/realtime-connection";

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
  const { onJobsIngested, onJobDeleted } = useRealtimeJobsSync();

  const clientRef = useRef<RealtimeClient | null>(null);

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
      onJobDeleted,
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
  }, [
    canConnect,
    accessToken,
    user?.id,
    onJobsIngested,
    onJobDeleted,
    handleStatusChange,
    logout,
    refreshSession,
  ]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      useRealtimeJobsStore.getState().reset();
    }
  }, [authStatus]);

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
