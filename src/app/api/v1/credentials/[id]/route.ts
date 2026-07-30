import { type NextRequest } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { optionsResponse } from "@/lib/cors";
import { forwardToBackend } from "@/lib/proxy-to-backend";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const upstream = `${getInternalApiBase()}/api/v1/credentials/${id}`;

  return forwardToBackend(upstream, {
    method: "GET",
    authHeader: req.headers.get("authorization"),
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const upstream = `${getInternalApiBase()}/api/v1/credentials/${id}`;
  const body = await req.text();

  return forwardToBackend(upstream, {
    method: "PUT",
    authHeader: req.headers.get("authorization"),
    body,
    contentType: req.headers.get("content-type"),
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const upstream = `${getInternalApiBase()}/api/v1/credentials/${id}`;

  return forwardToBackend(upstream, {
    method: "DELETE",
    authHeader: req.headers.get("authorization"),
  });
}
