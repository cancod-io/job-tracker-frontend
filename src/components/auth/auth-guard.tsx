"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LOGIN_PATH } from "@/config/auth-routes";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const next = pathname && pathname !== "/" ? pathname : undefined;
    const loginUrl = next
      ? `${LOGIN_PATH}?next=${encodeURIComponent(next)}`
      : LOGIN_PATH;
    router.replace(loginUrl);
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
      >
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
