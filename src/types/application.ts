export type ApiApplicationStatus = "new" | "applied" | "interviewing" | "rejected";

export const API_APPLICATION_STATUSES = [
  "new",
  "applied",
  "interviewing",
  "rejected",
] as const satisfies readonly ApiApplicationStatus[];

export type ApiApplicationJob = {
  id: number;
  source?: string;
  job_title?: string;
  title?: string;
  company?: string;
  location?: string | null;
  salary?: string | null;
  is_remote?: boolean;
  company_logo_url?: string | null;
  apply_url?: string;
  description?: string | null;
  experience_level?: string | null;
  job_type?: string | null;
};

export type ApiApplication = {
  id: number;
  user_id: number;
  job_id: number;
  status: ApiApplicationStatus;
  applied_at: string;
  follow_up_at?: string | null;
  notes?: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  job?: ApiApplicationJob;
};

export type ApiApplicationsListResponse = {
  items: ApiApplication[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateApplicationPayload = {
  job_id: number;
  notes?: string;
  status?: ApiApplicationStatus;
};

export type UpdateApplicationPayload = {
  status?: ApiApplicationStatus;
  notes?: string;
  priority?: number;
  follow_up_at?: string | null;
};
