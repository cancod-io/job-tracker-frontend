"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, UserRound } from "lucide-react";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { AvatarEditorModal } from "@/components/profile/avatar-editor-modal";
import { useAvatarDisplayUrl } from "@/hooks/use-avatar-display-url";
import { useDeleteAvatarMutation, useUploadAvatarMutation } from "@/hooks/use-profile";
import { hasProfileAvatar } from "@/lib/profile-avatar-url";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, validateAvatarFile } from "@/lib/profile-file-utils";
import { formatFileSize } from "@/lib/application-file-utils";

type AvatarUploaderProps = {
  /** Current avatar URL from the server (`profile.profile_picture_url`). */
  url: string | null;
  /** Fallback initials when no avatar is set. */
  fallback: string;
};

export function AvatarUploader({ url, fallback }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const uploadMutation = useUploadAvatarMutation();
  const deleteMutation = useDeleteAvatarMutation();
  const busy = uploadMutation.isPending || deleteMutation.isPending;
  const hasAvatar = hasProfileAvatar(url);
  const { displayUrl: serverAvatarUrl, loading: avatarLoading } = useAvatarDisplayUrl(url);

  function handlePick() {
    inputRef.current?.click();
  }

  /** Validate a candidate file and, if good, open it in the editor. */
  function acceptCandidate(file: File | undefined | null) {
    if (!file) return;
    const err = validateAvatarFile(file);
    if (err) {
      notify.error(err);
      return;
    }
    setEditingFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    acceptCandidate(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (busy) return;
    acceptCandidate(e.dataTransfer.files?.[0]);
  }

  /** Upload the cropped result produced by the editor. */
  function handleApplyCrop(cropped: File) {
    const preview = URL.createObjectURL(cropped);
    setLocalPreview(preview);
    setEditingFile(null);

    uploadMutation.mutate(cropped, {
      onSuccess: () => {
        notify.success("Profile picture updated.");
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : "Could not upload profile picture.");
      },
      onSettled: () => {
        URL.revokeObjectURL(preview);
        setLocalPreview(null);
      },
    });
  }

  function handleRemove() {
    if (busy) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => notify.success("Profile picture removed."),
      onError: (error) =>
        notify.error(error instanceof Error ? error.message : "Could not remove profile picture."),
    });
  }

  const shownUrl = localPreview ?? serverAvatarUrl;
  const showSpinner = busy || (hasAvatar && avatarLoading && !localPreview);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-foreground">Profile Picture</p>

      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        aria-label={hasAvatar ? "Change profile picture" : "Upload profile picture"}
        className={cn(
          "group relative size-28 overflow-hidden rounded-full border border-border bg-muted shadow-sm outline-none transition-shadow",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          dragActive && "border-primary ring-2 ring-primary",
          busy ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        )}
      >
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownUrl}
            alt="Profile avatar"
            className="size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {fallback ? fallback : <UserRound className="size-10" aria-hidden />}
          </div>
        )}

        {/* Hover/drag affordance — Slack-style camera overlay. */}
        {!busy ? (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/55 text-foreground opacity-0 transition-opacity group-hover:opacity-100",
              dragActive && "opacity-100",
            )}
          >
            <Camera className="size-5" aria-hidden />
            <span className="text-[11px] font-semibold">
              {dragActive ? "Drop to upload" : hasAvatar ? "Change" : "Upload"}
            </span>
          </div>
        ) : null}

        {showSpinner ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : null}
      </button>

      <div className="flex w-full max-w-[14rem] flex-col gap-2">
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="size-3.5 shrink-0" aria-hidden />
          {hasAvatar ? "Change photo" : "Upload photo"}
        </button>
        {hasAvatar ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-background px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5 shrink-0" aria-hidden />
            Remove
          </button>
        ) : null}
        <p className="text-center text-[11px] text-muted-foreground">
          Drag &amp; drop or click · JPG, PNG, GIF, WEBP · max {formatFileSize(AVATAR_MAX_BYTES)}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        aria-label="Upload profile picture"
        onChange={handleFileChange}
      />

      {editingFile ? (
        <AvatarEditorModal
          file={editingFile}
          busy={uploadMutation.isPending}
          onApply={handleApplyCrop}
          onCancel={() => setEditingFile(null)}
          onChoosePhoto={handlePick}
        />
      ) : null}
    </div>
  );
}
