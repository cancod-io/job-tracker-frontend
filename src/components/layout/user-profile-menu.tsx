"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { LOGIN_PATH, REGISTER_PATH } from "@/config/auth-routes";
import { useAuth } from "@/providers/auth-provider";
import { useProfileQuery } from "@/hooks/use-profile";
import { useAvatarDisplayUrl } from "@/hooks/use-avatar-display-url";
import { FloatingMenuPortal } from "@/components/ui/floating-menu";
import { cn } from "@/lib/utils";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors";

export function UserProfileMenu() {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Mirror the profile avatar in the header — shared with the profile page via
  // React Query, so an upload/removal updates here instantly.
  const profileQuery = useProfileQuery({ enabled: status === "authenticated" });
  const { displayUrl: avatarUrl } = useAvatarDisplayUrl(
    profileQuery.data?.profile_picture_url ?? null,
  );

  if (status === "loading") {
    return (
      <div
        className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
        aria-hidden
      />
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href={REGISTER_PATH}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Register
        </Link>
        <Link
          href={LOGIN_PATH}
          className="hover:bg-primary/92 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const letter = initials(user.full_name, user.email);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex max-w-full items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-2 text-left shadow-sm transition-colors hover:bg-muted/80",
          open && "bg-muted/80",
        )}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-xs font-bold text-primary"
          aria-hidden
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            letter
          )}
        </span>
        <span className="hidden min-w-0 flex-1 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium text-foreground">{user.full_name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <FloatingMenuPortal
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        className="w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card py-1 shadow-lg"
      >
        <div role="menu" aria-orientation="vertical">
          <div className="border-b border-border px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(menuItemClass, "hover:bg-muted")}
          >
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            Profile Settings
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            Sign out
          </button>
        </div>
      </FloatingMenuPortal>
    </div>
  );
}
