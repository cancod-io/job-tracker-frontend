import { CheckCircle2, Clock, TrendingUp, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACKED_STATUS_BADGE } from "@/components/jobs/types";
import type { ApiApplicationStatus } from "@/types/application";

const STATUS_ICON: Record<ApiApplicationStatus, LucideIcon> = {
  applied: CheckCircle2,
  interviewing: TrendingUp,
  offer: Clock,
  failed: XCircle,
};

/** Icon accent colors aligned with the Applications stats bar. */
const STATUS_ICON_COLOR: Record<ApiApplicationStatus, string> = {
  applied: "text-sky-500",
  interviewing: "text-teal-500",
  offer: "text-emerald-500",
  failed: "text-rose-500",
};

type TrackedStatusBadgeProps = {
  status: ApiApplicationStatus;
  /** `pill` — compact uppercase tag in the card badge row; `button` — footer / list action size. */
  variant?: "pill" | "button";
  className?: string;
};

/**
 * Application status badge for job cards and the detail panel.
 */
export function TrackedStatusBadge({
  status,
  variant = "button",
  className,
}: TrackedStatusBadgeProps) {
  const { label, className: statusClass } = TRACKED_STATUS_BADGE[status];
  const Icon = STATUS_ICON[status];
  const iconColor = STATUS_ICON_COLOR[status];
  const iconSize = variant === "pill" ? "size-3" : "size-4";

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          statusClass,
          className,
        )}
      >
        <Icon className={cn("shrink-0", iconSize, iconColor)} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold shadow-sm",
        statusClass,
        className,
      )}
    >
      <Icon className={cn("shrink-0", iconSize, iconColor)} aria-hidden />
      {label}
    </span>
  );
}
