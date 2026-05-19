import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest) {
  const upstream = `${getInternalApiBase()}/api/v1/auth/me`;
  const auth = req.headers.get("authorization");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(upstream, {
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
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
          "Could not reach the auth API from the Next.js server. Set API_INTERNAL_URL to a backend address reachable from this machine.",
      },
      { status: 502, headers: CORS_HEADERS },
    );
  } finally {
    clearTimeout(timer);
  }
}
