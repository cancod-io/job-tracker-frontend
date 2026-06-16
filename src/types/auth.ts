export type UserRole = "admin" | "moderator" | "user";

export type UserApprovalStatus = "pending" | "approved" | "rejected";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: UserApprovalStatus;
  email_verified: boolean;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

export type VerifyEmailPayload = {
  email: string;
  code: string;
};

export type ResendVerificationPayload = {
  email: string;
};

/** After registration: users must verify email before they can sign in. */
export type RegisterResult =
  | { status: "verify_email"; email: string }
  | { status: "pending"; email: string }
  | { status: "authenticated" };
