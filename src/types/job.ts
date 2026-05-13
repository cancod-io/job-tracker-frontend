export type ExperienceLevel = "Junior" | "Mid-Level" | "Senior";
export type JobType = "Remote" | "Full-Time" | "Contract";
export type ApplicationStatus = "Not Applied" | "Applied" | "Pending" | "Interview Scheduled";

/** Pipeline status from the jobs API (`job_ats_status`). */
export type JobAtsStatus =
  | "new"
  | "shortlisted"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "archived";

export type Job = {
  id: string;
  title: string;
  company: string;
  /** Remote logo URL from the API, or null to show initials. */
  logoUrl: string | null;
  /** Short label for the card header (e.g. “5 days ago”, relative ISO). */
  datePosted: string;
  location: string;
  skills: string[];
  /** Raw label from the API; toolbar filters normalize against this text. */
  experienceLevel: string;
  /** Combined label used for filters (employment + remote hints). */
  jobType: string;
  /** Plain employment type line for badges (e.g. “Contractor”). */
  employmentLabel: string;
  isRemote: boolean;
  applyUrl: string;
  atsStatus: JobAtsStatus;
  saved: boolean;
  salary: string | null;
  /** Full description for detail panel; card uses clamped excerpt. */
  description: string;
  publisher: string | null;
  googleJobUrl: string | null;
  employerWebsite: string | null;
};
