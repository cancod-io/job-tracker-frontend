import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
  getStoredAccessToken,
  REFRESH_BEFORE_EXPIRY_MS,
} from "@/lib/auth-token";

export type SessionTimeoutSnapshot = {
  signedIn: boolean;
  accessRemainingMs: number | null;
  refreshRemainingMs: number | null;
  /** Ms until proactive refresh runs (access expiry minus refresh buffer). */
  proactiveRefreshInMs: number | null;
};

export function formatSessionRemaining(ms: number | null): string {
  if (ms == null) return "n/a";
  if (ms <= 0) return "expired";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getSessionTimeoutSnapshot(): SessionTimeoutSnapshot {
  const signedIn = Boolean(getStoredAccessToken());
  const now = Date.now();
  const accessExp = getAccessTokenExpiresAt();
  const refreshExp = getRefreshTokenExpiresAt();

  const accessRemainingMs = accessExp != null ? accessExp - now : null;
  const refreshRemainingMs = refreshExp != null ? refreshExp - now : null;
  const proactiveRefreshInMs =
    accessExp != null ? accessExp - now - REFRESH_BEFORE_EXPIRY_MS : null;

  return {
    signedIn,
    accessRemainingMs,
    refreshRemainingMs,
    proactiveRefreshInMs,
  };
}

const LOG_INTERVAL_MS = 5_000;
const DEV_LOG_URL = "/api/dev/session-log";

/** Dev-only: POST session remaining time to the Next.js terminal every few seconds. */
export function startSessionTimeoutDevLogger(): () => void {
  if (process.env.NODE_ENV !== "development") return () => {};
  if (typeof window === "undefined") return () => {};

  const tick = () => {
    const snapshot = getSessionTimeoutSnapshot();
    void fetch(DEV_LOG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      keepalive: true,
    }).catch(() => {
      // Dev helper — ignore network errors.
    });
  };

  tick();
  const id = window.setInterval(tick, LOG_INTERVAL_MS);
  return () => window.clearInterval(id);
}
