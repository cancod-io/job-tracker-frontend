/**
 * Shared company display utilities used across job and application components.
 */

/**
 * Generates 1–2 uppercase initials from a company name.
 * @example companyInitials("Acme Corp") → "AC"
 * @example companyInitials("Google") → "GO"
 */
export function companyInitials(name: string): string {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}
