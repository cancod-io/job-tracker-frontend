import { NextResponse } from "next/server";
import { BACKEND_OFFLINE_MESSAGE, BACKEND_TIMEOUT_MESSAGE } from "@/lib/backend-errors";
import { CORS_HEADERS } from "@/lib/cors";

export type ForwardToBackendOptions = {
  method: string;
  authHeader: string | null;
  body?: string;
  timeoutMs?: number;
  contentType?: string | null;
};

/**
 * Forwards a request to the Python API and returns a same-origin Next response.
 * Handles 204 No Content and cases where the upstream succeeds but the body
 * stream fails (common after password-change endpoints).
 */
export async function forwardToBackend(
  upstreamUrl: string,
  options: ForwardToBackendOptions,
): Promise<NextResponse> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    let res: Response;
    try {
      res = await fetch(upstreamUrl, {
        method: options.method,
        headers: {
          Accept: "application/json",
          ...(options.body
            ? { "Content-Type": options.contentType ?? "application/json" }
            : {}),
          ...(options.authHeader ? { Authorization: options.authHeader } : {}),
        },
        body: options.body,
        cache: "no-store",
        signal: ctrl.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { detail: BACKEND_TIMEOUT_MESSAGE },
          { status: 504, headers: CORS_HEADERS },
        );
      }
      return NextResponse.json(
        { detail: BACKEND_OFFLINE_MESSAGE },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    if (res.status === 204) {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const resBody = await res.text();
      const headers = new Headers(CORS_HEADERS);
      if (resBody.length > 0) {
        headers.set("Content-Type", res.headers.get("content-type") ?? "application/json");
      }
      return new NextResponse(resBody || null, { status: res.status, headers });
    } catch {
      // Upstream may have committed the change (e.g. password update) but closed
      // the connection before the body finished — treat 2xx as success.
      if (res.ok) {
        return new NextResponse(null, { status: res.status, headers: CORS_HEADERS });
      }
      return NextResponse.json(
        { detail: BACKEND_OFFLINE_MESSAGE },
        { status: 502, headers: CORS_HEADERS },
      );
    }
  } finally {
    clearTimeout(timer);
  }
}
