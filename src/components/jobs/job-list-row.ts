/** Shared CSS grid for job list rows + skeletons so columns stay aligned.
 *  All tracks are definite (no `auto`) so the header row and body rows —
 *  which are separate grid containers — resolve to the same column widths.
 */
export const JOB_LIST_ROW_GRID =
  "grid w-full min-w-[58rem] items-center gap-x-3 px-3 py-2 [grid-template-columns:2rem_minmax(0,1.6fr)_minmax(6.5rem,9rem)_5.75rem_minmax(5.5rem,8rem)_9rem_4.75rem_13.5rem]";

export type JobListHeaderCell = {
  key: string;
  /** Empty string = spacer for the logo column (no visible label). */
  label: string;
  className?: string;
};

export const JOB_LIST_HEADER_CELLS: readonly JobListHeaderCell[] = [
  { key: "logo", label: "" },
  { key: "job", label: "Job" },
  { key: "location", label: "Location" },
  { key: "type", label: "Type" },
  { key: "salary", label: "Salary" },
  { key: "source", label: "Source" },
  { key: "posted", label: "Posted", className: "text-right" },
  { key: "actions", label: "Actions", className: "text-right" },
];
