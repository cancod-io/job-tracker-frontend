import { XCircle } from "lucide-react";

type ErrorAlertProps = {
  message: string;
  /** If provided, renders a "Retry" button that calls this. */
  onRetry?: () => void;
};

/**
 * Inline error banner — rose-tinted, with an optional Retry action.
 * Use for non-fatal errors that the user can recover from on the same screen.
 */
export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
    >
      <XCircle className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto shrink-0 text-xs font-semibold underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
