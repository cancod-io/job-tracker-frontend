import type { ApiApplicationStatus } from "@/types/application";
import { API_JOBS_SORT_BY, type ApiJobsSortBy } from "@/types/api-jobs";

// ─── View mode ─────────────────────────────────────────────────────────────

export type JobsViewMode = "list" | "card";

// ─── Sort (API query params) ───────────────────────────────────────────────

export const DEFAULT_JOBS_SORT_BY: ApiJobsSortBy = "new";

// ─── Pagination ────────────────────────────────────────────────────────────

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

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
    className: "border-teal-400/40 bg-teal-400/10 text-teal-700 dark:text-teal-300",
  },
  offer: {
    label: "Offer",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

// ─── URL param keys ────────────────────────────────────────────────────────

export const URL_PAGE_KEY = "page";
export const URL_SORT_BY_KEY = "sort_by";
export const URL_PER_PAGE_KEY = "per_page";

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

function isApiJobsSortBy(value: string): value is ApiJobsSortBy {
  return (API_JOBS_SORT_BY as readonly string[]).includes(value);
}

function legacySortToSortBy(legacy: string | null): ApiJobsSortBy | null {
  if (!legacy) return null;
  if (legacy === "newest" || legacy === "posted_at") return "new";
  if (legacy === "application_status" || legacy === "relevance") return "applied";
  if (legacy === "failed") return "rejected";
  if (isApiJobsSortBy(legacy)) return legacy;
  return null;
}

export function parseSortByFromSearchParams(sp: URLSearchParams): ApiJobsSortBy {
  const raw = sp.get(URL_SORT_BY_KEY) ?? legacySortToSortBy(sp.get("sort"));
  if (raw && isApiJobsSortBy(raw)) return raw;
  return DEFAULT_JOBS_SORT_BY;
}

export function buildJobsListHref(
  pathname: string,
  base: URLSearchParams,
  patch: {
    page?: number;
    sortBy?: ApiJobsSortBy;
    perPage?: PageSizeOption;
  },
): string {
  const params = new URLSearchParams(base.toString());
  const page = patch.page ?? parsePageFromSearchParams(params);
  const sortBy = patch.sortBy ?? parseSortByFromSearchParams(params);
  const perPage = patch.perPage ?? parsePerPageFromSearchParams(params);

  params.delete("sort");
  params.delete("sort_order");
  params.delete("ats_status");

  if (page <= 1) params.delete(URL_PAGE_KEY);
  else params.set(URL_PAGE_KEY, String(page));

  if (sortBy === DEFAULT_JOBS_SORT_BY) params.delete(URL_SORT_BY_KEY);
  else params.set(URL_SORT_BY_KEY, sortBy);

  if (perPage === DEFAULT_PAGE_SIZE) params.delete(URL_PER_PAGE_KEY);
  else params.set(URL_PER_PAGE_KEY, String(perPage));

  const qs = params.toString();
  const hash = pathname === "/" ? "#jobs" : "";
  return qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`;
}
