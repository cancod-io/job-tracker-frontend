"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteApplicationFile,
  downloadApplicationFile,
  fetchApplicationFiles,
  uploadApplicationFile,
  validateApplicationFile,
} from "@/lib/application-files-api";
import { notify } from "@/lib/notify";
import type { ApiApplicationFile } from "@/types/application-file";

type UseApplicationFilesOptions = {
  /** When true, load failures are returned via `loadError` instead of a toast. */
  silentLoad?: boolean;
};

type UseApplicationFilesResult = {
  files: ApiApplicationFile[];
  loading: boolean;
  loadError: string | null;
  uploading: boolean;
  deletingId: number | null;
  uploadFile: (file: File) => Promise<boolean>;
  deleteFile: (file: ApiApplicationFile) => Promise<void>;
  downloadFile: (file: ApiApplicationFile) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useApplicationFiles(
  applicationId: number,
  options: UseApplicationFilesOptions = {},
): UseApplicationFilesResult {
  const { silentLoad = false } = options;
  const [files, setFiles] = useState<ApiApplicationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const next = await fetchApplicationFiles(applicationId);
      setFiles(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load attachments.";
      setLoadError(message);
      setFiles([]);
      if (!silentLoad) notify.error(message);
    } finally {
      setLoading(false);
    }
  }, [applicationId, silentLoad]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      const validationError = validateApplicationFile(file);
      if (validationError) {
        notify.error(validationError);
        return false;
      }

      setUploading(true);
      try {
        const created = await uploadApplicationFile(applicationId, file);
        setFiles((prev) => [created, ...prev]);
        setLoadError(null);
        notify.success(`Uploaded ${created.filename}`);
        return true;
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Could not upload file.");
        return false;
      } finally {
        setUploading(false);
      }
    },
    [applicationId],
  );

  const deleteFile = useCallback(
    async (file: ApiApplicationFile) => {
      setDeletingId(file.id);
      try {
        await deleteApplicationFile(applicationId, file.id);
        setFiles((prev) => prev.filter((item) => item.id !== file.id));
        notify.success(`Removed ${file.filename}`);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Could not delete file.");
      } finally {
        setDeletingId(null);
      }
    },
    [applicationId],
  );

  const downloadFile = useCallback(
    async (file: ApiApplicationFile) => {
      try {
        await downloadApplicationFile(applicationId, file);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Could not download file.");
      }
    },
    [applicationId],
  );

  return {
    files,
    loading,
    loadError,
    uploading,
    deletingId,
    uploadFile,
    deleteFile,
    downloadFile,
    refresh,
  };
}
