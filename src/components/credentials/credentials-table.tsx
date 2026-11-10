"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import {
  credentialTypeBadgeClass,
  formatCredentialDateTime,
  formatCredentialType,
  isEmailCredentialType,
  isTwoFaCredentialType,
} from "@/components/credentials/constants";
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
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        credentialTypeBadgeClass(type),
      )}
    >
      {isTwoFaCredentialType(type) ? <Shield className="size-3" aria-hidden /> : null}
      {formatCredentialType(type)}
    </span>
  );
}

function IconAction({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        tone === "danger" &&
          "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400",
      )}
    >
      {children}
    </button>
  );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      onClick={() => {
        void copyTextToClipboard(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => notify.error(`Could not copy ${label}.`));
      }}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

function UsernameCell({ username }: { username: string | null }) {
  const value = username?.trim() || null;
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      <CopyIconButton value={value} label="username" />
    </div>
  );
}

function SecretCell({ row }: { row: SecureCredential }) {
  const [secret, setSecret] = useState<string | null>(row.secret);
  const [visible, setVisible] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const isTwoFa = isTwoFaCredentialType(row.credential_type);

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
      notify.success("Secret copied");
    } catch {
      notify.error("Could not copy secret.");
    }
  }

  if (!row.has_secret) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-0.5 rounded-lg border px-1.5 py-1",
        isTwoFa ? "border-amber-500/20 bg-amber-500/[0.06]" : "border-border/70 bg-muted/40",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-xs tracking-wide text-foreground">
        {visible && secret ? secret : "••••••••••••"}
      </span>
      <button
        type="button"
        title={visible ? "Hide secret" : "Show secret"}
        aria-label={visible ? "Hide secret" : "Show secret"}
        disabled={revealing}
        onClick={() => void toggleSecret()}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-3.5" aria-hidden />
        ) : (
          <Eye className="size-3.5" aria-hidden />
        )}
      </button>
      <button
        type="button"
        title="Copy secret"
        aria-label="Copy secret"
        disabled={revealing}
        onClick={() => void copySecret()}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
      >
        <Copy className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function MobileCredentialRow({
  row,
  onEdit,
  onDelete,
}: {
  row: SecureCredential;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
}) {
  const notes = row.notes?.trim() || null;

  return (
    <li className="space-y-3 border-b border-border/60 px-4 py-3.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">{row.service_name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={row.credential_type} />
            <span className="text-[11px] text-muted-foreground">
              {formatCredentialDateTime(row.updated_at)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0">
          <IconAction label="Edit credential" onClick={() => onEdit(row)}>
            <Pencil className="size-3.5" aria-hidden />
          </IconAction>
          <IconAction label="Delete credential" tone="danger" onClick={() => onDelete(row)}>
            <Trash2 className="size-3.5" aria-hidden />
          </IconAction>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-[4.75rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isTwoFaCredentialType(row.credential_type)
              ? "Label"
              : isEmailCredentialType(row.credential_type)
                ? "Email"
                : "User"}
          </span>
          <UsernameCell username={row.username} />
        </div>
        <div className="grid grid-cols-[4.75rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isTwoFaCredentialType(row.credential_type) ? "2FA" : "Secret"}
          </span>
          <SecretCell row={row} />
        </div>
        {notes ? <p className="line-clamp-2 text-xs text-muted-foreground">{notes}</p> : null}
      </div>
    </li>
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
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="h-12 animate-pulse border-b border-border/60 bg-muted/40" />
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse border-b border-border/40 bg-muted/20 last:border-b-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground">
          <KeyRound className="size-7" aria-hidden />
        </div>
        <p className="text-base font-semibold text-foreground">
          {searchActive || filtersActive ? "Nothing matches these filters" : "Vault is empty"}
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Save a PC login, Gmail, Outlook, or 2FA key. Reveal and copy secrets from the table after
          saving.
        </p>
        {!searchActive && !filtersActive ? (
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add credential
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <ul className="divide-y divide-border/60 md:hidden">
        {items.map((row) => (
          <MobileCredentialRow key={row.id} row={row} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>

      <div className="hidden min-w-0 overflow-auto md:block">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md">
            <tr className="border-b border-border/80 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Email / username</th>
              <th className="min-w-[12rem] px-3 py-3 font-semibold">Secret</th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/50 transition-colors last:border-b-0 hover:bg-primary/[0.03]",
                  index % 2 === 1 && "bg-muted/15",
                )}
              >
                <td className="max-w-[16rem] px-4 py-3">
                  <p className="truncate font-semibold text-foreground">{row.service_name}</p>
                  {row.notes?.trim() ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {row.notes.trim()}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <TypeBadge type={row.credential_type} />
                </td>
                <td className="max-w-[12rem] px-3 py-3">
                  <UsernameCell username={row.username} />
                </td>
                <td className="max-w-[16rem] px-3 py-3">
                  <SecretCell row={row} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                  {formatCredentialDateTime(row.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center justify-end gap-0.5">
                    <IconAction label="Edit credential" onClick={() => onEdit(row)}>
                      <Pencil className="size-3.5" aria-hidden />
                    </IconAction>
                    <IconAction
                      label="Delete credential"
                      tone="danger"
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </IconAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
