"use client";

import {
  Building2,
  ChevronLeft,
  ExternalLink,
  KeyRound,
  Mail,
  Monitor,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { CredentialsTable } from "@/components/credentials/credentials-table";
import {
  CREDENTIAL_TYPE_FILTER_OPTIONS,
  formatCredentialType,
} from "@/components/credentials/constants";
import { cn } from "@/lib/utils";
import type {
  CredentialTreeEmployerNode,
  CredentialType,
  SecureCredential,
} from "@/types/secure-credentials";

const TYPE_ICONS: Record<CredentialType, typeof Monitor> = {
  pc_login: Monitor,
  gmail: Mail,
  outlook: Mail,
  company_email: Mail,
  two_fa_key: Shield,
  other: KeyRound,
};

type EmployerSummary = {
  id: number;
  name: string;
  website_url?: string | null;
  notes?: string | null;
  count: number;
};

type JobsEmployerDetailProps = {
  employer: CredentialTreeEmployerNode | EmployerSummary;
  items: SecureCredential[];
  loading: boolean;
  hasLoaded: boolean;
  typeFilter: CredentialType | "all";
  searchActive: boolean;
  filtersActive: boolean;
  onBack: () => void;
  onTypeFilter: (value: CredentialType | "all") => void;
  onAddCredential: () => void;
  onEditEmployer: () => void;
  onDeleteEmployer: () => void;
  onEditCredential: (row: SecureCredential) => void;
  onDeleteCredential: (row: SecureCredential) => void;
};

export function JobsEmployerDetail({
  employer,
  items,
  loading,
  hasLoaded,
  typeFilter,
  searchActive,
  filtersActive,
  onBack,
  onTypeFilter,
  onAddCredential,
  onEditEmployer,
  onDeleteEmployer,
  onEditCredential,
  onDeleteCredential,
}: JobsEmployerDetailProps) {
  const website = employer.website_url?.trim() || null;
  const notes = employer.notes?.trim() || null;
  const websiteHost = website ? website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/70 bg-gradient-to-r from-card via-card to-amber-500/[0.06] px-4 py-4 md:px-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          All employers
        </button>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
              <Building2 className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                {employer.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length} login{items.length === 1 ? "" : "s"}
                {typeFilter !== "all" ? ` · ${formatCredentialType(typeFilter)}` : ""}
                {" in this folder"}
              </p>
              {website && websiteHost ? (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{websiteHost}</span>
                </a>
              ) : null}
              {notes ? (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{notes}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onEditEmployer}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit folder
            </button>
            <button
              type="button"
              onClick={onDeleteEmployer}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/25 bg-card px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
            <button
              type="button"
              onClick={onAddCredential}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add login
            </button>
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter logins by type"
        >
          {CREDENTIAL_TYPE_FILTER_OPTIONS.map((opt) => {
            const active = typeFilter === opt.value;
            const Icon = opt.value === "all" ? KeyRound : TYPE_ICONS[opt.value as CredentialType];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTypeFilter(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-pressed={active}
              >
                <Icon className="size-3.5" aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/40">
        <CredentialsTable
          items={items}
          loading={loading}
          hasLoaded={hasLoaded}
          filtersActive={filtersActive}
          searchActive={searchActive}
          embedded
          emptyTitle={
            searchActive || filtersActive ? "Nothing matches" : "No logins in this folder yet"
          }
          emptyDescription={
            searchActive || filtersActive
              ? "Try another search or clear filters."
              : "Add a careers portal, work email, ATS login, or 2FA secret for this employer."
          }
          onEdit={onEditCredential}
          onDelete={onDeleteCredential}
          onAdd={onAddCredential}
          addLabel="Add login"
        />
      </div>
    </div>
  );
}
