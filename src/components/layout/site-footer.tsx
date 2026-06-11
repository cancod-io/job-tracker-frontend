import Link from "next/link";
import { JOBS_PATH } from "@/config/auth-routes";
import { userPrimaryNav } from "@/config/user-nav";

type FooterLink = { href: string; label: string };

const COMPANY_LINKS: FooterLink[] = [
  { href: "/about", label: "About us" },
  { href: "/about#team", label: "Meet the team" },
  { href: "/profile", label: "Your profile" },
];

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href={JOBS_PATH} className="inline-flex items-center" aria-label="TrackCod home">
              <img
                src="/light-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                className="h-10 w-auto object-contain object-left dark:hidden"
              />
              <img
                src="/dark-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                className="hidden h-10 w-auto object-contain object-left dark:block"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The home for Shopify careers — aggregate, curate, and track jobs across the entire
              Shopify ecosystem, all in one place.
            </p>
          </div>

          {/* Navigate */}
          <nav aria-label="Footer navigation">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Navigate
            </p>
            <ul className="space-y-2.5">
              {userPrimaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Company
            </p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} TrackCod. All rights reserved.</p>
          <p>Driven by TrackCod Innovators.</p>
        </div>
      </div>
    </footer>
  );
}
