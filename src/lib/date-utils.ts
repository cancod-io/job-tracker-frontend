/**
 * Shared date formatting utilities.
 */

/**
 * Formats an ISO date string to a short human-readable date.
 * @example formatDate("2025-05-01T00:00:00Z") → "May 1, 2025"
 */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
