"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authRequestHeaders } from "@/lib/auth-token";
import { fetchWithTimeout } from "@/lib/http";
import { hasProfileAvatar, PROFILE_AVATAR_DOWNLOAD_PATH } from "@/lib/profile-avatar-url";

const AVATAR_FETCH_TIMEOUT_MS = 30_000;

/**
 * Shared cache key for the downloaded avatar blob. Invalidate this (see
 * `useUploadAvatarMutation` / `useDeleteAvatarMutation`) to force every avatar
 * on screen — header menu, profile form — to refetch after a change.
 */
export const AVATAR_BLOB_QUERY_KEY = ["profile", "me", "avatar-blob"] as const;

async function fetchAvatarBlob(): Promise<Blob> {
  const res = await fetchWithTimeout(
    PROFILE_AVATAR_DOWNLOAD_PATH,
    { headers: authRequestHeaders(), credentials: "omit", cache: "no-store" },
    AVATAR_FETCH_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Avatar fetch failed (${res.status})`);
  return res.blob();
}

/**
 * Loads the profile avatar via the authenticated same-origin proxy and returns
 * a blob URL for `<img>`. The blob is fetched once and shared via React Query
 * (deduped across all consumers); the object URL is created per-component so it
 * is reliably revoked on unmount.
 */
export function useAvatarDisplayUrl(profilePictureUrl: string | null): {
  displayUrl: string | null;
  loading: boolean;
} {
  const enabled = hasProfileAvatar(profilePictureUrl);

  const query = useQuery({
    queryKey: [...AVATAR_BLOB_QUERY_KEY, profilePictureUrl ?? null],
    queryFn: fetchAvatarBlob,
    enabled,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: 1,
  });

  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const blob = query.data;

  useEffect(() => {
    if (!blob) {
      setDisplayUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setDisplayUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return {
    displayUrl: enabled ? displayUrl : null,
    loading: enabled && query.isPending,
  };
}
