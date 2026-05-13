import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ApiJobListItem } from "@/types/api-jobs";
import type { Job } from "@/types/job";

function buildJobTypeLabel(item: ApiJobListItem): string {
  const raw = item.job_type?.trim();
  if (item.is_remote && raw) return `${raw} · Remote`;
  if (item.is_remote) return "Remote";
  if (raw) return raw;
  return "—";
}

function looksLikeRelativeHumanLabel(s: string): boolean {
  if (/\bago\b/i.test(s)) return true;
  if (/^\d+[dh]\b/i.test(s)) return true;
  return false;
}

function buildPostedLabel(item: ApiJobListItem): string {
  const human = item.raw_payload?.job_posted_at?.trim();
  if (human) {
    if (looksLikeRelativeHumanLabel(human)) return human;
    const parsed = Date.parse(human);
    if (!Number.isNaN(parsed)) return formatRelativeTime(new Date(parsed).toISOString());
    return human;
  }
  const iso = item.posted_at?.trim() || item.discovered_at?.trim() || item.created_at?.trim();
  if (iso) return formatRelativeTime(iso);
  return "—";
}

function apiTitle(item: ApiJobListItem): string {
  return (item.job_title ?? item.title ?? "").trim() || "Untitled role";
}

export function mapApiJobListItemToJob(item: ApiJobListItem): Job {
  const location =
    item.location?.trim() ||
    (item.is_remote ? "Remote" : "Location not listed");

  const raw = item.job_type?.trim();

  return {
    id: String(item.id),
    title: apiTitle(item),
    company: item.company?.trim() || "—",
    logoUrl: item.company_logo_url?.trim() || null,
    datePosted: buildPostedLabel(item),
    location,
    skills: (item.skills ?? []).map((s) => String(s).trim()).filter(Boolean),
    experienceLevel: item.experience_level?.trim() || "—",
    jobType: buildJobTypeLabel(item),
    employmentLabel: raw || "—",
    isRemote: Boolean(item.is_remote),
    applyUrl: item.apply_url?.trim() || "#",
    atsStatus: item.ats_status,
    saved: false,
    salary: item.salary?.trim() || null,
    description: (item.description ?? "").trim(),
    publisher: item.raw_payload?.job_publisher?.trim() || null,
    googleJobUrl: item.raw_payload?.job_google_link?.trim() || null,
    employerWebsite: item.raw_payload?.employer_website?.trim() || null,
  };
}
