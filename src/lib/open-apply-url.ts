/**
 * Opens an apply URL in a new tab without leaving the current page focused.
 * Uses a blank tab first so the new tab shows loading while the dashboard stays active.
 */
export function openApplyUrlInBackground(url: string): boolean {
  if (typeof window === "undefined") return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return false;

  const tab = window.open("about:blank", "_blank");
  if (!tab) return false;

  try {
    tab.opener = null;
  } catch {
    // ignore — cross-origin restrictions
  }

  tab.location.replace(trimmed);
  window.focus();

  return true;
}
