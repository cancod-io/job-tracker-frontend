/** Session storage key for the user JWT (must match auth-provider). */
export const TOKEN_STORAGE_KEY = "sjt_user_access_token";

/** Read the stored access token in the browser; null on the server or when signed out. */
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY)?.trim();
  return token || null;
}

/** Headers for authenticated API calls from the client. */
export function authRequestHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getStoredAccessToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
