import type { JobsIngestedPayload } from "@/types/realtime";

/** Normalize new job ids from a `jobs.ingested` payload. */
export function normalizeAddedJobIds(payload: JobsIngestedPayload): string[] {
  const raw = payload.added_job_ids;
  if (!Array.isArray(raw)) return [];

  const ids = new Set<string>();
  for (const item of raw) {
    const id = String(item).trim();
    if (id) ids.add(id);
  }
  return [...ids];
}

export function hasFreshIngestedJobs(payload: JobsIngestedPayload): boolean {
  return normalizeAddedJobIds(payload).length > 0 || payload.added > 0;
}

export function formatJobsIngestMessage(payload: JobsIngestedPayload): string {
  const newCount = normalizeAddedJobIds(payload).length || Math.max(0, payload.added);
  const parts: string[] = [];
  if (newCount > 0) {
    parts.push(`${newCount} new job${newCount === 1 ? "" : "s"}`);
  }
  if (payload.updated > 0) {
    parts.push(`${payload.updated} updated`);
  }
  return parts.length > 0 ? parts.join(", ") : "Job listings updated";
}

export function jobsIngestNotificationTitle(payload: JobsIngestedPayload): string {
  const newCount = normalizeAddedJobIds(payload).length || Math.max(0, payload.added);
  if (newCount === 1) return "New job available";
  if (newCount > 1) return `${newCount} new jobs available`;
  return "Job listings updated";
}
