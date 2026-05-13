import type { ApplicationStatus, JobAtsStatus } from "@/types/job";

export function jobAtsStatusLabel(status: JobAtsStatus): string {
  switch (status) {
    case "new":
      return "New";
    case "shortlisted":
      return "Shortlisted";
    case "applied":
      return "Applied";
    case "interviewing":
      return "Interviewing";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
  }
}

/** Pill styles for ATS pipeline status from `GET /api/v1/jobs`. */
export function jobAtsStatusBadgeClass(status: JobAtsStatus): string {
  switch (status) {
    case "applied":
      return [
        "bg-sky-100 text-sky-950 ring-1 ring-sky-400/50",
        "dark:bg-background dark:text-sky-50 dark:ring-sky-400/45",
      ].join(" ");
    case "shortlisted":
      return [
        "bg-violet-100 text-violet-950 ring-1 ring-violet-400/50",
        "dark:bg-background dark:text-violet-50 dark:ring-violet-400/45",
      ].join(" ");
    case "interviewing":
      return [
        "bg-teal-100 text-teal-950 ring-1 ring-teal-400/50",
        "dark:bg-background dark:text-teal-50 dark:ring-teal-400/45",
      ].join(" ");
    case "offer":
      return [
        "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/50",
        "dark:bg-background dark:text-emerald-50 dark:ring-emerald-400/45",
      ].join(" ");
    case "rejected":
      return [
        "bg-rose-100 text-rose-950 ring-1 ring-rose-400/50",
        "dark:bg-background dark:text-rose-50 dark:ring-rose-400/45",
      ].join(" ");
    case "archived":
      return [
        "bg-zinc-200 text-zinc-900 ring-1 ring-zinc-400/45",
        "dark:bg-background dark:text-zinc-100 dark:ring-zinc-500/40",
      ].join(" ");
    case "new":
      return [
        "bg-slate-100 text-slate-800 ring-1 ring-slate-300/90",
        "dark:bg-background dark:text-slate-50 dark:ring-slate-500/45",
      ].join(" ");
  }
}

/**
 * Pill styles for mock application summaries — tuned for WCAG-friendly contrast in light & dark mode.
 */
export function applicationStatusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "Applied":
      return [
        "bg-sky-100 text-sky-950 ring-1 ring-sky-400/50",
        "dark:bg-background dark:text-sky-50 dark:ring-sky-400/45",
      ].join(" ");
    case "Pending":
      return [
        "bg-amber-100 text-amber-950 ring-1 ring-amber-400/55",
        "dark:bg-background dark:text-amber-50 dark:ring-amber-500/40",
      ].join(" ");
    case "Interview Scheduled":
      return [
        "bg-teal-100 text-teal-950 ring-1 ring-teal-400/50",
        "dark:bg-background dark:text-teal-50 dark:ring-teal-400/45",
      ].join(" ");
    case "Not Applied":
      return [
        "bg-slate-100 text-slate-800 ring-1 ring-slate-300/90",
        "dark:bg-background dark:text-slate-50 dark:ring-slate-500/45",
      ].join(" ");
  }
}
