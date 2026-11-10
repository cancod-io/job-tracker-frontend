"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LOGIN_PATH } from "@/config/auth-routes";
import { isVerificationAuthError, VERIFICATION_ERROR_CODES } from "@/lib/auth-errors";
import {
  RESEND_COOLDOWN_SECONDS,
  resendVerificationRequest,
  VERIFICATION_CODE_LENGTH,
  verifyEmailRequest,
} from "@/lib/auth-verification-api";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

function verificationErrorMessage(err: unknown): string {
  if (isVerificationAuthError(err)) {
    switch (err.code) {
      case VERIFICATION_ERROR_CODES.INVALID_VERIFICATION_CODE:
        return "Incorrect code. Check the email and try again.";
      case VERIFICATION_ERROR_CODES.VERIFICATION_CODE_EXPIRED:
        return "That code has expired. Request a new one and try again.";
      case VERIFICATION_ERROR_CODES.VERIFICATION_CODE_ATTEMPTS_EXCEEDED:
        return "Too many incorrect attempts. Request a new code to continue.";
      case VERIFICATION_ERROR_CODES.VERIFICATION_CODE_THROTTLED:
        return `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting another code.`;
      default:
        return err.message;
    }
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

function shouldPromptResend(err: unknown): boolean {
  if (!isVerificationAuthError(err)) return false;
  return (
    err.code === VERIFICATION_ERROR_CODES.VERIFICATION_CODE_EXPIRED ||
    err.code === VERIFICATION_ERROR_CODES.VERIFICATION_CODE_ATTEMPTS_EXCEEDED ||
    err.code === VERIFICATION_ERROR_CODES.VERIFICATION_CODE_THROTTLED
  );
}

function UserVerifyEmailFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";

  const [email] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeInvalid, setCodeInvalid] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (!emailFromQuery) {
      router.replace(LOGIN_PATH);
    }
  }, [emailFromQuery, router]);

  async function handleResend() {
    if (!email || resending || resendCooldown > 0) return;
    setResending(true);
    try {
      const message = await resendVerificationRequest({ email });
      notify.success(message);
      startResendCooldown();
      setCode("");
      setCodeInvalid(false);
    } catch (err) {
      notify.error(verificationErrorMessage(err));
      if (shouldPromptResend(err)) {
        startResendCooldown();
      }
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCodeInvalid(false);

    const trimmedCode = code.trim();
    if (trimmedCode.length !== VERIFICATION_CODE_LENGTH) {
      setCodeInvalid(true);
      notify.error(`Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email.`);
      return;
    }

    setSubmitting(true);
    try {
      const message = await verifyEmailRequest({ email, code: trimmedCode });
      setVerified(true);
      notify.success(message);
    } catch (err) {
      setCodeInvalid(true);
      notify.error(verificationErrorMessage(err));
      if (shouldPromptResend(err)) {
        startResendCooldown();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!emailFromQuery) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="mx-auto w-full max-w-md space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Email verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email ({email}) is confirmed. You can now sign in to your account.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-6 text-sm text-emerald-950 dark:text-emerald-100 md:p-8">
          <p className="font-medium text-foreground">What happens next</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Sign in with the email and password you registered with.</li>
            <li>
              If your organization requires admin approval, you may still need to wait before access
              is granted.
            </li>
          </ul>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={LOGIN_PATH}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Continue to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a {VERIFICATION_CODE_LENGTH}-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>. Enter it below to activate
          your account.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="verify-code" className="text-sm font-medium text-foreground">
            Verification code
          </label>
          <input
            id="verify-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={VERIFICATION_CODE_LENGTH}
            value={code}
            onChange={(ev) => {
              const next = ev.target.value.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH);
              setCode(next);
              setCodeInvalid(false);
            }}
            className={cn(
              "form-control w-full text-center text-lg tracking-[0.35em]",
              codeInvalid && "border-destructive",
            )}
            disabled={submitting}
            aria-invalid={codeInvalid ? true : undefined}
            placeholder={"0".repeat(VERIFICATION_CODE_LENGTH)}
          />
          <p className="text-xs text-muted-foreground">
            Codes expire after 15 minutes. During testing, check the backend server logs if email
            delivery is not configured yet.
          </p>
        </div>

        <button
          type="submit"
          className="hover:bg-primary/92 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2
                className="mr-2 size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              Verifying…
            </>
          ) : (
            "Verify email"
          )}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || resendCooldown > 0}
            className="font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={LOGIN_PATH}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function UserVerifyEmailForm() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        </div>
      }
    >
      <UserVerifyEmailFormInner />
    </Suspense>
  );
}
