import {
  Bookmark,
  Briefcase,
  KeyRound,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type UserNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userPrimaryNav: UserNavItem[] = [
  { href: "/jobs", label: "Jobs", icon: LayoutGrid },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/saved", label: "Saved jobs", icon: Bookmark },
  { href: "/credentials", label: "Credentials", icon: KeyRound },
  { href: "/about", label: "About", icon: Sparkles },
];
