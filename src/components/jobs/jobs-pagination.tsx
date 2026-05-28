import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PAGE_SIZE_OPTIONS,
  type PaginationItem,
  type PageSizeOption,
} from "@/components/jobs/types";

type NavigateListPatch = {
  page?: number;
  perPage?: PageSizeOption;
};

type JobsPaginationProps = {
  placement: "top" | "bottom";
  loading: boolean;
  total: number;
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  perPage: PageSizeOption;
  paginationItems: PaginationItem[];
  onNavigate: (patch: NavigateListPatch) => void;
};

/**
 * Pagination controls for the jobs list.
 * Renders nothing when loading or total === 0.
 * Use `placement` to style top vs bottom variants.
 */
export function JobsPagination({
  placement,
  loading,
  total,
  currentPage,
  totalPages,
  rangeStart,
  rangeEnd,
  perPage,
  paginationItems,
  onNavigate,
}: JobsPaginationProps) {
  if (loading || total <= 0) return null;

  return (
    <nav
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        placement === "top"
          ? "mb-4 border-b border-border/60 pb-4"
          : "mt-6 border-t border-border/60 pt-5",
      )}
      aria-label={
        placement === "top"
          ? "Job results — top pagination"
          : "Job results — bottom pagination"
      }
    >
      {/* Summary */}
      <p className="text-xs tabular-nums text-muted-foreground">
        Page{" "}
        <span className="font-medium text-foreground">{currentPage}</span>
        {" "}of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
        <span className="mx-1.5 text-muted-foreground/50" aria-hidden>·</span>
        Showing{" "}
        <span className="font-medium text-foreground">{rangeStart}</span>–
        <span className="font-medium text-foreground">{rangeEnd}</span>
        {" "}of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Per-page selector */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Per page
          <select
            value={perPage}
            onChange={(e) => onNavigate({ perPage: Number(e.target.value) as PageSizeOption, page: 1 })}
            disabled={loading}
            className="form-control h-9 min-w-[4.5rem] cursor-pointer rounded-lg px-2 text-sm shadow-sm"
            aria-label="Results per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        {/* Page buttons */}
        <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
          <button
            type="button"
            onClick={() => onNavigate({ page: currentPage - 1 })}
            disabled={currentPage <= 1 || loading}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-input bg-background text-secondary-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
          </button>

          {paginationItems.map((item, i) =>
            item.type === "ellipsis" ? (
              <span
                key={`ellipsis-${placement}-${i}`}
                className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={`${placement}-p${item.value}`}
                type="button"
                onClick={() => onNavigate({ page: item.value })}
                disabled={loading}
                aria-current={item.value === currentPage ? "page" : undefined}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg border text-sm font-medium tabular-nums shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
                  item.value === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-secondary-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.value}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onNavigate({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages || loading}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-input bg-background text-secondary-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}
