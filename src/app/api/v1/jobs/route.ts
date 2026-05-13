import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";

/**
 * Same-origin proxy for `GET /api/v1/jobs` so browsers never cross-origin call
 * the Python API (avoids CORS when the app is opened via LAN IP, HTTPS, etc.).
 */
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const upstream = `${getInternalApiBase()}/api/v1/jobs${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Could not reach the jobs API. Check API_INTERNAL_URL / NEXT_PUBLIC_API_URL and network." },
      { status: 502 },
    );
  }
}
