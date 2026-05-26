import { createSessionExpiredError, type ApiAuthErrorShape } from "@/lib/auth-errors";
import { clearStoredTokens, signalSessionExpired } from "@/lib/auth-token";

/** Abortable fetch so a bad API host cannot strand the UI in a loading state forever. */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function messageFromErrorBody(data: ApiAuthErrorShape & { message?: string }): string | null {
  const nested = data.error?.message;
  if (typeof nested === "string" && nested.length > 0) return nested;
  if (typeof data.detail === "string" && data.detail.length > 0) return data.detail;
  if (typeof data.message === "string" && data.message.length > 0) return data.message;
  return null;
}

/** Parse a failed proxy/API response into a short user-facing message. */
export async function readApiErrorMessage(
  res: Response,
  fallback = `Request failed (${res.status})`,
): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return fallback;
  try {
    const data = JSON.parse(text) as ApiAuthErrorShape & { message?: string };
    return messageFromErrorBody(data) ?? fallback;
  } catch {
    return text.length > 200 ? fallback : text;
  }
}

/** Throws `SessionExpiredError` on 401 (clears tokens); otherwise a generic `Error`. */
export async function assertOkResponse(
  res: Response,
  fallback = `Request failed (${res.status})`,
): Promise<void> {
  if (res.ok) return;
  if (res.status === 401) {
    clearStoredTokens();
    signalSessionExpired();
    throw createSessionExpiredError();
  }
  throw new Error(await readApiErrorMessage(res, fallback));
}
