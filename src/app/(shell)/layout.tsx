import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MainAppShell } from "@/components/layout/main-app-shell";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <MainAppShell>
      <AuthGuard>{children}</AuthGuard>
    </MainAppShell>
  );
}
