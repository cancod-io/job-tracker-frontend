import type { Metadata } from "next";
import { UserVerifyEmailForm } from "@/components/auth/user-verify-email-form";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Enter the verification code sent to your email.",
};

export default function VerifyEmailPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <UserVerifyEmailForm />
    </main>
  );
}
