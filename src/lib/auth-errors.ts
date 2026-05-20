/** Stable API error codes from backend `AppError`. */

export type LoginField = "email" | "password";

export type ApiAuthErrorShape = {
  error?: {
    message?: string;
    code?: string;
    details?: LoginErrorDetails | unknown;
  };
  detail?: unknown;
};

export type LoginErrorDetails = {
  field?: LoginField;
  fields?: LoginField[];
};

/** Known login error codes from `POST /api/v1/auth/login`. */
export const LOGIN_ERROR_CODES = {
  LOGIN_FIELDS_MISSING: "LOGIN_FIELDS_MISSING",
  INVALID_EMAIL: "INVALID_EMAIL",
  INCORRECT_PASSWORD: "INCORRECT_PASSWORD",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
} as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[keyof typeof LOGIN_ERROR_CODES];

export type ResolvedLoginError = {
  message: string;
  code: string | null;
  /** Inputs that should be marked invalid (message is shown via toast). */
  fields: LoginField[];
};

export type LoginAuthError = Error & {
  code?: string | null;
  fields?: LoginField[];
};

export function apiErrorMessage(data: ApiAuthErrorShape): string | null {
  const msg = data.error?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

export function apiErrorCode(data: ApiAuthErrorShape): string | null {
  const c = data.error?.code;
  return typeof c === "string" && c.length > 0 ? c : null;
}

function parseLoginErrorDetails(details: unknown): LoginErrorDetails {
  if (!details || typeof details !== "object") return {};
  const d = details as Record<string, unknown>;
  const field =
    d.field === "email" || d.field === "password" ? (d.field as LoginField) : undefined;
  const fields = Array.isArray(d.fields)
    ? d.fields.filter((f): f is LoginField => f === "email" || f === "password")
    : undefined;
  return { field, fields };
}

function fieldsFromCodeAndDetails(
  code: string | null,
  details: LoginErrorDetails,
): LoginField[] {
  const out: LoginField[] = [];
  if (details.field) out.push(details.field);
  if (details.fields?.length) out.push(...details.fields);
  const unique = [...new Set(out)];
  if (unique.length > 0) return unique;

  switch (code) {
    case LOGIN_ERROR_CODES.INVALID_EMAIL:
      return ["email"];
    case LOGIN_ERROR_CODES.INCORRECT_PASSWORD:
      return ["password"];
    case LOGIN_ERROR_CODES.LOGIN_FIELDS_MISSING:
      return ["email", "password"];
    default:
      return [];
  }
}

export function isFormLevelLoginCode(code: string | null): boolean {
  return (
    code === LOGIN_ERROR_CODES.PENDING_APPROVAL || code === LOGIN_ERROR_CODES.ACCOUNT_REJECTED
  );
}

/** Map login API JSON to message + code + target field(s). Prefer API `message`; branch on `code`. */
export function resolveLoginError(
  data: ApiAuthErrorShape,
  fallback = "Sign-in failed",
): ResolvedLoginError {
  const code = apiErrorCode(data);
  const details = parseLoginErrorDetails(data.error?.details);
  const message = apiErrorMessage(data) ?? (typeof data.detail === "string" ? data.detail : fallback);
  const fields = isFormLevelLoginCode(code) ? [] : fieldsFromCodeAndDetails(code, details);

  return { message, code, fields };
}

export function createLoginAuthError(resolved: ResolvedLoginError): LoginAuthError {
  const err = new Error(resolved.message) as LoginAuthError;
  err.code = resolved.code;
  err.fields = resolved.fields;
  return err;
}

export function isLoginAuthError(err: unknown): err is LoginAuthError {
  return err instanceof Error && ("code" in err || "fields" in err);
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
