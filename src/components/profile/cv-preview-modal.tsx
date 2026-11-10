"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { downloadCv, fetchCvBlob } from "@/lib/profile-api";
import { cvPreviewKind } from "@/lib/profile-file-utils";
import { formatFileSize } from "@/lib/profile-file-utils";
import { FilePreviewModal } from "@/components/files/file-preview-modal";
import type { UserCv } from "@/types/profile";

type CvPreviewModalProps = {
  cv: UserCv | null;
  onClose: () => void;
};

export function CvPreviewModal({ cv, onClose }: CvPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const kind = cv ? cvPreviewKind(cv) : "none";

  useEffect(() => {
    if (!cv || kind !== "pdf") {
      setLoading(false);
      setError(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const { blob } = await fetchCvBlob(cv);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview CV.");
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
  }, [cv, kind]);

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
      previewKind={kind === "pdf" ? "pdf" : null}
      previewUrl={previewUrl}
      unsupportedHint="Word documents can't be previewed in the browser. Download the file to view it."
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
