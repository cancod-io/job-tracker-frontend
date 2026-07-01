import { buildRealtimeWsUrl } from "@/lib/realtime-ws-url";
import type { RealtimeConnectionStatus, RealtimeStatusMeta } from "@/types/realtime-connection";
import type { JobsIngestedEvent, JobDeletedEvent } from "@/types/realtime";

export const WS_CLOSE_AUTH = 4401;
export const WS_CLOSE_DISABLED = 4403;

export const PING_INTERVAL_MS = 30_000;
export const RECONNECT_INITIAL_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export type RealtimeEventHandlers = {
  onJobsIngested: (event: JobsIngestedEvent) => void;
  onJobDeleted: (event: JobDeletedEvent) => void;
  onAuthError: () => void;
  onDisabled: () => void;
  onStatusChange?: (status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta) => void;
};

function isJobsIngestedEvent(data: unknown): data is JobsIngestedEvent {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    record.type === "jobs.ingested" &&
    typeof record.id === "string" &&
    typeof record.ts === "string" &&
    record.payload != null &&
    typeof record.payload === "object"
  );
}

function isJobDeletedEvent(data: unknown): data is JobDeletedEvent {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    record.type === "job.deleted" &&
    typeof record.id === "string" &&
    typeof record.ts === "string" &&
    record.payload != null &&
    typeof record.payload === "object"
  );
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectDelay = RECONNECT_INITIAL_MS;
  private intentionalClose = false;
  private disabled = false;
  private accessToken = "";
  private handlers: RealtimeEventHandlers | null = null;

  connect(accessToken: string, handlers: RealtimeEventHandlers): void {
    this.intentionalClose = false;
    this.disabled = false;
    this.accessToken = accessToken;
    this.handlers = handlers;
    this.clearReconnectTimer();
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emitStatus("disconnected");
  }

  reconnect(): void {
    if (!this.accessToken || !this.handlers) return;
    this.intentionalClose = false;
    this.disabled = false;
    this.reconnectDelay = RECONNECT_INITIAL_MS;
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.openSocket();
  }

  updateToken(accessToken: string): void {
    if (!accessToken || accessToken === this.accessToken) return;
    this.accessToken = accessToken;
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.reconnect();
  }

  private emitStatus(status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta): void {
    this.handlers?.onStatusChange?.(status, meta);
  }

  private openSocket(): void {
    if (this.intentionalClose || this.disabled || !this.handlers || !this.accessToken) return;

    this.emitStatus("connecting");

    const url = buildRealtimeWsUrl(this.accessToken);
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;

    socket.onopen = () => {
      this.reconnectDelay = RECONNECT_INITIAL_MS;
      this.startPing();
      this.emitStatus("connected");
    };

    socket.onmessage = (evt) => {
      let data: unknown;
      try {
        data = JSON.parse(String(evt.data));
      } catch {
        return;
      }

      if (!data || typeof data !== "object") return;
      const msgType = (data as Record<string, unknown>).type;

      if (msgType === "pong" || msgType === "error") return;

      if (isJobsIngestedEvent(data)) {
        this.handlers?.onJobsIngested(data);
        return;
      }

      if (isJobDeletedEvent(data)) {
        this.handlers?.onJobDeleted(data);
      }
    };

    socket.onclose = (evt) => {
      this.stopPing();
      this.ws = null;

      if (this.intentionalClose) return;

      if (evt.code === WS_CLOSE_AUTH) {
        this.emitStatus("disconnected", {
          closeCode: evt.code,
          closeReason: evt.reason || "Authentication required",
        });
        this.handlers?.onAuthError();
        return;
      }
      if (evt.code === WS_CLOSE_DISABLED) {
        this.disabled = true;
        this.emitStatus("disabled", {
          closeCode: evt.code,
          closeReason: evt.reason || "Realtime disabled",
        });
        this.handlers?.onDisabled();
        return;
      }

      this.scheduleReconnect({
        closeCode: evt.code,
        closeReason: evt.reason || undefined,
      });
    };

    socket.onerror = () => {
      /* close handler drives reconnect */
    };
  }

  private scheduleReconnect(meta?: RealtimeStatusMeta): void {
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    this.emitStatus("reconnecting", { ...meta, retryInMs: delay });
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = window.setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ type: "ping" }));
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopPing();
    this.clearReconnectTimer();
  }
}
