import { CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type ApplyConfirmBannerProps = {
  jobTitle: string;
  company: string;
  stackIndex?: number;
  onConfirm: () => void;
  onDismiss: () => void;
  confirming: boolean;
};

/**
 * Fixed bottom banner that asks the user to confirm they have applied to a job.
 * Appears after opening an apply link and stays until confirmed or dismissed.
 */
const BANNER_STACK_OFFSET_REM = 5.75;

export function ApplyConfirmBanner({
  jobTitle,
  company,
  stackIndex = 0,
  onConfirm,
  onDismiss,
  confirming,
}: ApplyConfirmBannerProps) {
  return (
    <div
      className="fixed left-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 animate-[slide-up_0.25s_ease-out]"
      style={{ bottom: `calc(1.5rem + ${stackIndex * BANNER_STACK_OFFSET_REM}rem)` }}
      role="alertdialog"
      aria-live="assertive"
      aria-label="Confirm application"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-foreground px-4 py-3.5 shadow-2xl dark:bg-zinc-900">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-background dark:text-foreground">
              Mark as applied?
            </p>
            <p className="truncate text-xs text-background/70 dark:text-muted-foreground">
              {jobTitle} · {company}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {confirming ? (
              <>
                <Spinner className="size-3 border-primary-foreground/30 border-t-primary-foreground" />
                Saving…
              </>
            ) : (
              "Yes, applied"
            )}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-background/20 px-3 text-xs font-medium text-background/80 transition-colors hover:bg-background/10 dark:border-border dark:text-muted-foreground dark:hover:bg-muted/40"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
