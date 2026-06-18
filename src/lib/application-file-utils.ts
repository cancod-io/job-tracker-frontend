import type { LucideIcon } from "lucide-react";
import { File, FileImage, FileText } from "lucide-react";
import type { ApiApplicationFile } from "@/types/application-file";

const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;

const TEXT_EXTENSION_RE =
  /\.(txt|csv|md|json|xml|html?|css|js|mjs|cjs|ts|tsx|jsx|log|yaml|yml|svg|sql|env)$/i;

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

export type FilePreviewKind = "image" | "pdf" | "text" | "video" | "audio" | "docx" | "embed";

/** @deprecated Use `FilePreviewKind`. */
export type ApplicationFilePreviewKind = FilePreviewKind;

export function resolveFilePreviewKind(
  filename: string,
  contentType?: string | null,
): FilePreviewKind {
  const type = contentType?.toLowerCase() ?? "";
  const name = filename.toLowerCase();

  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|ico|svg|avif)$/.test(name)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (type.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v)$/.test(name)) {
    return "video";
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(name)) {
    return "audio";
  }
  if (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/xml" ||
    type === "application/javascript" ||
    TEXT_EXTENSION_RE.test(name)
  ) {
    return "text";
  }
  return "embed";
}

export function isDocxFile(filename: string, contentType?: string | null): boolean {
  const type = contentType?.toLowerCase() ?? "";
  const name = filename.toLowerCase();
  return (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export function applicationFilePreviewKind(file: ApiApplicationFile): FilePreviewKind {
  return resolveFilePreviewKind(file.filename, file.content_type);
}

export function canPreviewApplicationFile(_file: ApiApplicationFile): boolean {
  return true;
}

export type PreparedFilePreview = {
  kind: FilePreviewKind;
  url: string;
  text: string | null;
  html: string | null;
};

export async function prepareBlobFilePreview(
  blob: Blob,
  filename: string,
  contentType?: string | null,
): Promise<PreparedFilePreview> {
  if (isDocxFile(filename, contentType)) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const mammoth = await import("mammoth");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      if (!html.trim()) {
        throw new Error("Document is empty.");
      }
      return { kind: "docx", url: "", text: null, html };
    } catch {
      return {
        kind: "embed",
        url: URL.createObjectURL(blob),
        text: null,
        html: null,
      };
    }
  }

  let kind = resolveFilePreviewKind(filename, contentType);
  const url = URL.createObjectURL(blob);
  let text: string | null = null;

  if (kind === "text") {
    try {
      if (blob.size > MAX_TEXT_PREVIEW_BYTES) {
        const slice = blob.slice(0, MAX_TEXT_PREVIEW_BYTES);
        text = `${await slice.text()}\n\n… preview truncated (${formatFileSize(blob.size)} total)`;
      } else {
        text = await blob.text();
      }
    } catch {
      kind = "embed";
    }
  }

  return { kind, url, text, html: null };
}
