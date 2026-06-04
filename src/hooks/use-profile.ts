"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AVATAR_BLOB_QUERY_KEY } from "@/hooks/use-avatar-display-url";
import {
  changePassword,
  deleteAvatar,
  deleteCv,
  fetchCvs,
  fetchProfile,
  updateProfile,
  uploadAvatar,
  uploadCv,
} from "@/lib/profile-api";
import type {
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  UserCv,
} from "@/types/profile";

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;
export const PROFILE_CVS_QUERY_KEY = ["profile", "me", "cvs"] as const;

export function useProfileQuery(options: { enabled?: boolean } = {}) {
  return useQuery<ProfileResponse>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    // Profile rarely changes from another tab. A long staleness window keeps
    // the editing form from being silently overwritten by a window-focus refetch
    // while the user is mid-edit.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    enabled: options.enabled ?? true,
  });
}

export function useProfileUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => updateProfile(payload),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_QUERY_KEY, data);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changePassword(payload),
  });
}

export function useUploadAvatarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      qc.setQueryData<ProfileResponse | undefined>(PROFILE_QUERY_KEY, (prev) =>
        prev ? { ...prev, profile_picture_url: data.profile_picture_url } : prev,
      );
      // The download URL often stays identical, so refetch the cached blob to
      // refresh every avatar on screen (header menu, profile form).
      void qc.invalidateQueries({ queryKey: AVATAR_BLOB_QUERY_KEY });
    },
  });
}

export function useDeleteAvatarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => {
      qc.setQueryData<ProfileResponse | undefined>(PROFILE_QUERY_KEY, (prev) =>
        prev ? { ...prev, profile_picture_url: null } : prev,
      );
      void qc.invalidateQueries({ queryKey: AVATAR_BLOB_QUERY_KEY });
    },
  });
}

export function useCvsQuery() {
  return useQuery<UserCv[]>({
    queryKey: PROFILE_CVS_QUERY_KEY,
    queryFn: fetchCvs,
  });
}

export function useUploadCvMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadCv(file),
    onSuccess: (cv) => {
      qc.setQueryData<UserCv[] | undefined>(PROFILE_CVS_QUERY_KEY, (prev) =>
        prev ? [cv, ...prev] : [cv],
      );
    },
  });
}

export function useDeleteCvMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cvId: number) => deleteCv(cvId),
    onSuccess: (_void, cvId) => {
      qc.setQueryData<UserCv[] | undefined>(PROFILE_CVS_QUERY_KEY, (prev) =>
        prev ? prev.filter((cv) => cv.id !== cvId) : prev,
      );
    },
  });
}
