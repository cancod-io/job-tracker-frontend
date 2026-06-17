import {
  formatFileSize,
  isAllowedApplicationFile,
  validateApplicationFile,
} from "@/lib/application-file-utils";
import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse, readApiErrorMessage } from "@/lib/http";
import type {
  ApiApplicationFile,
  ApiApplicationFilesListResponse,
} from "@/types/application-file";

const UPLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;

export {
  APPLICATION_FILE_ACCEPT,
  formatFileSize,
  isAllowedApplicationFile,
  MAX_APPLICATION_FILE_SIZE_BYTES,
  validateApplicationFile,
} from "@/lib/application-file-utils";

function normalizeFile(raw: ApiApplicationFile): ApiApplicationFile {
  return {
    ...raw,
    filename: raw.filename?.trim() || `file-${raw.id}`,
  };
}

function parseFilesList(data: unknown): ApiApplicationFile[] {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeFile(item as ApiApplicationFile));
  }
  const wrapped = data as ApiApplicationFilesListResponse;
  if (Array.isArray(wrapped.items)) {
    return wrapped.items.map(normalizeFile);
  }
  return [];
}

export async function fetchApplicationFiles(applicationId: number): Promise<ApiApplicationFile[]> {
  const res = await fetchAuthed(`/api/v1/applications/${applicationId}/files`);
  await assertOkResponse(res, "Could not load attachments.");
  const data = await res.json();
  return parseFilesList(data);
}

export async function uploadApplicationFile(
  applicationId: number,
  file: File,
): Promise<ApiApplicationFile> {
  const validationError = validateApplicationFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchAuthed(
    `/api/v1/applications/${applicationId}/files`,
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_TIMEOUT_MS,
  );

  await assertOkResponse(res, "Could not upload file.");
  return normalizeFile((await res.json()) as ApiApplicationFile);
}

export async function fetchApplicationFile(
  applicationId: number,
  fileId: number,
): Promise<ApiApplicationFile> {
  const res = await fetchAuthed(`/api/v1/applications/${applicationId}/files/${fileId}`);
  await assertOkResponse(res, "Could not load file details.");
  return normalizeFile((await res.json()) as ApiApplicationFile);
}

export async function deleteApplicationFile(applicationId: number, fileId: number): Promise<void> {
  const res = await fetchAuthed(`/api/v1/applications/${applicationId}/files/${fileId}`, {
    method: "DELETE",
  });
  await assertOkResponse(res, "Could not delete file.");
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() ?? null;
}

export type ApplicationFileBlob = {
  blob: Blob;
  contentType: string;
  filename: string;
};

export async function fetchApplicationFileBlob(
  applicationId: number,
  file: ApiApplicationFile,
): Promise<ApplicationFileBlob> {
  const res = await fetchAuthed(
    `/api/v1/applications/${applicationId}/files/${file.id}/download`,
    {},
    DOWNLOAD_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Could not load file."));
  }

  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    file.content_type?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const filename =
    filenameFromContentDisposition(res.headers.get("content-disposition")) ?? file.filename;
  const blob = await res.blob();

  return {
    blob: blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: contentType }),
    contentType,
    filename,
  };
}

export async function downloadApplicationFile(
  applicationId: number,
  file: ApiApplicationFile,
): Promise<void> {
  const { blob, filename } = await fetchApplicationFileBlob(applicationId, file);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
