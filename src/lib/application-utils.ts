/**
 * Application-domain helpers — title/company extraction, clipboard copy,
 * and sort logic for tracked job applications.
 */

import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/date-utils";
import type { ApiApplication } from "@/types/application";

// ─── Field extractors ──────────────────────────────────────────────────────

/** Returns the job title from an application, falling back to "Job #<id>". */
export function jobTitle(app: ApiApplication): string {
  return (
    app.job?.job_title?.trim() ??
    app.job?.title?.trim() ??
    `Job #${app.job_id}`
  );
}

/** Returns the company name from an application, falling back to "Unknown Company". */
export function companyName(app: ApiApplication): string {
  return app.job?.company?.trim() ?? "Unknown Company";
}

// ─── Clipboard ────────────────────────────────────────────────────────────

/**
 * Copies a formatted summary of an application to the system clipboard.
 * Toasts on success or failure.
 */
export function copyAppToClipboard(app: ApiApplication): void {
  const title = jobTitle(app);
  const company = companyName(app);
  const location = app.job?.location?.trim() ?? "";
  const isRemote = app.job?.is_remote ?? false;
  const salary = app.job?.salary?.trim() ?? "";
  const applyUrl = app.job?.apply_url?.trim() ?? "";
  const date = formatDate(app.applied_at ?? app.created_at);
  const notes = app.notes?.trim() ?? "";

  const lines = [
    `${title} at ${company}`,
    [isRemote ? "Remote" : location, salary].filter(Boolean).join("  ·  "),
    `Applied: ${date}  ·  Status: ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`,
    applyUrl ? `Apply: ${applyUrl}` : "",
    notes ? `Notes: ${notes}` : "",
  ].filter(Boolean);

  void navigator.clipboard.writeText(lines.join("\n")).then(
    () => notify.success("Copied to clipboard"),
    () => notify.error("Failed to copy"),
  );
}

// ─── Date filtering ─────────────────────────────────────────────────────────

/**
 * Filters applications to those whose applied/created date falls within the
 * inclusive `from`–`to` range (each "YYYY-MM-DD"). Empty bounds are open-ended;
 * empty `from` and `to` return the input unchanged.
 */
export function filterByDateRange(
  apps: ApiApplication[],
  from: string,
  to: string,
): ApiApplication[] {
  if (!from && !to) return apps;
  return apps.filter((a) => {
    const key = (a.applied_at ?? a.created_at ?? "").slice(0, 10);
    if (!key) return false;
    if (from && key < from) return false;
    if (to && key > to) return false;
    return true;
  });
}

// ─── Sort ──────────────────────────────────────────────────────────────────

export type ApplicationSortKey =
  | "date_applied_desc"
  | "date_applied_asc"
  | "company_asc"
  | "priority_desc";

export const APPLICATION_SORT_OPTIONS: { value: ApplicationSortKey; label: string }[] = [
  { value: "date_applied_desc", label: "Date Applied (Newest)" },
  { value: "date_applied_asc", label: "Date Applied (Oldest)" },
  { value: "company_asc", label: "Company (A → Z)" },
  { value: "priority_desc", label: "Priority (High → Low)" },
];

/** Returns a new sorted array — does not mutate the input. */
export function sortApplications(
  apps: ApiApplication[],
  sort: ApplicationSortKey,
): ApiApplication[] {
  return [...apps].sort((a, b) => {
    switch (sort) {
      case "date_applied_desc":
        return (
          new Date(b.applied_at ?? b.created_at).getTime() -
          new Date(a.applied_at ?? a.created_at).getTime()
        );
      case "date_applied_asc":
        return (
          new Date(a.applied_at ?? a.created_at).getTime() -
          new Date(b.applied_at ?? b.created_at).getTime()
        );
      case "company_asc":
        return companyName(a).localeCompare(companyName(b));
      case "priority_desc":
        return (b.priority ?? 0) - (a.priority ?? 0);
    }
  });
}
