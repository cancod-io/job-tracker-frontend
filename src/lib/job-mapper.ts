import { formatRelativeTime } from "@/lib/format-relative-time";
import { normalizeAtsStatusFromApi, type ApiJobListItem } from "@/types/api-jobs";
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

function parseTimestampMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || looksLikeRelativeHumanLabel(trimmed)) return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Canonical posted time from API fields (not stale scrape labels in raw_payload). */
function canonicalPostedTimestampMs(item: ApiJobListItem): number | null {
  for (const field of [item.posted_at, item.discovered_at, item.created_at]) {
    const t = field?.trim();
    if (!t) continue;
    const ms = parseTimestampMs(t);
    if (ms != null) return ms;
  }
  return null;
}

/** Posted time for sorting (newest first). */
function postedAtSortMilliseconds(item: ApiJobListItem): number {
  const canonical = canonicalPostedTimestampMs(item);
  if (canonical != null) return canonical;

  const fallback = item.raw_payload?.job_posted_at?.trim();
  if (fallback) {
    const ms = parseTimestampMs(fallback);
    if (ms != null) return ms;
  }
  return 0;
}

function buildPostedLabel(item: ApiJobListItem): string {
  const canonicalMs = canonicalPostedTimestampMs(item);
  if (canonicalMs != null) {
    return formatRelativeTime(new Date(canonicalMs).toISOString());
  }

  const fallback = item.raw_payload?.job_posted_at?.trim();
  if (fallback) {
    if (looksLikeRelativeHumanLabel(fallback)) return fallback;
    const ms = parseTimestampMs(fallback);
    if (ms != null) return formatRelativeTime(new Date(ms).toISOString());
    return fallback;
  }

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
    source: item.source?.trim() || null,
    sourceLabel: item.source_label?.trim() || null,
    logoUrl: item.company_logo_url?.trim() || null,
    datePosted: buildPostedLabel(item),
    sortPostedAtMs: postedAtSortMilliseconds(item),
    shopifyRelevanceScore:
      item.shopify_relevance_score == null ? null : Number(item.shopify_relevance_score),
    location,
    skills: (item.skills ?? []).map((s) => String(s).trim()).filter(Boolean),
    experienceLevel: item.experience_level?.trim() || "—",
    jobType: buildJobTypeLabel(item),
    employmentLabel: raw || "—",
    isRemote: Boolean(item.is_remote),
    applyUrl: item.apply_url?.trim() || "#",
    atsStatus: normalizeAtsStatusFromApi(item.ats_status),
    isNew: Boolean(item.is_new),
    saved: false,
    salary: item.salary?.trim() || null,
    description: (item.description ?? "").trim(),
    publisher: item.raw_payload?.job_publisher?.trim() || null,
    googleJobUrl: item.raw_payload?.job_google_link?.trim() || null,
    employerWebsite: item.raw_payload?.employer_website?.trim() || null,
  };
}
