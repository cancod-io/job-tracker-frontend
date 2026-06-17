"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { JOBS_PATH } from "@/config/auth-routes";
import { userPrimaryNav } from "@/config/user-nav";
import { UserNavLink } from "@/components/layout/user-nav-link";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function MainAppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile: slide-over menu from the right (similar to hiring.cafe) */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(20rem,90vw)] flex-col border-l border-border/80 bg-card shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Menu"
        id="mobile-nav-drawer"
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 px-4">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
          {userPrimaryNav.map((item) => (
            <UserNavLink
              key={item.href}
              item={item}
              variant="sidebar"
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>
        <p className="border-t border-border/80 px-4 py-3 text-xs text-muted-foreground">
          Full-width job feed — save and track applications from any screen size.
        </p>
      </aside>

      <header className="sticky top-0 z-50 border-b border-border bg-background shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
            <Link
              href={JOBS_PATH}
              className="group flex shrink-0 items-center gap-2"
              aria-label="TrackCod home"
              onClick={() => setMobileOpen(false)}
            >

              <span className="relative flex shrink-0 items-center">
                <img
                  src="/light-logo.png"
                  alt=""
                  width={220}
                  height={56}
                  className="h-10 w-auto max-w-[min(100%,11rem)] object-contain object-left dark:hidden sm:h-14 sm:max-w-[min(100%,13rem)]"
                  
                />
                <img
                  src="/dark-logo.png"
                  alt=""
                  width={220}
                  height={56}
                  className="hidden h-10 w-auto max-w-[min(100%,11rem)] object-contain object-left dark:block sm:h-14 sm:max-w-[min(100%,13rem)]"
                  
                />
              </span>
            </Link>

            <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label="Main navigation">
              {userPrimaryNav.map((item) => (
                <UserNavLink key={item.href} item={item} variant="topbar" />
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <UserProfileMenu />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 scroll-mt-0 outline-none focus:outline-none"
      >
        <div className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
