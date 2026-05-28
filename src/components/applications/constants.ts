import type { ApiApplicationStatus } from "@/types/application";

// ─── Kanban column configuration ──────────────────────────────────────────

export type KanbanColumn = {
  id: ApiApplicationStatus;
  label: string;
  description: string;
  /** Border + background when the column is the active drag target. */
  colorClass: string;
  /** Header text colour. */
  headerClass: string;
  /** Status-dot fill colour. */
  dotClass: string;
  /** Placeholder text shown when the column is empty. */
  emptyMessage: string;
};

export const COLUMNS: KanbanColumn[] = [
  {
    id: "applied",
    label: "Applied",
    description: "Submitted applications",
    colorClass: "border-sky-400/40 bg-sky-400/5",
    headerClass: "text-sky-600 dark:text-sky-400",
    dotClass: "bg-sky-400",
    emptyMessage: "No applied jobs yet",
  },
  {
    id: "interviewing",
    label: "Interviewing",
    description: "Active interview processes",
    colorClass: "border-teal-400/40 bg-teal-400/5",
    headerClass: "text-teal-600 dark:text-teal-400",
    dotClass: "bg-teal-400",
    emptyMessage: "No interviews in progress",
  },
  {
    id: "offer",
    label: "Offer",
    description: "Received an offer",
    colorClass: "border-emerald-400/40 bg-emerald-400/5",
    headerClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-400",
    emptyMessage: "No offers yet — keep going!",
  },
  {
    id: "failed",
    label: "Failed",
    description: "Closed or rejected applications",
    colorClass: "border-rose-400/40 bg-rose-400/5",
    headerClass: "text-rose-600 dark:text-rose-400",
    dotClass: "bg-rose-400",
    emptyMessage: "No failed applications",
  },
];
