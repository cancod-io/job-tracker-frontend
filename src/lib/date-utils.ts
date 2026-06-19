/**
 * Shared date formatting utilities used across the application.
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

/**
 * Returns a relative date string — "Today", "Yesterday", "3d ago", "2w ago",
 * or falls back to `formatDate` for older dates.
 */
export function relativeDate(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
}

/** Formats a local `Date` to a "YYYY-MM-DD" key (no timezone shift). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses a "YYYY-MM-DD" key into a local `Date` at midnight. Returns null if invalid. */
export function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parts = key.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/** True when `key` is a `YYYY-MM-DD` calendar date. */
export function isDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/**
 * `2026-06-01` → `2026-06-01T00:00:00Z` for the jobs API `posted_from` param.
 * Calendar dates are interpreted as UTC days.
 */
export function dateKeyToPostedFromUtc(key: string): string {
  return `${key}T00:00:00Z`;
}

/**
 * `2026-06-17` → `2026-06-17T23:59:59Z` for an inclusive jobs API `posted_to` param.
 */
export function dateKeyToPostedToUtc(key: string): string {
  return `${key}T23:59:59Z`;
}

/** Formats a "YYYY-MM-DD" key for display, e.g. "May 1, 2026". */
export function formatDateKey(key: string): string {
  const d = parseDateKey(key);
  return d ? formatDate(d.toISOString()) : key;
}

/**
 * Builds a human-readable label for a from/to range.
 * @example "May 1 – May 31, 2026" · "May 1, 2026" (single day) · "Any date"
 */
export function formatDateRange(from: string, to: string): string {
  if (!from && !to) return "Any date";
  if (from && !to) return `From ${formatDateKey(from)}`;
  if (!from && to) return `Until ${formatDateKey(to)}`;
  if (from === to) return formatDateKey(from);
  return `${formatDateKey(from)} – ${formatDateKey(to)}`;
}

/** Jobs board toolbar label — shows "Posted date" when no range is selected. */
export function formatPostedDateRange(from: string, to: string): string {
  if (!from && !to) return "Posted date";
  return formatDateRange(from, to);
}

/**
 * Ensures a single-day or open-ended picker selection becomes a closed range
 * before sending `posted_from` / `posted_to` to the API.
 */
export function normalizePostedDateRange(from: string, to: string): { from: string; to: string } {
  const start = from.trim();
  const end = to.trim();
  if (!start && !end) return { from: "", to: "" };
  if (start && !end) return { from: start, to: start };
  if (!start && end) return { from: end, to: end };
  if (start > end) return { from: end, to: start };
  return { from: start, to: end };
}

/**
 * Returns a Tailwind text-colour class that reflects how fresh a date is:
 * ≤3 days → green, ≤7 → blue, ≤14 → amber, older → rose.
 */
export function freshnessColor(iso: string): string {
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 3) return "text-emerald-500";
    if (days <= 7) return "text-sky-500";
    if (days <= 14) return "text-amber-500";
    return "text-rose-400";
  } catch {
    return "text-muted-foreground";
  }
}
