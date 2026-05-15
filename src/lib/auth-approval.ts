import type { AuthUser } from "@/types/auth";

export function assertUserApproved(user: AuthUser): void {
  if (user.approval_status === "pending") {
    const err = new Error(
      "Your account is pending administrator approval. You will be able to sign in after an admin approves your registration.",
    ) as Error & { code?: string };
    err.code = "PENDING_APPROVAL";
    throw err;
  }
  if (user.approval_status === "rejected") {
    const err = new Error(
      "Your account registration was not approved. Contact your administrator if you believe this is a mistake.",
    ) as Error & { code?: string };
    err.code = "ACCOUNT_REJECTED";
    throw err;
  }
}
