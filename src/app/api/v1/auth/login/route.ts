import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return optionsResponse();
}

/** Same-origin proxy: browser → Next → Python API */
export async function POST(req: NextRequest) {
  const upstream = `${getInternalApiBase()}/api/v1/auth/login`;
  const body = await req.text();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": req.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { detail: "Request to backend timed out. Check API_INTERNAL_URL." },
        { status: 504, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        detail:
          "Could not reach the auth API from the Next.js server. Set API_INTERNAL_URL (e.g. http://127.0.0.1:8000) to a backend address reachable from this machine.",
      },
      { status: 502, headers: CORS_HEADERS },
    );
  } finally {
    clearTimeout(timer);
  }
}
