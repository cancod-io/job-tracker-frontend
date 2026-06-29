import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MainAppShell } from "@/components/layout/main-app-shell";
import { RealtimeProvider } from "@/providers/realtime-provider";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <MainAppShell>
        <AuthGuard>{children}</AuthGuard>
      </MainAppShell>
    </RealtimeProvider>
  );
}
