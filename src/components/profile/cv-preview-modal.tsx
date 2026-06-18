"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { formatFileSize, prepareBlobFilePreview } from "@/lib/application-file-utils";
import { downloadCv, fetchCvBlob } from "@/lib/profile-api";
import { FilePreviewModal, type FilePreviewKind } from "@/components/files/file-preview-modal";
import type { UserCv } from "@/types/profile";

type CvPreviewModalProps = {
  cv: UserCv | null;
  onClose: () => void;
};

export function CvPreviewModal({ cv, onClose }: CvPreviewModalProps) {
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

    if (!cv) {
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
        const { blob } = await fetchCvBlob(cv);
        if (cancelled) return;
        const prepared = await prepareBlobFilePreview(blob, cv.filename, cv.content_type);
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
        setError(err instanceof Error ? err.message : "Could not preview CV.");
        clearPreview();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cv]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FilePreviewModal
      open={Boolean(cv)}
      title={cv?.filename ?? ""}
      subtitle={cv ? formatFileSize(cv.size_bytes) : undefined}
      loading={loading}
      error={error}
      previewKind={previewKind}
      previewUrl={previewUrl}
      previewText={previewText}
      previewHtml={previewHtml}
      onDownload={() => {
        if (!cv) return;
        void downloadCv(cv).catch((err) =>
          notify.error(err instanceof Error ? err.message : "Could not download CV."),
        );
      }}
      onClose={onClose}
    />
  );
}
