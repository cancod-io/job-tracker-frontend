/** Session storage keys for auth tokens (must match auth-provider). */
export const TOKEN_STORAGE_KEY = "sjt_user_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "sjt_user_refresh_token";
export const TOKEN_EXPIRES_AT_KEY = "sjt_user_access_token_expires_at";
export const REFRESH_EXPIRES_AT_KEY = "sjt_user_refresh_token_expires_at";

/** Dispatched when an API returns 401 and refresh failed — AuthProvider logs out. */
export const SESSION_EXPIRED_EVENT = "sjt:session-expired";

/** Dispatched after login or a successful token refresh so AuthProvider can sync state. */
export const TOKEN_REFRESHED_EVENT = "sjt:token-refreshed";

/** Refresh the access token this many ms before `expires_in` elapses. */
export const REFRESH_BEFORE_EXPIRY_MS = 60_000;

export function signalSessionExpired(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function signalTokenRefreshed(accessToken: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { accessToken } }));
}

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

export function getAccessTokenExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function getRefreshTokenExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REFRESH_EXPIRES_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function isAccessTokenExpired(skewMs = REFRESH_BEFORE_EXPIRY_MS): boolean {
  const exp = getAccessTokenExpiresAt();
  if (exp == null) return false;
  return Date.now() >= exp - skewMs;
}

export function isRefreshTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.sessionStorage.getItem(REFRESH_EXPIRES_AT_KEY);
  if (!raw) return false;
  const exp = Number(raw);
  if (!Number.isFinite(exp)) return false;
  return Date.now() >= exp;
}

export function setStoredTokens(
  accessToken: string,
  refreshToken?: string | null,
  expiresInSeconds?: number,
  refreshExpiresInSeconds?: number,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken?.trim()) {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken.trim());
  } else {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
  if (expiresInSeconds != null && expiresInSeconds > 0) {
    window.sessionStorage.setItem(
      TOKEN_EXPIRES_AT_KEY,
      String(Date.now() + expiresInSeconds * 1000),
    );
  } else {
    window.sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  }
  if (refreshExpiresInSeconds != null && refreshExpiresInSeconds > 0) {
    window.sessionStorage.setItem(
      REFRESH_EXPIRES_AT_KEY,
      String(Date.now() + refreshExpiresInSeconds * 1000),
    );
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  window.sessionStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
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
