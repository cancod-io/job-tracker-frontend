/** Session storage keys for auth tokens (must match auth-provider). */
export const TOKEN_STORAGE_KEY = "sjt_user_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "sjt_user_refresh_token";

/** Read the stored access token in the browser; null on the server or when signed out. */
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY)?.trim();
  return token || null;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)?.trim();
  return token || null;
}

export function setStoredTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken?.trim()) {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken.trim());
  } else {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
