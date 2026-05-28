"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  /** Accessible name for the dialog element. */
  "aria-label": string;
  /** Bold heading shown in the modal header. */
  title: string;
  /** Smaller sub-heading shown below the title. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Additional classes applied to the card container. */
  className?: string;
  /** Tailwind max-width class — defaults to `"max-w-md"`. */
  maxWidth?: string;
};

/**
 * Base modal: blurred backdrop + centred card with a standard header + close button.
 *
 * - Locks body scroll while open.
 * - Closes on `Escape` key or backdrop click.
 * - Focus-trapping is delegated to the consumer (autofocus first input, etc.).
 */
export function Modal({
  "aria-label": ariaLabel,
  title,
  description,
  onClose,
  children,
  className,
  maxWidth = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />

      {/* Card */}
      <div
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border bg-card p-6 shadow-2xl",
          maxWidth,
          className,
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
