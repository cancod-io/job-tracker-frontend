"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "@/components/ui/popover";
import { APPLICATION_SORT_OPTIONS } from "@/lib/application-utils";
import type { ApplicationSortKey } from "@/lib/application-utils";

type SortMenuProps = {
  value: ApplicationSortKey;
  onChange: (key: ApplicationSortKey) => void;
  /** "button" = labelled toolbar control · "icon" = compact column control. */
  variant?: "button" | "icon";
};

export function SortMenu({ value, onChange, variant = "button" }: SortMenuProps) {
  const currentLabel = APPLICATION_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Sort";

  return (
    <Popover
      align="end"
      panelClassName="min-w-[13rem] rounded-xl border border-border bg-card py-1 shadow-xl"
      button={({ open, toggle }) =>
        variant === "icon" ? (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground",
              open ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
            aria-label="Sort column"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <ArrowUpDown className="size-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <ArrowUpDown className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{currentLabel}</span>
            <span className="sm:hidden">Sort all</span>
            <ChevronDown
              className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        )
      }
    >
      {({ close }) => (
        <div role="listbox" aria-label="Sort options">
          {APPLICATION_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); close(); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted",
                value === opt.value ? "text-primary" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  value === opt.value ? "bg-primary" : "bg-transparent",
                )}
                aria-hidden
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
