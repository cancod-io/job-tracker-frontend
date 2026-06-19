"use client";

import { useRef, useState } from "react";
import { Download, Eye, Paperclip, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import {
  APPLICATION_FILE_ACCEPT,
  applicationFileIcon,
  applicationFileUploaderLabel,
  canPreviewApplicationFile,
  formatFileSize,
  MAX_APPLICATION_FILE_SIZE_BYTES,
} from "@/lib/application-file-utils";
import { ApplicationFilePreviewModal } from "@/components/applications/application-file-preview-modal";
import { Spinner } from "@/components/ui/spinner";
import { useApplicationFiles } from "@/hooks/use-application-files";
import type { ApiApplicationFile } from "@/types/application-file";

type ApplicationFilesPanelProps = {
  applicationId: number;
  variant?: "card" | "detail";
};

function FileRow({
  file,
  busy,
  compact,
  onPreview,
  onDownload,
  onDelete,
}: {
  file: ApiApplicationFile;
  busy: boolean;
  compact: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const Icon = applicationFileIcon(file);
  const uploader = applicationFileUploaderLabel(file);
  const previewable = canPreviewApplicationFile(file);

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20",
        compact ? "px-2 py-1.5" : "gap-3 px-3 py-2.5",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground",
          compact ? "size-7" : "size-8",
        )}
      >
        <Icon className={compact ? "size-3.5" : "size-4"} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        {previewable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className={cn(
              "block max-w-full truncate text-left font-medium text-foreground underline-offset-2 hover:text-primary hover:underline",
              compact ? "text-[11px]" : "text-sm",
            )}
            title={`Preview ${file.filename}`}
          >
            {file.filename}
          </button>
        ) : (
          <p className={cn("truncate font-medium text-foreground", compact ? "text-[11px]" : "text-sm")}>
            {file.filename}
          </p>
        )}
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-[11px]")}>
          {formatFileSize(file.size_bytes)}
          {file.created_at ? ` · ${formatDate(file.created_at)}` : null}
          {uploader ? ` · ${uploader}` : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {previewable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            disabled={busy}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60",
              compact ? "size-7" : "size-8",
            )}
            aria-label={`Preview ${file.filename}`}
          >
            <Eye className={compact ? "size-3" : "size-3.5"} aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          disabled={busy}
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60",
            compact ? "size-7" : "size-8",
          )}
          aria-label={`Download ${file.filename}`}
        >
          <Download className={compact ? "size-3" : "size-3.5"} aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={busy}
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60",
            "dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10",
            compact ? "size-7" : "size-8",
          )}
          aria-label={`Delete ${file.filename}`}
        >
          {busy ? (
            <Spinner
              className={cn(
                "border-rose-300 border-t-rose-600 dark:border-rose-500/30 dark:border-t-rose-400",
                compact ? "size-3" : "size-3.5",
              )}
            />
          ) : (
            <Trash2 className={compact ? "size-3" : "size-3.5"} aria-hidden />
          )}
        </button>
      </div>
    </li>
  );
}

export function ApplicationFilesPanel({
  applicationId,
  variant = "detail",
}: ApplicationFilesPanelProps) {
  const compact = variant === "card";
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<ApiApplicationFile | null>(null);
  const {
    files,
    loading,
    loadError,
    uploading,
    deletingId,
    uploadFile,
    deleteFile,
    downloadFile,
  } = useApplicationFiles(applicationId, { silentLoad: compact });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file);
  }

  return (
    <div
      className={cn(compact && "mt-2.5 border-t border-border/50 pt-2.5")}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("flex items-center justify-between gap-2", compact ? "mb-1.5" : "mb-2")}>
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-muted-foreground",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          {compact ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3 shrink-0" aria-hidden />
              Files{files.length > 0 ? ` (${files.length})` : ""}
            </span>
          ) : (
            "Attachments"
          )}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={uploading}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60",
            compact ? "px-2 py-1 text-[10px]" : "gap-1.5 px-2.5 py-1.5 text-[11px]",
          )}
        >
          {uploading ? (
            <>
              <Spinner className="size-3 border-muted-foreground/30 border-t-foreground" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="size-3 shrink-0" aria-hidden />
              Upload
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={APPLICATION_FILE_ACCEPT}
          className="sr-only"
          aria-label="Upload attachment"
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {!compact ? (
        <p className="mb-3 text-xs text-muted-foreground">
          PDF, DOCX, images, or ZIP up to {formatFileSize(MAX_APPLICATION_FILE_SIZE_BYTES)}. PDFs and images can be previewed.
        </p>
      ) : null}

      {uploading ? (
        <div
          className={cn("mb-2 overflow-hidden rounded-full bg-muted", compact ? "h-1" : "h-1.5")}
          aria-hidden
        >
          <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-1.5" aria-busy="true" aria-label="Loading attachments">
          {[0, 1].map((key) => (
            <div
              key={key}
              className={cn(
                "animate-pulse rounded-lg border border-border/60 bg-muted/30",
                compact ? "h-9" : "h-12",
              )}
            />
          ))}
        </div>
      ) : loadError ? (
        <p className={cn("text-rose-600 dark:text-rose-400", compact ? "text-[10px]" : "text-xs")}>
          {loadError}
        </p>
      ) : files.length === 0 ? (
        <p className={cn("italic text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          No files yet.
        </p>
      ) : (
        <ul className={cn("space-y-1.5", compact && "max-h-36 overflow-y-auto pr-0.5")}>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              compact={compact}
              busy={deletingId === file.id}
              onPreview={() => setPreviewFile(file)}
              onDownload={() => void downloadFile(file)}
              onDelete={() => void deleteFile(file)}
            />
          ))}
        </ul>
      )}

      <ApplicationFilePreviewModal
        applicationId={applicationId}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

/** @deprecated Use `ApplicationFilesPanel` instead. */
export const ApplicationFilesSection = ApplicationFilesPanel;
