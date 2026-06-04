import { type NextRequest } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { forwardToBackend } from "@/lib/proxy-to-backend";
import { optionsResponse } from "@/lib/cors";

/** Bcrypt hashing can be slow; allow extra time for the upstream round-trip. */
const PASSWORD_CHANGE_TIMEOUT_MS = 30_000;

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  const upstream = `${getInternalApiBase()}/api/v1/profile/me/password`;
  const body = await req.text();

  return forwardToBackend(upstream, {
    method: "POST",
    authHeader: req.headers.get("authorization"),
    body,
    timeoutMs: PASSWORD_CHANGE_TIMEOUT_MS,
    contentType: req.headers.get("content-type"),
  });
}
