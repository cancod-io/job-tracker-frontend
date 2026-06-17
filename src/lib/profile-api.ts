import { fetchAuthed } from "@/lib/auth-session";
import { assertOkResponse, readApiErrorMessage } from "@/lib/http";
import { normalizeProfilePictureUrl } from "@/lib/profile-avatar-url";
import { validateAvatarFile, validateCvFile } from "@/lib/profile-file-utils";
import type {
  AvatarUploadResponse,
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  UserCv,
  UserCvListResponse,
} from "@/types/profile";

const UPLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;

export async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetchAuthed("/api/v1/profile/me");
  await assertOkResponse(res, "Could not load your profile.");
  const data = (await res.json()) as ProfileResponse;
  return {
    ...data,
    profile_picture_url: normalizeProfilePictureUrl(data.profile_picture_url),
  };
}

export async function updateProfile(payload: ProfileUpdateRequest): Promise<ProfileResponse> {
  const res = await fetchAuthed("/api/v1/profile/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOkResponse(res, "Could not update your profile.");
  return (await res.json()) as ProfileResponse;
}

const PASSWORD_CHANGE_TIMEOUT_MS = 30_000;

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  const res = await fetchAuthed(
    "/api/v1/profile/me/password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    PASSWORD_CHANGE_TIMEOUT_MS,
  );
  await assertOkResponse(res, "Could not update your password.");
  await res.text().catch(() => "");
}

export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const err = validateAvatarFile(file);
  if (err) throw new Error(err);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchAuthed(
    "/api/v1/profile/me/avatar",
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_TIMEOUT_MS,
  );
  await assertOkResponse(res, "Could not upload profile picture.");
  const data = (await res.json()) as AvatarUploadResponse;
  return {
    profile_picture_url:
      normalizeProfilePictureUrl(data.profile_picture_url) ?? data.profile_picture_url,
  };
}

export async function deleteAvatar(): Promise<void> {
  const res = await fetchAuthed("/api/v1/profile/me/avatar", {
    method: "DELETE",
  });
  await assertOkResponse(res, "Could not remove profile picture.");
}

export async function fetchCvs(): Promise<UserCv[]> {
  const res = await fetchAuthed("/api/v1/profile/me/cvs");
  await assertOkResponse(res, "Could not load your CVs.");
  const data = (await res.json()) as UserCvListResponse | UserCv[];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function uploadCv(file: File): Promise<UserCv> {
  const err = validateCvFile(file);
  if (err) throw new Error(err);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchAuthed(
    "/api/v1/profile/me/cvs",
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_TIMEOUT_MS,
  );
  await assertOkResponse(res, "Could not upload CV.");
  return (await res.json()) as UserCv;
}

export async function deleteCv(cvId: number): Promise<void> {
  const res = await fetchAuthed(`/api/v1/profile/me/cvs/${cvId}`, {
    method: "DELETE",
  });
  await assertOkResponse(res, "Could not delete CV.");
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

export type CvBlob = {
  blob: Blob;
  filename: string;
};

export async function fetchCvBlob(cv: UserCv): Promise<CvBlob> {
  const res = await fetchAuthed(
    `/api/v1/profile/me/cvs/${cv.id}/download`,
    {},
    DOWNLOAD_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Could not download CV."));
  }

  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    cv.content_type?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const filename =
    filenameFromContentDisposition(res.headers.get("content-disposition")) ?? cv.filename;
  const blob = await res.blob();

  return {
    blob: blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: contentType }),
    filename,
  };
}

export async function downloadCv(cv: UserCv): Promise<void> {
  const { blob, filename } = await fetchCvBlob(cv);
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
