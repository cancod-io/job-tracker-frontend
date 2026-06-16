import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { Job } from "@/types/job";

export function isValidApplyUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  return Boolean(trimmed && trimmed !== "#");
}

type JobApplyButtonProps = {
  job: Job;
  onApplyClick: (job: Job) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  children?: ReactNode;
};

/**
 * Apply control for job cards and the detail panel.
 * Uses a real link with `target="_blank"` so the posting opens in a new tab on a normal click
 * (no Ctrl/Cmd). `onApplyClick` only queues the confirm banner — it does not mark as applied.
 */
export function JobApplyButton({
  job,
  onApplyClick,
  className,
  disabled = false,
  label,
  children,
}: JobApplyButtonProps) {
  const applyUrl = job.applyUrl?.trim() ?? "";
  const hasUrl = isValidApplyUrl(applyUrl);
  const ariaLabel =
    label ?? `Apply to ${job.title} at ${job.company}`;

  const content = children ?? (
    <>
      Apply <ExternalLink className="size-3.5 shrink-0" aria-hidden />
    </>
  );

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    onApplyClick(job);
  }

  if (disabled) {
    return (
      <button type="button" disabled className={className} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  if (hasUrl) {
    return (
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={className} aria-label={ariaLabel}>
      {content}
    </button>
  );
}
