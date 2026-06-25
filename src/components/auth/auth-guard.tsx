"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOGIN_PATH, resolveSafeNextPath } from "@/config/auth-routes";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const next = pathname && pathname !== "/" ? resolveSafeNextPath(pathname) : undefined;
    const loginUrl = next
      ? `${LOGIN_PATH}?next=${encodeURIComponent(next)}`
      : LOGIN_PATH;
    router.replace(loginUrl);
  }, [status, router, pathname]);

  // While the session is being checked (or before a redirect), render nothing
  // so the page-level Suspense fallback (skeletons) takes over the loading UI.
  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
