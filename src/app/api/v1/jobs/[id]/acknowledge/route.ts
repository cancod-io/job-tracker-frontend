import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { forwardToBackend } from "@/lib/proxy-to-backend";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * Same-origin proxy for `POST /api/v1/jobs/{job_id}/acknowledge`
 * (marks the listing as seen so API `is_new` clears for this user).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const jobId = decodeURIComponent(id).trim();
  if (!jobId) {
    return NextResponse.json({ detail: "Missing job id." }, { status: 400, headers: CORS_HEADERS });
  }

  const upstream = `${getInternalApiBase()}/api/v1/jobs/${encodeURIComponent(jobId)}/acknowledge`;
  const body = await req.text().catch(() => "");

  return forwardToBackend(upstream, {
    method: "POST",
    authHeader: req.headers.get("authorization"),
    body: body || "{}",
    contentType: req.headers.get("content-type") ?? "application/json",
  });
}
