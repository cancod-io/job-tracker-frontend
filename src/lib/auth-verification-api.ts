import {
  createVerificationAuthError,
  networkErrorMessage,
  resolveVerificationError,
  type ApiAuthErrorShape,
} from "@/lib/auth-errors";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import type { ResendVerificationPayload, VerifyEmailPayload } from "@/types/auth";

export const VERIFICATION_CODE_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;

function detailMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
  }
  return fallback;
}

async function parseVerificationFailure(res: Response, fallback: string): Promise<never> {
  const err = (await res.json().catch(() => ({}))) as ApiAuthErrorShape;
  throw createVerificationAuthError(resolveVerificationError(err, fallback));
}

export async function verifyEmailRequest(payload: VerifyEmailPayload): Promise<string> {
  let res: Response;
  try {
    res = await fetchWithTimeout(apiUrl("/api/v1/auth/verify-email"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        code: payload.code.trim(),
      }),
    });
  } catch (e) {
    const networkMsg = networkErrorMessage(e);
    if (networkMsg) throw new Error(networkMsg);
    throw e;
  }

  if (!res.ok) {
    await parseVerificationFailure(res, "Could not verify your email.");
  }

  const data = (await res.json().catch(() => ({}))) as { detail?: string };
  return detailMessage(data, "Email verified successfully.");
}

export async function resendVerificationRequest(
  payload: ResendVerificationPayload,
): Promise<string> {
  let res: Response;
  try {
    res = await fetchWithTimeout(apiUrl("/api/v1/auth/resend-verification"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email.trim() }),
    });
  } catch (e) {
    const networkMsg = networkErrorMessage(e);
    if (networkMsg) throw new Error(networkMsg);
    throw e;
  }

  if (!res.ok) {
    await parseVerificationFailure(res, "Could not resend the verification code.");
  }

  const data = (await res.json().catch(() => ({}))) as { detail?: string };
  return detailMessage(data, "If an account exists, a new code has been sent.");
}
