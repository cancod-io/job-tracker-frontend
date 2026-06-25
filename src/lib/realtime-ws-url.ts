import { getPublicApiUrl } from "@/lib/api";

function toWsBase(httpBase: string): string {
  return httpBase.replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
}

/**
 * WebSocket URL for the realtime endpoint.
 * On HTTPS pages, uses same-origin `wss://` (nginx must proxy `/api/v1/ws` to the backend).
 * On HTTP (local dev), connects directly to `NEXT_PUBLIC_API_URL` (e.g. port 8000).
 */
export function buildRealtimeWsUrl(accessToken: string): string {
  const token = encodeURIComponent(accessToken);
  const path = `/api/v1/ws?token=${token}`;

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return `wss://${window.location.host}${path}`;
  }

  const wsBase = toWsBase(getPublicApiUrl());
  return `${wsBase}${path}`;
}
