import { KeyRound, Link2, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export type UserNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userPrimaryNav: UserNavItem[] = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/credentials", label: "Credentials", icon: KeyRound },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/about", label: "About", icon: Sparkles },
];
