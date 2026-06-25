const LOG_PREFIX = "[realtime]";

function isEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Dev-only console logger for the realtime WebSocket client. */
export const realtimeLog = {
  debug(...args: unknown[]): void {
    if (!isEnabled()) return;
    console.debug(LOG_PREFIX, ...args);
  },
  info(...args: unknown[]): void {
    if (!isEnabled()) return;
    console.info(LOG_PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    if (!isEnabled()) return;
    console.warn(LOG_PREFIX, ...args);
  },
  event(event: { type: string; id?: string; ts?: string; payload?: unknown }): void {
    if (!isEnabled()) return;
    console.info(LOG_PREFIX, "event", event.type, {
      id: event.id,
      ts: event.ts,
      payload: event.payload,
    });
  },
};

/** Redact token query param before logging a WebSocket URL. */
export function redactRealtimeWsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "[redacted]");
    }
    return parsed.toString();
  } catch {
    return url.replace(/token=[^&]+/i, "token=[redacted]");
  }
}
