"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applicationFilePreviewKind,
  formatFileSize,
} from "@/lib/application-file-utils";
import {
  downloadApplicationFile,
  fetchApplicationFileBlob,
} from "@/lib/application-files-api";
import { Spinner } from "@/components/ui/spinner";
import type { ApiApplicationFile } from "@/types/application-file";

type ApplicationFilePreviewModalProps = {
  applicationId: number;
  file: ApiApplicationFile | null;
  onClose: () => void;
};

export function ApplicationFilePreviewModal({
  applicationId,
  file,
  onClose,
}: ApplicationFilePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "pdf" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!file) {
      setFullscreen(false);
      setLoading(false);
      setError(null);
      setPreviewKind(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const kind = applicationFilePreviewKind(file);
    if (kind === "none") {
      setLoading(false);
      setError(null);
      setPreviewKind(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreviewKind(kind);

    void (async () => {
      try {
        const { blob } = await fetchApplicationFileBlob(applicationId, file);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview file.");
        setPreviewKind(null);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applicationId, file]);

  useEffect(() => {
    if (!file) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, onClose]);

  useEffect(() => {
    if (!file) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!mounted || !file) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[250] flex items-center justify-center",
        fullscreen ? "p-0" : "p-2 sm:p-3 md:p-4",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${file.filename}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        className={cn(
          "relative z-10 flex min-h-0 w-full flex-col overflow-hidden border border-border bg-card shadow-2xl",
          fullscreen
            ? "h-[100dvh] max-w-none rounded-none"
            : "h-[min(94dvh,calc(100dvh-1rem))] max-w-[min(98vw,90rem)] rounded-2xl",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {file.filename}
            </h3>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size_bytes)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
              aria-pressed={fullscreen}
            >
              {fullscreen ? (
                <Minimize2 className="size-4" aria-hidden />
              ) : (
                <Maximize2 className="size-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => void downloadApplicationFile(applicationId, file)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download className="size-3.5 shrink-0" aria-hidden />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Spinner className="size-6 border-muted-foreground/30 border-t-foreground" />
              Loading preview…
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-md text-sm text-rose-600 dark:text-rose-400">{error}</p>
              <button
                type="button"
                onClick={() => void downloadApplicationFile(applicationId, file)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="size-4 shrink-0" aria-hidden />
                Download instead
              </button>
            </div>
          ) : previewKind === "image" && previewUrl ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={file.filename}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : previewKind === "pdf" && previewUrl ? (
            <iframe
              src={previewUrl}
              title={file.filename}
              className="h-full w-full border-0 bg-background"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
