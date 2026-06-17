import { CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { Job } from "@/types/job";

type JobMarkAppliedButtonProps = {
  job: Job;
  onMarkApplied: (job: Job) => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
};

/** Marks a job as applied without opening the posting or showing the confirm banner. */
export function JobMarkAppliedButton({
  job,
  onMarkApplied,
  className,
  disabled = false,
  loading = false,
}: JobMarkAppliedButtonProps) {
  const ariaLabel = `Mark ${job.title} at ${job.company} as applied`;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled || loading) return;
    onMarkApplied(job);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      aria-label={ariaLabel}
    >
      {loading ? (
        <>
          <Spinner className="size-3.5 border-current/30 border-t-current" />
          Saving…
        </>
      ) : (
        <>
          <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          Mark applied
        </>
      )}
    </button>
  );
}
