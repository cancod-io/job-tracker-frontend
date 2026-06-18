"use client";

import { useEffect, useState } from "react";
import { formatFileSize, prepareBlobFilePreview } from "@/lib/application-file-utils";
import { downloadApplicationFile, fetchApplicationFileBlob } from "@/lib/application-files-api";
import { FilePreviewModal, type FilePreviewKind } from "@/components/files/file-preview-modal";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<FilePreviewKind | null>(null);

  useEffect(() => {
    function clearPreview() {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewText(null);
      setPreviewHtml(null);
      setPreviewKind(null);
    }

    if (!file) {
      setLoading(false);
      setError(null);
      clearPreview();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    clearPreview();

    void (async () => {
      try {
        const { blob } = await fetchApplicationFileBlob(applicationId, file);
        if (cancelled) return;
        const prepared = await prepareBlobFilePreview(blob, file.filename, file.content_type);
        if (cancelled) {
          URL.revokeObjectURL(prepared.url);
          return;
        }
        setPreviewKind(prepared.kind);
        setPreviewUrl(prepared.url || null);
        setPreviewText(prepared.text);
        setPreviewHtml(prepared.html);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview file.");
        clearPreview();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applicationId, file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FilePreviewModal
      open={Boolean(file)}
      title={file?.filename ?? ""}
      subtitle={file ? formatFileSize(file.size_bytes) : undefined}
      loading={loading}
      error={error}
      previewKind={previewKind}
      previewUrl={previewUrl}
      previewText={previewText}
      previewHtml={previewHtml}
      onDownload={() => {
        if (file) void downloadApplicationFile(applicationId, file);
      }}
      onClose={onClose}
    />
  );
}
