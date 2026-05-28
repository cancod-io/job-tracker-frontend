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
