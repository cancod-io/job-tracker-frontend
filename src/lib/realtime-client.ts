import { buildRealtimeWsUrl } from "@/lib/realtime-ws-url";
import { realtimeLog, redactRealtimeWsUrl } from "@/lib/realtime-logger";
import type { RealtimeEvent } from "@/types/realtime";

export const WS_CLOSE_AUTH = 4401;
export const WS_CLOSE_DISABLED = 4403;

export const PING_INTERVAL_MS = 30_000;
export const RECONNECT_INITIAL_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export type RealtimeEventHandlers = {
  onEvent: (event: RealtimeEvent) => void;
  onAuthError: () => void;
  onDisabled: () => void;
  onOpen?: () => void;
};

function isRealtimeEvent(data: unknown): data is RealtimeEvent {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.type === "string" &&
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
    realtimeLog.info("connecting");
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    if (this.ws) {
      realtimeLog.info("disconnecting");
      this.ws.close();
      this.ws = null;
    }
  }

  updateToken(accessToken: string): void {
    if (!accessToken || accessToken === this.accessToken) return;
    this.accessToken = accessToken;
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.reconnectNow();
  }

  private reconnectNow(): void {
    realtimeLog.info("reconnecting now (token updated)");
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.openSocket();
  }

  private openSocket(): void {
    if (this.intentionalClose || this.disabled || !this.handlers || !this.accessToken) return;

    const url = buildRealtimeWsUrl(this.accessToken);
    realtimeLog.debug("opening socket", redactRealtimeWsUrl(url));
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      realtimeLog.warn("failed to create WebSocket", err);
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;

    socket.onopen = () => {
      realtimeLog.info("connected");
      this.reconnectDelay = RECONNECT_INITIAL_MS;
      this.startPing();
      this.handlers?.onOpen?.();
    };

    socket.onmessage = (evt) => {
      let data: unknown;
      try {
        data = JSON.parse(String(evt.data));
      } catch {
        realtimeLog.warn("ignored non-JSON message", evt.data);
        return;
      }

      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const msgType = record.type;

      if (msgType === "pong") {
        realtimeLog.debug("pong");
        return;
      }
      if (msgType === "error") {
        realtimeLog.warn("server error message", record);
        return;
      }

      if (isRealtimeEvent(data)) {
        realtimeLog.event(data);
        this.handlers?.onEvent(data);
        return;
      }

      realtimeLog.debug("ignored message", data);
    };

    socket.onclose = (evt) => {
      realtimeLog.info("closed", {
        code: evt.code,
        reason: evt.reason || undefined,
        wasClean: evt.wasClean,
      });
      this.stopPing();
      this.ws = null;

      if (this.intentionalClose) return;

      if (evt.code === WS_CLOSE_AUTH) {
        realtimeLog.warn("auth error — refreshing session");
        this.handlers?.onAuthError();
        return;
      }
      if (evt.code === WS_CLOSE_DISABLED) {
        realtimeLog.warn("realtime disabled by server");
        this.disabled = true;
        this.handlers?.onDisabled();
        return;
      }

      this.scheduleReconnect();
    };

    socket.onerror = () => {
      realtimeLog.warn("socket error");
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    realtimeLog.info(`reconnect scheduled in ${delay}ms`);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = window.setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      realtimeLog.debug("ping");
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
