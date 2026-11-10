import { KeyRound, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export type UserNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userPrimaryNav: UserNavItem[] = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/credentials", label: "Credentials", icon: KeyRound },
  { href: "/about", label: "About", icon: Sparkles },
];
