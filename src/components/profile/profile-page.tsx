"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSectionNav } from "@/components/profile/profile-section-nav";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { ChangePasswordSection } from "@/components/profile/change-password-section";
import { TwoFactorSection } from "@/components/profile/two-factor-section";
import { CvListSection } from "@/components/profile/cv-list-section";
import { SocialLinksSection } from "@/components/profile/social-links-section";
import {
  buildProfilePatch,
  EMPTY_PROFILE_FORM,
  formsEqual,
  hasProfileFormErrors,
  profileToFormState,
  validateProfileForm,
  type ProfileFormState,
} from "@/components/profile/profile-helpers";
import { useProfileQuery, useProfileUpdateMutation } from "@/hooks/use-profile";

function avatarInitials(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const profileQuery = useProfileQuery();
  const updateMutation = useProfileUpdateMutation();

  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [submitted, setSubmitted] = useState(false);
  const originalRef = useRef<ProfileFormState>(EMPTY_PROFILE_FORM);
  const hydratedRef = useRef(false);

  // Hydrate form ONCE when the profile first loads. Subsequent server data
  // changes (background refetch) must not blow away the user's in-progress
  // edits — the mutation's own onSuccess handler is what re-syncs after a save.
  useEffect(() => {
    if (!profileQuery.data || hydratedRef.current) return;
    const next = profileToFormState(profileQuery.data);
    originalRef.current = next;
    setFormState(next);
    setSubmitted(false);
    hydratedRef.current = true;
  }, [profileQuery.data]);

  const handleChange = useCallback((patch: Partial<ProfileFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const errors = useMemo(() => validateProfileForm(formState), [formState]);
  const dirty = !formsEqual(formState, originalRef.current);
  const saving = updateMutation.isPending;

  function handleSave() {
    setSubmitted(true);
    if (hasProfileFormErrors(errors)) {
      notify.error("Please fix the highlighted fields before saving.");
      return;
    }
    const patch = buildProfilePatch(formState, originalRef.current);
    if (Object.keys(patch).length === 0) {
      notify.info("Nothing to save.");
      return;
    }
    updateMutation.mutate(patch, {
      onSuccess: (data) => {
        const next = profileToFormState(data);
        originalRef.current = next;
        setFormState(next);
        setSubmitted(false);
        notify.success("Profile updated.");
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : "Could not update profile.");
      },
    });
  }

  function handleCancel() {
    setFormState(originalRef.current);
    setSubmitted(false);
  }

  const profile = profileQuery.data;
  const headerActions = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving || !dirty}
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:flex-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:flex-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {saving ? <Spinner className="size-4 text-primary-foreground" /> : null}
        Save Changes
      </button>
    </>
  );

  // ── Render guards ────────────────────────────────────────────────────────
  if (profileQuery.isPending) {
    return (
      <>
        <PageHeader
          title="Profile Settings"
          description="Manage your personal information and account preferences."
          breadcrumbs={[{ label: "Account" }, { label: "Profile Settings" }]}
        />
        <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </>
    );
  }

  if (profileQuery.error || !profile) {
    return (
      <>
        <PageHeader
          title="Profile Settings"
          description="Manage your personal information and account preferences."
          breadcrumbs={[{ label: "Account" }, { label: "Profile Settings" }]}
        />
        <ErrorAlert
          message={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Could not load your profile."
          }
          onRetry={() => void profileQuery.refetch()}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Profile Settings"
        description="Manage your personal information and account preferences."
        breadcrumbs={[{ label: "Account" }, { label: "Profile Settings" }]}
        actions={headerActions}
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ProfileSectionNav />

        <div className="min-w-0 space-y-6">
          <PersonalInfoSection
            state={formState}
            errors={submitted ? errors : {}}
            onChange={handleChange}
            avatarUrl={profile.profile_picture_url}
            fallbackInitials={avatarInitials(profile.full_name, profile.email)}
            disabled={saving}
          />

          <ChangePasswordSection />

          <TwoFactorSection />

          <CvListSection />

          <SocialLinksSection
            state={formState}
            errors={submitted ? errors : {}}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
      </div>
    </>
  );
}
