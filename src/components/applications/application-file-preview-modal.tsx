"use client";

import { useEffect, useState } from "react";
import { applicationFilePreviewKind, formatFileSize } from "@/lib/application-file-utils";
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
  const [previewKind, setPreviewKind] = useState<FilePreviewKind | null>(null);

  useEffect(() => {
    if (!file) {
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
      onDownload={() => {
        if (file) void downloadApplicationFile(applicationId, file);
      }}
      onClose={onClose}
    />
  );
}
