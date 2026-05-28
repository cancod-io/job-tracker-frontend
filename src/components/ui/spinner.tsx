import { cn } from "@/lib/utils";

type SpinnerProps = {
  /** Additional Tailwind classes. Control size with `size-*` utilities. */
  className?: string;
  /** Screen-reader label — defaults to "Loading". */
  label?: string;
};

/**
 * Inline spinner that inherits the parent's text colour.
 *
 * @example
 * <Spinner className="size-4" />                 // small
 * <Spinner className="size-5 text-primary" />   // coloured
 */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current/25 border-t-current",
        className ?? "size-4",
      )}
    />
  );
}
