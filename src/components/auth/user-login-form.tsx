"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { JOBS_PATH, REGISTER_PATH } from "@/config/auth-routes";
import { isLoginAuthError, LOGIN_ERROR_CODES, type LoginField } from "@/lib/auth-errors";
import { notify } from "@/lib/notify";
import { useAuth } from "@/providers/auth-provider";

type InvalidFields = Partial<Record<LoginField, true>>;

const MISSING_FIELDS_MESSAGE = "Email or password is missing";

function emptyInvalidFields(): InvalidFields {
  return {};
}

function notifyLoginFailure(err: unknown, setInvalidFields: (v: InvalidFields) => void) {
  if (isLoginAuthError(err)) {
    const fields = err.fields ?? [];
    if (fields.length > 0) {
      const next: InvalidFields = {};
      for (const field of fields) {
        next[field] = true;
      }
      setInvalidFields(next);
    } else {
      setInvalidFields(emptyInvalidFields());
    }

    const code = err.code ?? null;
    if (code === LOGIN_ERROR_CODES.PENDING_APPROVAL) {
      notify.warning(err.message);
    } else {
      notify.error(err.message);
    }
    return;
  }
  setInvalidFields(emptyInvalidFields());
  notify.error(err instanceof Error ? err.message : "Sign-in failed");
}

function UserLoginFormInner() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? JOBS_PATH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalidFields, setInvalidFields] = useState<InvalidFields>(emptyInvalidFields);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    }
  }, [status, router, nextPath]);

  function clearInvalidFields() {
    setInvalidFields(emptyInvalidFields());
  }

  function clearFieldInvalid(field: LoginField) {
    setInvalidFields((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateBeforeSubmit(): boolean {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setInvalidFields({ email: true, password: true });
      notify.error(MISSING_FIELDS_MESSAGE);
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearInvalidFields();
    if (!validateBeforeSubmit()) {
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    } catch (err) {
      notifyLoginFailure(err, setInvalidFields);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground" aria-busy="true">
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" />
        <p className="text-sm">
          {status === "authenticated" ? "Redirecting…" : "Checking session…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access saved jobs and application tracking with your account.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="user-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              clearFieldInvalid("email");
            }}
            className="form-control w-full"
            disabled={submitting}
            aria-invalid={invalidFields.email ? true : undefined}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="user-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value);
              clearFieldInvalid("password");
            }}
            className="form-control w-full"
            disabled={submitting}
            aria-invalid={invalidFields.password ? true : undefined}
          />
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={REGISTER_PATH}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function UserLoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        </div>
      }
    >
      <UserLoginFormInner />
    </Suspense>
  );
}
