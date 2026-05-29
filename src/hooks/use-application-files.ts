"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteApplicationFile,
  downloadApplicationFile,
  fetchApplicationFiles,
  uploadApplicationFile,
  validateApplicationFile,
} from "@/lib/application-files-api";
import { notify } from "@/lib/notify";
import type { ApiApplicationFile } from "@/types/application-file";

export function applicationFilesQueryKey(applicationId: number) {
  return ["application-files", applicationId] as const;
}

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
  const queryClient = useQueryClient();
  const queryKey = applicationFilesQueryKey(applicationId);

  const filesQuery = useQuery({
    queryKey,
    queryFn: () => fetchApplicationFiles(applicationId),
  });

  const loadError =
    filesQuery.error instanceof Error
      ? filesQuery.error.message
      : filesQuery.error
        ? "Could not load attachments."
        : null;

  useEffect(() => {
    if (silentLoad || !filesQuery.isError || !loadError) return;
    notify.error(loadError);
  }, [silentLoad, filesQuery.isError, loadError]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApplicationFile(applicationId, file),
    onSuccess: (created) => {
      queryClient.setQueryData<ApiApplicationFile[]>(queryKey, (prev) => [
        created,
        ...(prev ?? []),
      ]);
      notify.success(`Uploaded ${created.filename}`);
    },
    onError: (err) => {
      notify.error(err instanceof Error ? err.message : "Could not upload file.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (file: ApiApplicationFile) => deleteApplicationFile(applicationId, file.id),
    onSuccess: (_data, file) => {
      queryClient.setQueryData<ApiApplicationFile[]>(queryKey, (prev) =>
        (prev ?? []).filter((item) => item.id !== file.id),
      );
      notify.success(`Removed ${file.filename}`);
    },
    onError: (err) => {
      notify.error(err instanceof Error ? err.message : "Could not delete file.");
    },
  });

  async function uploadFile(file: File): Promise<boolean> {
    const validationError = validateApplicationFile(file);
    if (validationError) {
      notify.error(validationError);
      return false;
    }

    try {
      await uploadMutation.mutateAsync(file);
      return true;
    } catch {
      return false;
    }
  }

  async function deleteFile(file: ApiApplicationFile): Promise<void> {
    try {
      await deleteMutation.mutateAsync(file);
    } catch {
      // Error toast handled in mutation onError.
    }
  }

  async function downloadFile(file: ApiApplicationFile): Promise<void> {
    try {
      await downloadApplicationFile(applicationId, file);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not download file.");
    }
  }

  async function refresh(): Promise<void> {
    await filesQuery.refetch();
  }

  return {
    files: filesQuery.data ?? [],
    loading: filesQuery.isLoading,
    loadError: filesQuery.isError ? loadError : null,
    uploading: uploadMutation.isPending,
    deletingId: deleteMutation.isPending ? (deleteMutation.variables?.id ?? null) : null,
    uploadFile,
    deleteFile,
    downloadFile,
    refresh,
  };
}
