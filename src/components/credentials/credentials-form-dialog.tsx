"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  CREDENTIAL_TYPE_OPTIONS,
  isEmailCredentialType,
  isTwoFaCredentialType,
  secretFieldCopy,
} from "@/components/credentials/constants";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  CredentialEmployer,
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialUpdateRequest,
  VaultScope,
} from "@/types/secure-credentials";

type Mode = "create" | "edit";

export type CredentialFormDefaults = {
  vaultScope?: VaultScope;
  employerId?: number | null;
};

type CredentialsFormDialogProps = {
  mode: Mode;
  initial?: SecureCredential | null;
  employerOptions: CredentialEmployer[];
  defaults?: CredentialFormDefaults;
  onClose: () => void;
  onSubmit: (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => Promise<void>;
  onCreateEmployerInline?: (name: string) => Promise<CredentialEmployer>;
};

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!value) setVisible(false);
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="new-password"
        className="form-control w-full pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Hide secret" : "Show typed secret"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

export function CredentialsFormDialog({
  mode,
  initial,
  employerOptions,
  defaults,
  onClose,
  onSubmit,
  onCreateEmployerInline,
}: CredentialsFormDialogProps) {
  const [serviceName, setServiceName] = useState(initial?.service_name ?? "");
  const [credentialType, setCredentialType] = useState<CredentialType>(
    initial?.credential_type ?? "other",
  );
  const [vaultScope, setVaultScope] = useState<VaultScope>(
    initial?.vault_scope ?? defaults?.vaultScope ?? "personal",
  );
  const [employerId, setEmployerId] = useState(
    String(
      initial?.employer_id ??
        (defaults?.employerId && defaults.employerId > 0 ? defaults.employerId : ""),
    ),
  );
  const [username, setUsername] = useState(initial?.username ?? "");
  const [secret, setSecret] = useState(initial?.secret ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [clearUsername, setClearUsername] = useState(false);
  const [clearNotes, setClearNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadedSecret, setLoadedSecret] = useState(initial?.secret ?? "");
  const [localEmployers, setLocalEmployers] = useState(employerOptions);
  const [newEmployerName, setNewEmployerName] = useState("");
  const [creatingEmployer, setCreatingEmployer] = useState(false);

  useEffect(() => {
    setLocalEmployers(employerOptions);
  }, [employerOptions]);

  useEffect(() => {
    setServiceName(initial?.service_name ?? "");
    setCredentialType(initial?.credential_type ?? "other");
    setVaultScope(initial?.vault_scope ?? defaults?.vaultScope ?? "personal");
    setEmployerId(
      String(
        initial?.employer_id ??
          (defaults?.employerId && defaults.employerId > 0 ? defaults.employerId : ""),
      ),
    );
    setUsername(initial?.username ?? "");
    setSecret(initial?.secret ?? "");
    setLoadedSecret(initial?.secret ?? "");
    setNotes(initial?.notes ?? "");
    setClearUsername(false);
    setClearNotes(false);
    setSubmitError(null);
    setNewEmployerName("");
  }, [initial, mode, defaults]);

  function clearSecretFields() {
    setUsername("");
    setSecret("");
    setLoadedSecret("");
    setNotes("");
    setClearUsername(false);
    setClearNotes(false);
  }

  function validate(): string | null {
    const name = serviceName.trim();
    if (!name) return "Service name is required.";
    if (name.length > 200) return "Service name must be at most 200 characters.";
    if (username.length > 500) return "Username must be at most 500 characters.";
    if (notes.length > 4000) return "Notes must be at most 4000 characters.";
    if (vaultScope === "job") {
      const eid = Number(employerId);
      if (!Number.isFinite(eid) || eid <= 0) {
        return "Job credentials require an employer folder.";
      }
    }
    if (mode === "create") {
      const trimmedSecret = secret.trim();
      if (!trimmedSecret) return "Secret is required.";
      if (trimmedSecret.length > 8000) return "Secret must be at most 8000 characters.";
    } else if (secret.trim().length > 8000) {
      return "Secret must be at most 8000 characters.";
    }
    return null;
  }

  async function handleCreateEmployer() {
    if (!onCreateEmployerInline) return;
    const trimmed = newEmployerName.trim();
    if (!trimmed) {
      setSubmitError("Enter an employer name to create.");
      return;
    }
    setCreatingEmployer(true);
    setSubmitError(null);
    try {
      const created = await onCreateEmployerInline(trimmed);
      setLocalEmployers((prev) =>
        [...prev.filter((e) => e.id !== created.id), created].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      );
      setEmployerId(String(created.id));
      setVaultScope("job");
      setNewEmployerName("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create employer.");
    } finally {
      setCreatingEmployer(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: SecureCredentialCreateRequest = {
          service_name: serviceName.trim(),
          credential_type: credentialType,
          vault_scope: vaultScope,
          secret: secret.trim(),
        };
        if (vaultScope === "job") payload.employer_id = Number(employerId);
        const trimmedUsername = username.trim();
        if (trimmedUsername) payload.username = trimmedUsername;
        const trimmedNotes = notes.trim();
        if (trimmedNotes) payload.notes = trimmedNotes;
        await onSubmit(payload);
      } else {
        const payload: SecureCredentialUpdateRequest = {
          service_name: serviceName.trim(),
          credential_type: credentialType,
          vault_scope: vaultScope,
        };
        if (vaultScope === "personal") {
          payload.clear_employer = true;
          payload.employer_id = null;
        } else {
          payload.employer_id = Number(employerId);
        }
        if (clearUsername) {
          payload.clear_username = true;
        } else {
          const trimmedUsername = username.trim();
          if (trimmedUsername) payload.username = trimmedUsername;
        }
        const trimmedSecret = secret.trim();
        if (trimmedSecret && trimmedSecret !== loadedSecret) {
          payload.secret = trimmedSecret;
        } else if (trimmedSecret && !loadedSecret) {
          payload.secret = trimmedSecret;
        }
        if (clearNotes) {
          payload.clear_notes = true;
        } else {
          const trimmedNotes = notes.trim();
          if (trimmedNotes) payload.notes = trimmedNotes;
        }
        await onSubmit(payload);
      }
      clearSecretFields();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save credential.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";
  const secretCopy = secretFieldCopy(credentialType);

  return (
    <Modal
      aria-label={isCreate ? "Add credential" : "Edit credential"}
      title={isCreate ? "Add Credential" : "Edit Credential"}
      description={
        isCreate
          ? "Choose Personal or Job scope, then store the login or key."
          : `Update ${initial?.service_name ?? "credential"}. Leave secret blank to keep the existing value.`
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
        autoComplete="off"
        noValidate
      >
        <div className="space-y-1.5">
          <p className="text-xs font-semibold">Scope</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setVaultScope("personal");
                setEmployerId("");
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-semibold",
                vaultScope === "personal"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setVaultScope("job")}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-semibold",
                vaultScope === "job"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              Job
            </button>
          </div>
        </div>

        {vaultScope === "job" ? (
          <div className="space-y-2">
            <label htmlFor="credential-employer" className="text-xs font-semibold">
              Employer <span className="text-rose-500">*</span>
            </label>
            <select
              id="credential-employer"
              value={employerId}
              onChange={(e) => setEmployerId(e.target.value)}
              className="form-control w-full"
              required
            >
              <option value="">Select employer…</option>
              {localEmployers.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.name}
                </option>
              ))}
            </select>
            {onCreateEmployerInline ? (
              <div className="flex gap-2">
                <input
                  value={newEmployerName}
                  onChange={(e) => setNewEmployerName(e.target.value)}
                  placeholder="Or create employer…"
                  className="form-control w-full"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateEmployer()}
                  disabled={creatingEmployer}
                  className="shrink-0 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                >
                  {creatingEmployer ? "…" : "Add"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="credential-service-name" className="text-xs font-semibold">
            Service name <span className="text-rose-500">*</span>
          </label>
          <input
            id="credential-service-name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder={
              vaultScope === "job" ? "e.g. Greenhouse portal" : "e.g. Gmail personal"
            }
            maxLength={200}
            required
            className="form-control w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="credential-type" className="text-xs font-semibold">
            Type
          </label>
          <select
            id="credential-type"
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value as CredentialType)}
            className="form-control w-full"
          >
            {CREDENTIAL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="credential-username" className="text-xs font-semibold">
            {isTwoFaCredentialType(credentialType)
              ? "Account label"
              : isEmailCredentialType(credentialType)
                ? "Email"
                : "Username / Email"}
          </label>
          <input
            id="credential-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (e.target.value) setClearUsername(false);
            }}
            placeholder={
              isTwoFaCredentialType(credentialType)
                ? "Optional — e.g. Google, GitHub"
                : credentialType === "gmail"
                  ? "name@gmail.com"
                  : credentialType === "outlook"
                    ? "name@outlook.com"
                    : isEmailCredentialType(credentialType)
                      ? "name@company.com"
                      : "Optional"
            }
            maxLength={500}
            disabled={!isCreate && clearUsername}
            autoComplete="off"
            className="form-control w-full"
          />
          {!isCreate && (initial?.has_username || Boolean(initial?.username?.trim())) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearUsername}
                onChange={(e) => {
                  setClearUsername(e.target.checked);
                  if (e.target.checked) setUsername("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear stored{" "}
              {isTwoFaCredentialType(credentialType)
                ? "label"
                : isEmailCredentialType(credentialType)
                  ? "email"
                  : "username"}
            </label>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="credential-secret" className="text-xs font-semibold">
            {secretCopy.label} {isCreate ? <span className="text-rose-500">*</span> : null}
          </label>
          <SecretInput
            id="credential-secret"
            value={secret}
            onChange={setSecret}
            required={isCreate}
            placeholder={
              isCreate
                ? secretCopy.placeholderCreate
                : initial?.has_secret && !secret
                  ? secretCopy.placeholderEdit
                  : secretCopy.placeholderCreate
            }
          />
          <p className="text-xs text-muted-foreground">
            {isCreate
              ? secretCopy.hint
              : secret
                ? "Use the eye icon to show or hide. Leave unchanged to keep it."
                : secretCopy.placeholderEdit}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="credential-notes" className="text-xs font-semibold">
            Notes
          </label>
          <textarea
            id="credential-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (e.target.value) setClearNotes(false);
            }}
            placeholder="Optional"
            maxLength={4000}
            rows={3}
            disabled={!isCreate && clearNotes}
            className={cn("form-control w-full resize-y")}
          />
          {!isCreate && (initial?.has_notes || Boolean(initial?.notes?.trim())) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearNotes}
                onChange={(e) => {
                  setClearNotes(e.target.checked);
                  if (e.target.checked) setNotes("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear stored notes
            </label>
          ) : null}
        </div>

        {submitError ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="hover:bg-primary/92 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {submitting ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
            {isCreate ? "Save Credential" : "Update Credential"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
