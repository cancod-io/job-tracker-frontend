export const APPLICATIONS_VIEW_MODE_STORAGE_KEY = "sjt_applications_view_mode" as const;

export type ApplicationsViewMode = "kanban" | "list";

export function readApplicationsViewMode(): ApplicationsViewMode {
  if (typeof window === "undefined") return "kanban";
  try {
    const stored = localStorage.getItem(APPLICATIONS_VIEW_MODE_STORAGE_KEY);
    if (stored === "kanban" || stored === "list") return stored;
  } catch {
    // storage disabled or unavailable
  }
  return "kanban";
}

export function writeApplicationsViewMode(mode: ApplicationsViewMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPLICATIONS_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
