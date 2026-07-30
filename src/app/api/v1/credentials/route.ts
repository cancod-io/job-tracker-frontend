import { type NextRequest } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { optionsResponse } from "@/lib/cors";
import { forwardToBackend } from "@/lib/proxy-to-backend";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const upstream = `${getInternalApiBase()}/api/v1/credentials${qs ? `?${qs}` : ""}`;

  return forwardToBackend(upstream, {
    method: "GET",
    authHeader: req.headers.get("authorization"),
  });
}

export async function POST(req: NextRequest) {
  const upstream = `${getInternalApiBase()}/api/v1/credentials`;
  const body = await req.text();

  return forwardToBackend(upstream, {
    method: "POST",
    authHeader: req.headers.get("authorization"),
    body,
    contentType: req.headers.get("content-type"),
  });
}
