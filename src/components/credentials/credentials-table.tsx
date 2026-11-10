"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { formatCredentialDateTime, formatCredentialType } from "@/components/credentials/constants";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { getSecureCredential } from "@/lib/secure-credentials-api";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { SecureCredential } from "@/types/secure-credentials";

type CredentialsTableProps = {
  items: SecureCredential[];
  loading: boolean;
  hasLoaded: boolean;
  filtersActive: boolean;
  searchActive: boolean;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
  onAdd: () => void;
};

function TypeBadge({ type }: { type: SecureCredential["credential_type"] }) {
  return (
    <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {formatCredentialType(type)}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void copyTextToClipboard(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => notify.error(`Could not copy ${label}.`));
      }}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-foreground hover:bg-muted"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CredentialCard({
  row,
  onEdit,
  onDelete,
}: {
  row: SecureCredential;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
}) {
  const [secret, setSecret] = useState<string | null>(row.secret);
  const [visible, setVisible] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const username = row.username?.trim() || null;
  const notes = row.notes?.trim() || null;

  async function loadSecret(): Promise<string | null> {
    if (secret) return secret;
    setRevealing(true);
    try {
      const detail = await getSecureCredential(row.id);
      setSecret(detail.secret);
      if (!detail.secret) notify.error("This credential has no stored secret.");
      return detail.secret;
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not reveal secret.");
      return null;
    } finally {
      setRevealing(false);
    }
  }

  async function toggleSecret() {
    if (visible) {
      setVisible(false);
      return;
    }
    const value = await loadSecret();
    if (value) setVisible(true);
  }

  async function copySecret() {
    const value = await loadSecret();
    if (!value) return;
    try {
      await copyTextToClipboard(value);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 1200);
    } catch {
      notify.error("Could not copy secret.");
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={row.credential_type} />
            <span className="text-xs text-muted-foreground">
              {formatCredentialDateTime(row.updated_at)}
            </span>
          </div>
          <h3 className="truncate text-base font-semibold text-foreground">{row.service_name}</h3>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(row)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Username
          </dt>
          <dd className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span
              className={cn("truncate", username ? "text-foreground" : "text-muted-foreground")}
            >
              {username ?? "Not set"}
            </span>
            {username ? <CopyButton value={username} label="username" /> : null}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Secret
          </dt>
          <dd className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span
              className={cn(
                "truncate font-mono text-xs",
                row.has_secret ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {!row.has_secret ? "Not set" : visible && secret ? secret : "••••••••"}
            </span>
            {row.has_secret ? (
              <>
                <button
                  type="button"
                  onClick={() => void toggleSecret()}
                  disabled={revealing}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  {visible ? (
                    <EyeOff className="size-3.5" aria-hidden />
                  ) : (
                    <Eye className="size-3.5" aria-hidden />
                  )}
                  {revealing ? "…" : visible ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => void copySecret()}
                  disabled={revealing}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  {secretCopied ? (
                    <Check className="size-3.5 text-emerald-600" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                  {secretCopied ? "Copied" : "Copy"}
                </button>
              </>
            ) : null}
          </dd>
        </div>
        {notes ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{notes}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function CredentialsTable({
  items,
  loading,
  hasLoaded,
  filtersActive,
  searchActive,
  onEdit,
  onDelete,
  onAdd,
}: CredentialsTableProps) {
  if (!hasLoaded && loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <KeyRound className="mb-3 size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          {searchActive || filtersActive
            ? "No credentials match these filters."
            : "No credentials yet."}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add a login, email, or API key. You can show and copy the secret from the card after it is
          saved.
        </p>
        {!searchActive && !filtersActive ? (
          <button
            type="button"
            onClick={onAdd}
            className="hover:bg-primary/92 mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Add Credential
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((row) => (
        <CredentialCard key={row.id} row={row} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
