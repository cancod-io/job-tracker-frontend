import type { ApiAuthErrorShape } from "@/lib/auth-errors";

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

type FastApiValidationItem = {
  loc?: unknown;
  msg?: unknown;
  type?: unknown;
};

function formatValidationItem(item: FastApiValidationItem): string | null {
  if (typeof item.msg !== "string" || item.msg.length === 0) return null;
  if (!Array.isArray(item.loc)) return item.msg;
  const path = item.loc
    .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
    .filter((p) => p !== "body")
    .join(".");
  return path ? `${path}: ${item.msg}` : item.msg;
}

function messageFromErrorBody(
  data: ApiAuthErrorShape & { message?: string; detail?: unknown },
): string | null {
  const nested = data.error?.message;
  if (typeof nested === "string" && nested.length > 0) return nested;
  if (typeof data.detail === "string" && data.detail.length > 0) return data.detail;
  // FastAPI Pydantic validation errors arrive as `detail: [{ loc, msg, type }, ...]`.
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const messages = data.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object")
          return formatValidationItem(item as FastApiValidationItem);
        return null;
      })
      .filter((m): m is string => Boolean(m));
    if (messages.length > 0) return messages.join("; ");
  }
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

/** Throws on non-OK responses. Session expiry is handled by `fetchAuthed` in auth-session. */
export async function assertOkResponse(
  res: Response,
  fallback = `Request failed (${res.status})`,
): Promise<void> {
  if (res.ok) return;
  throw new Error(await readApiErrorMessage(res, fallback));
}
