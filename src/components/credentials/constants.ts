import type { CredentialType } from "@/types/secure-credentials";

export const CREDENTIAL_TYPE_OPTIONS: { value: CredentialType; label: string }[] = [
  { value: "pc_login", label: "PC Login" },
  { value: "company_email", label: "Company Email" },
  { value: "api_key", label: "API Key" },
  { value: "other", label: "Other" },
];

export const CREDENTIAL_TYPE_FILTER_OPTIONS: {
  value: CredentialType | "all";
  label: string;
}[] = [{ value: "all", label: "All types" }, ...CREDENTIAL_TYPE_OPTIONS];

export function formatCredentialType(type: CredentialType): string {
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
