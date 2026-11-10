import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

/**
 * Loading placeholder with a left-to-right shimmer sweep.
 *
 * The animation is driven by the `.skeleton-shimmer` utility in `globals.css`
 * (uses `--skeleton-base` / `--skeleton-shine` design tokens, so contrast
 * stays correct against `bg-card` in both light and dark mode). Respects
 * `prefers-reduced-motion` automatically.
 */
export function Skeleton({ className, "aria-hidden": ariaHidden = true }: SkeletonProps) {
  return <div aria-hidden={ariaHidden} className={cn("skeleton-shimmer rounded-md", className)} />;
}
