/**
 * Browser-visible API base (no trailing slash).
 * Must be reachable from the user's browser (e.g. `http://localhost:8000`).
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/**
 * Backend base URL for **server-side** calls (Route Handlers, Server Actions).
 * Prefer `API_INTERNAL_URL` in Docker so the Next container reaches the API by service name.
 * Do not rely on this from client components — use the `/api/...` proxy instead when CORS matters.
 */
export function getInternalApiBase(): string {
  const raw =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getPublicApiUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
