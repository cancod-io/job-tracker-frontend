"use client";

import { useState } from "react";
import { KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  formatCredentialDateTime,
  formatCredentialType,
} from "@/components/credentials/constants";
import { Spinner } from "@/components/ui/spinner";
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

function MaskedCell({ present, mask }: { present: boolean; mask: string }) {
  if (!present) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="font-mono text-xs tracking-wider text-muted-foreground" aria-label="Configured">
      {mask}
    </span>
  );
}

function UsernameCell({ row }: { row: SecureCredential }) {
  const value = row.username?.trim();
  if (value) {
    return <span className="truncate text-foreground">{value}</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: SecureCredential;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="hidden justify-end gap-1 sm:flex">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
          aria-label={`Edit credential ${row.service_name}`}
          title="Edit"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-1.5 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          aria-label={`Delete credential ${row.service_name}`}
          title="Delete"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
          aria-label={`Actions for ${row.service_name}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10"
              aria-label="Close actions menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 min-w-[8rem] rounded-lg border border-border bg-card py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(row);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(row);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function EmptyState({
  filtersActive,
  searchActive,
  onAdd,
}: {
  filtersActive: boolean;
  searchActive: boolean;
  onAdd: () => void;
}) {
  const filtered = filtersActive || searchActive;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <KeyRound className="size-7" aria-hidden />
      </div>
      <p className="text-base font-medium text-foreground">
        {filtered ? "No credentials found" : "No credentials yet"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "No credentials match the current search or filters."
          : "Store a PC login, company email, or API key securely. Secrets are write-only."}
      </p>
      {!filtered ? (
        <button
          type="button"
          onClick={onAdd}
          className="hover:bg-primary/92 mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="size-4" aria-hidden />
          Add Credential
        </button>
      ) : null}
    </div>
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
  const isEmpty = hasLoaded && items.length === 0;

  if (loading && !hasLoaded) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-4 py-16 text-sm text-muted-foreground shadow-sm">
        <Spinner className="size-4" />
        Loading credentials…
      </div>
    );
  }

  if (isEmpty && !loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <EmptyState filtersActive={filtersActive} searchActive={searchActive} onAdd={onAdd} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((row) => (
          <article
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => onEdit(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(row);
              }
            }}
            className="cursor-pointer rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
            aria-label={`Edit credential ${row.service_name}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.service_name}</p>
                <div className="mt-2">
                  <TypeBadge type={row.credential_type} />
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Username</dt>
                  <dd>
                    <UsernameCell row={row} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Secret</dt>
                  <dd>
                    <MaskedCell present={row.has_secret} mask="••••••••" />
                  </dd>
                </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="font-medium text-foreground">
                  {formatCredentialDateTime(row.updated_at)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Service Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Secret</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => onEdit(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEdit(row);
                  }
                }}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
                aria-label={`Edit credential ${row.service_name}`}
              >
                <td className="max-w-[16rem] truncate px-4 py-3 align-middle font-medium text-foreground">
                  {row.service_name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  <TypeBadge type={row.credential_type} />
                </td>
                <td className="max-w-[14rem] truncate px-4 py-3 align-middle">
                  <UsernameCell row={row} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  <MaskedCell present={row.has_secret} mask="••••••••" />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle tabular-nums text-muted-foreground">
                  {formatCredentialDateTime(row.updated_at)}
                </td>
                <td
                  className="px-4 py-3 align-middle text-right"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
