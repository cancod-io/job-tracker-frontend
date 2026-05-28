/**
 * User-facing messages for backend connectivity failures.
 * Surfaced when the API server is down, restarting, or unreachable from the Next.js server.
 *
 * Lead with a short headline so the cause is recognizable at a glance,
 * then a sentence of context and a hint on what to do next.
 */

export const BACKEND_OFFLINE_MESSAGE =
  "Backend server is offline. We couldn't reach the API — please make sure the backend service is running, then try again.";

export const BACKEND_TIMEOUT_MESSAGE =
  "Backend server isn't responding. The API request timed out — it may be down, restarting, or overloaded. Please try again in a moment.";
