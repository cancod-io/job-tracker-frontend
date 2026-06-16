/** Obfuscated auth entry points — not linked from the public 404 landing page. */
export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const VERIFY_EMAIL_PATH = "/verify-email";

/** Authenticated job board (protected). */
export const JOBS_PATH = "/jobs";

export function verifyEmailHref(email: string): string {
  return `${VERIFY_EMAIL_PATH}?email=${encodeURIComponent(email.trim())}`;
}
