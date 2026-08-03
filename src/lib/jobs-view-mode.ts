export const JOBS_VIEW_MODE_STORAGE_KEY = "sjt_jobs_view_mode" as const;

export type JobsViewMode = "list" | "card";

export function readJobsViewMode(): JobsViewMode {
  if (typeof window === "undefined") return "list";
  try {
    const stored = localStorage.getItem(JOBS_VIEW_MODE_STORAGE_KEY);
    if (stored === "list" || stored === "card") return stored;
  } catch {
    // storage disabled or unavailable
  }
  return "list";
}

export function writeJobsViewMode(mode: JobsViewMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(JOBS_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
