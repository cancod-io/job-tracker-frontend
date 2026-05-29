import type { LucideIcon } from "lucide-react";
import { File, FileImage, FileText } from "lucide-react";
import type { ApiApplicationFile } from "@/types/application-file";

export const APPLICATION_FILE_ACCEPT = ".pdf,.doc,.docx,.zip,image/*";
export const MAX_APPLICATION_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function isAllowedApplicationFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (/\.(pdf|docx?|zip)$/.test(name)) return true;
  return file.type.startsWith("image/");
}

export function validateApplicationFile(file: File): string | null {
  if (!isAllowedApplicationFile(file)) {
    return "Only PDF, DOCX, images, or ZIP files are supported.";
  }
  if (file.size > MAX_APPLICATION_FILE_SIZE_BYTES) {
    return `File must be ${formatFileSize(MAX_APPLICATION_FILE_SIZE_BYTES)} or smaller.`;
  }
  if (file.size <= 0) {
    return "File is empty.";
  }
  return null;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function applicationFileIcon(file: ApiApplicationFile): LucideIcon {
  const type = file.content_type?.toLowerCase() ?? "";
  const name = file.filename.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
    return FileImage;
  }
  if (type.includes("pdf") || name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
    return FileText;
  }
  return File;
}

export function applicationFileUploaderLabel(file: ApiApplicationFile): string | null {
  const raw = file.uploader?.trim();
  return raw || null;
}

export type ApplicationFilePreviewKind = "image" | "pdf" | "none";

export function applicationFilePreviewKind(file: ApiApplicationFile): ApplicationFilePreviewKind {
  const type = file.content_type?.toLowerCase() ?? "";
  const name = file.filename.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  return "none";
}

export function canPreviewApplicationFile(file: ApiApplicationFile): boolean {
  return applicationFilePreviewKind(file) !== "none";
}
