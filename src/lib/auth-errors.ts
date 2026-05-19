/** Stable API error codes from backend `AppError`. */

export type ApiAuthErrorShape = {
  error?: { message?: string; code?: string; details?: unknown };
  detail?: unknown;
};

export const LOGIN_ERROR_MESSAGES = {
  MISSING_CREDENTIALS: "Email or password is missing",
  INVALID_PASSWORD: "Your password is incorrect",
  INVALID_EMAIL: "Please enter a valid email address",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERROR_MESSAGES;

export function apiErrorMessage(data: ApiAuthErrorShape): string | null {
  const msg = data.error?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

export function apiErrorCode(data: ApiAuthErrorShape): string | null {
  const c = data.error?.code;
  return typeof c === "string" && c.length > 0 ? c : null;
}

function isLoginErrorCode(code: string): code is LoginErrorCode {
  return code in LOGIN_ERROR_MESSAGES;
}

function validationDetailsIndicateEmailIssue(details: unknown): boolean {
  if (!Array.isArray(details)) return false;
  return details.some((item) => {
    if (!item || typeof item !== "object") return false;
    const loc = (item as { loc?: unknown }).loc;
    return Array.isArray(loc) && loc.some((part) => part === "email");
  });
}

/** Map API / network failures to user-facing login messages. */
export function resolveLoginError(
  data: ApiAuthErrorShape,
  fallback = "Sign-in failed",
): { message: string; code: string | null } {
  const code = apiErrorCode(data);
  if (code && isLoginErrorCode(code)) {
    return { message: LOGIN_ERROR_MESSAGES[code], code };
  }
  if (code === "VALIDATION_ERROR" && validationDetailsIndicateEmailIssue(data.error?.details)) {
    return { message: LOGIN_ERROR_MESSAGES.INVALID_EMAIL, code: "INVALID_EMAIL" };
  }
  const apiMessage = apiErrorMessage(data);
  if (apiMessage) {
    return { message: apiMessage, code };
  }
  if (typeof data.detail === "string" && data.detail.length > 0) {
    return { message: data.detail, code };
  }
  return { message: fallback, code };
}

export function networkErrorMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.name === "AbortError") {
    return "Could not reach the API (timed out). Check that the backend is running and API_INTERNAL_URL is set correctly.";
  }
  if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
    return "Could not reach the API. Check that the backend is running and API_INTERNAL_URL is set correctly.";
  }
  return null;
}
