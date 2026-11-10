/** Obfuscated auth entry points — not linked from the public 404 landing page. */
export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const VERIFY_EMAIL_PATH = "/verify-email";

/** Default signed-in destination. */
export const HOME_PATH = "/profile";

/**
 * Normalize post-login redirect targets to same-origin paths only.
 * Blocks absolute URLs and host:port prefixes that break routing behind IPs/proxies.
 */
export function resolveSafeNextPath(
  raw: string | null | undefined,
  fallback: string = HOME_PATH,
): string {
  let trimmed = raw?.trim() ?? "";
  if (!trimmed) return fallback;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("://")) {
    return fallback;
  }

  if (!trimmed.startsWith("/")) {
    trimmed = `/${trimmed}`;
  }

  if (trimmed.startsWith("//")) {
    return fallback;
  }

  // Recover from polluted paths like /147.93.180.179:3000/applications
  const mistakenPrefix = /^\/[^/]+:\d+(?=\/|$)/;
  while (mistakenPrefix.test(trimmed)) {
    trimmed = trimmed.replace(mistakenPrefix, "") || "/";
  }

  return trimmed === "/" ? fallback : trimmed;
}

export function verifyEmailHref(email: string): string {
  return `${VERIFY_EMAIL_PATH}?email=${encodeURIComponent(email.trim())}`;
}
