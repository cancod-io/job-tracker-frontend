import type { ApiApplicationStatus } from "@/types/application";

// ─── View mode ─────────────────────────────────────────────────────────────

export type JobsViewMode = "list" | "card";

// ─── Sort mode ─────────────────────────────────────────────────────────────

export type JobsListSortMode = "relevance" | "newest";

// ─── Pagination ────────────────────────────────────────────────────────────

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

// ─── ATS status filter ─────────────────────────────────────────────────────

export type JobsListAtsFilter = "all";

// ─── Tracked application badge ─────────────────────────────────────────────

export type TrackedInfo = {
  id: number;
  status: ApiApplicationStatus;
};

export const TRACKED_STATUS_BADGE: Record<
  ApiApplicationStatus,
  { label: string; className: string }
> = {
  applied: {
    label: "Applied",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  interviewing: {
    label: "Interviewing",
    className: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  offer: {
    label: "Offer",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    label: "Not selected",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

// ─── URL param keys ────────────────────────────────────────────────────────

export const URL_PAGE_KEY = "page";
export const URL_SORT_KEY = "sort";
export const URL_PER_PAGE_KEY = "per_page";
export const URL_ATS_STATUS_KEY = "ats_status";

// ─── Detail panel ──────────────────────────────────────────────────────────

export type DetailPhase = "closed" | "entering" | "open" | "leaving";
export const DETAIL_TRANSITION_MS = 320;

// ─── Pagination helpers ────────────────────────────────────────────────────

export type PaginationItem = { type: "page"; value: number } | { type: "ellipsis" };

export function buildPaginationItems(current: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) return [{ type: "page", value: 1 }];

  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: PaginationItem[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) items.push({ type: "ellipsis" });
    items.push({ type: "page", value: p });
    prev = p;
  }
  return items;
}

// ─── URL helpers ───────────────────────────────────────────────────────────

import { API_JOB_ATS_STATUSES, type ApiJobAtsStatus } from "@/types/api-jobs";

export type JobsListAtsStatusFilter = "all" | ApiJobAtsStatus;

export function parsePageFromSearchParams(sp: URLSearchParams): number {
  const raw = sp.get(URL_PAGE_KEY);
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function parsePerPageFromSearchParams(sp: URLSearchParams): PageSizeOption {
  const raw = sp.get(URL_PER_PAGE_KEY);
  if (!raw) return DEFAULT_PAGE_SIZE;
  const n = parseInt(raw, 10);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
    ? (n as PageSizeOption)
    : DEFAULT_PAGE_SIZE;
}

export function parseSortFromSearchParams(sp: URLSearchParams): JobsListSortMode {
  return sp.get(URL_SORT_KEY) === "newest" ? "newest" : "relevance";
}

export function parseAtsStatusFromSearchParams(sp: URLSearchParams): JobsListAtsStatusFilter {
  const raw = sp.get(URL_ATS_STATUS_KEY);
  if (!raw) return "all";
  return (API_JOB_ATS_STATUSES as readonly string[]).includes(raw)
    ? (raw as ApiJobAtsStatus)
    : "all";
}

export function buildJobsListHref(
  pathname: string,
  base: URLSearchParams,
  patch: {
    page?: number;
    sort?: JobsListSortMode;
    perPage?: PageSizeOption;
    atsStatus?: JobsListAtsStatusFilter;
  },
): string {
  const params = new URLSearchParams(base.toString());
  const page = patch.page ?? parsePageFromSearchParams(params);
  const sort = patch.sort ?? parseSortFromSearchParams(params);
  const perPage = patch.perPage ?? parsePerPageFromSearchParams(params);
  const atsStatus = patch.atsStatus ?? parseAtsStatusFromSearchParams(params);

  if (page <= 1) params.delete(URL_PAGE_KEY);
  else params.set(URL_PAGE_KEY, String(page));

  if (sort === "relevance") params.delete(URL_SORT_KEY);
  else params.set(URL_SORT_KEY, sort);

  if (perPage === DEFAULT_PAGE_SIZE) params.delete(URL_PER_PAGE_KEY);
  else params.set(URL_PER_PAGE_KEY, String(perPage));

  if (atsStatus === "all") params.delete(URL_ATS_STATUS_KEY);
  else params.set(URL_ATS_STATUS_KEY, atsStatus);

  const qs = params.toString();
  const hash = pathname === "/" ? "#jobs" : "";
  return qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`;
}
