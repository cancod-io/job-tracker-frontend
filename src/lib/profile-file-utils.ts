import { formatFileSize } from "@/lib/application-file-utils";

export { formatFileSize };

export const AVATAR_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_EXT_RE = /\.(jpe?g|png|gif|webp)$/i;

export const CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const CV_MAX_BYTES = 10 * 1024 * 1024;
const CV_EXT_RE = /\.(pdf|docx?)$/i;

export function validateAvatarFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const okType = file.type.startsWith("image/") || AVATAR_EXT_RE.test(name);
  if (!okType) {
    return "Profile picture must be a JPG, PNG, GIF, or WEBP image.";
  }
  if (file.size <= 0) {
    return "Image file is empty.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return `Image must be ${formatFileSize(AVATAR_MAX_BYTES)} or smaller.`;
  }
  return null;
}

/** Whether a CV can be previewed inline. Only PDFs render in the browser; DOC/DOCX cannot. */
export type CvPreviewKind = "pdf" | "none";

export function cvPreviewKind(cv: {
  content_type?: string | null;
  filename: string;
}): CvPreviewKind {
  const type = cv.content_type?.toLowerCase() ?? "";
  const name = cv.filename.toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  return "none";
}

export function canPreviewCv(cv: { content_type?: string | null; filename: string }): boolean {
  return cvPreviewKind(cv) === "pdf";
}

export function validateCvFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const okType =
    CV_EXT_RE.test(name) ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (!okType) {
    return "CV must be a PDF, DOC, or DOCX file.";
  }
  if (file.size <= 0) {
    return "File is empty.";
  }
  if (file.size > CV_MAX_BYTES) {
    return `File must be ${formatFileSize(CV_MAX_BYTES)} or smaller.`;
  }
  return null;
}
