"use client";

import { useRef, useState } from "react";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { downloadCv } from "@/lib/profile-api";
import { useCvsQuery, useDeleteCvMutation, useUploadCvMutation } from "@/hooks/use-profile";
import { canPreviewCv, CV_ACCEPT, CV_MAX_BYTES, validateCvFile } from "@/lib/profile-file-utils";
import { formatFileSize } from "@/lib/application-file-utils";
import { Spinner } from "@/components/ui/spinner";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ProfileSectionCard } from "@/components/profile/profile-section-card";
import { CvPreviewModal } from "@/components/profile/cv-preview-modal";
import type { UserCv } from "@/types/profile";

export function CvListSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cvsQuery = useCvsQuery();
  const uploadMutation = useUploadCvMutation();
  const deleteMutation = useDeleteCvMutation();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewCv, setPreviewCv] = useState<UserCv | null>(null);

  const files = cvsQuery.data ?? [];
  const uploading = uploadMutation.isPending;

  function handlePick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateCvFile(file);
    if (err) {
      notify.error(err);
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (cv) => notify.success(`Uploaded ${cv.filename}.`),
      onError: (error) =>
        notify.error(error instanceof Error ? error.message : "Could not upload CV."),
    });
  }

  function handleDelete(cv: UserCv) {
    if (deleteMutation.isPending) return;
    const ok = window.confirm(`Delete "${cv.filename}"? This cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(cv.id, {
      onSuccess: () => notify.success("CV removed."),
      onError: (error) =>
        notify.error(error instanceof Error ? error.message : "Could not delete CV."),
    });
  }

  async function handleDownload(cv: UserCv) {
    if (downloadingId != null) return;
    setDownloadingId(cv.id);
    try {
      await downloadCv(cv);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not download CV.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <ProfileSectionCard
        id="cvs"
        title="Uploaded CVs / Resumes"
        description={`Upload and manage your resumes. PDF, DOC, or DOCX up to ${formatFileSize(CV_MAX_BYTES)}.`}
        action={
          <>
            <button
              type="button"
              onClick={handlePick}
              disabled={uploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <Spinner className="size-4 text-primary-foreground" />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Upload New CV"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={CV_ACCEPT}
              className="sr-only"
              aria-label="Upload CV"
              onChange={handleFileChange}
            />
          </>
        }
      >
        {cvsQuery.isPending ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading CVs">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-border/60 bg-muted/30"
              />
            ))}
          </div>
        ) : cvsQuery.error ? (
          <ErrorAlert
            message={
              cvsQuery.error instanceof Error ? cvsQuery.error.message : "Could not load CVs."
            }
            onRetry={() => void cvsQuery.refetch()}
          />
        ) : files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No CVs uploaded yet. Click{" "}
            <span className="font-medium text-foreground">Upload New CV</span> to add one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left">
                    File Name
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 text-left sm:table-cell">
                    Uploaded On
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 text-left sm:table-cell">
                    Size
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {files.map((cv) => (
                  <tr key={cv.id} className="bg-card">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <FileText className="size-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          {canPreviewCv(cv) ? (
                            <button
                              type="button"
                              onClick={() => setPreviewCv(cv)}
                              className="block max-w-full truncate text-left font-medium text-foreground transition-colors hover:text-primary hover:underline"
                            >
                              {cv.filename}
                            </button>
                          ) : (
                            <p className="truncate font-medium text-foreground">{cv.filename}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground sm:hidden">
                            {formatDate(cv.created_at)} · {formatFileSize(cv.size_bytes)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(cv.created_at)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatFileSize(cv.size_bytes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {canPreviewCv(cv) ? (
                          <button
                            type="button"
                            onClick={() => setPreviewCv(cv)}
                            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Preview ${cv.filename}`}
                          >
                            <Eye className="size-4" aria-hidden />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDownload(cv)}
                          disabled={downloadingId === cv.id}
                          className={cn(
                            "inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                            "disabled:cursor-not-allowed disabled:opacity-60",
                          )}
                          aria-label={`Download ${cv.filename}`}
                        >
                          {downloadingId === cv.id ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <Download className="size-4" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cv)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === cv.id}
                          className={cn(
                            "inline-flex size-9 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50",
                            "disabled:cursor-not-allowed disabled:opacity-60",
                            "dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10",
                          )}
                          aria-label={`Delete ${cv.filename}`}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === cv.id ? (
                            <Spinner className="size-3.5 border-rose-300 border-t-rose-600 dark:border-rose-500/30 dark:border-t-rose-400" />
                          ) : (
                            <Trash2 className="size-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ProfileSectionCard>
      <CvPreviewModal cv={previewCv} onClose={() => setPreviewCv(null)} />
    </>
  );
}
