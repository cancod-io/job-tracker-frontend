"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Additional classes applied to the wrapper `<div>`. */
  className?: string;
  "aria-label"?: string;
  id?: string;
};

/**
 * Search input with a leading magnifier icon and an animated clear (×) button.
 * The clear button only appears when `value` is non-empty.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
  id,
}: SearchInputProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "form-control h-10 w-full pl-9 text-sm",
          value && "pr-9",
          /* Hide native clear control — we render a custom clear button */
          "[&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
        )}
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground transition-colors hover:bg-muted-foreground/30 hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
