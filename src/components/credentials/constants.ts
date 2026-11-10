import type { CredentialType } from "@/types/secure-credentials";

export const CREDENTIAL_TYPE_OPTIONS: { value: CredentialType; label: string }[] = [
  { value: "pc_login", label: "PC Login" },
  { value: "company_email", label: "Company Email" },
  { value: "two_fa_key", label: "2FA Key" },
  { value: "other", label: "Other" },
];

export const CREDENTIAL_TYPE_FILTER_OPTIONS: {
  value: CredentialType | "all";
  label: string;
}[] = [{ value: "all", label: "All types" }, ...CREDENTIAL_TYPE_OPTIONS];

export function formatCredentialType(type: CredentialType | string): string {
  if (type === "api_key") return "Other";
  return CREDENTIAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function formatCredentialDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const CREDENTIALS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function secretFieldCopy(type: CredentialType): {
  label: string;
  placeholderCreate: string;
  placeholderEdit: string;
  hint: string;
} {
  if (type === "two_fa_key") {
    return {
      label: "2FA secret / recovery key",
      placeholderCreate: "Authenticator secret or recovery codes",
      placeholderEdit: "Leave blank to keep existing, or type a new 2FA secret",
      hint: "Store the authenticator seed or recovery codes — not a one-time code from the app.",
    };
  }
  if (type === "company_email") {
    return {
      label: "Password",
      placeholderCreate: "Mailbox password",
      placeholderEdit: "Leave blank to keep existing, or type a new password",
      hint: "Email account password for this mailbox.",
    };
  }
  if (type === "pc_login") {
    return {
      label: "Password",
      placeholderCreate: "PC / workstation password",
      placeholderEdit: "Leave blank to keep existing, or type a new password",
      hint: "Login password for this machine or account.",
    };
  }
  return {
    label: "Password / Secret",
    placeholderCreate: "Required",
    placeholderEdit: "Leave blank to keep existing, or type a new secret",
    hint: "Any secret value for this entry.",
  };
}
