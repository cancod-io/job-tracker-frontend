"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Mail,
  Monitor,
  Plus,
  RefreshCw,
  Shield,
} from "lucide-react";
import { CredentialsDeleteConfirm } from "@/components/credentials/credentials-delete-confirm";
import { CredentialsFormDialog } from "@/components/credentials/credentials-form-dialog";
import { CredentialsTable } from "@/components/credentials/credentials-table";
import {
  CREDENTIAL_TYPE_FILTER_OPTIONS,
  CREDENTIALS_PAGE_SIZE_OPTIONS,
  credentialTypeBadgeClass,
  formatCredentialType,
} from "@/components/credentials/constants";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/lib/notify";
import {
  createSecureCredential,
  deleteSecureCredential,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
} from "@/lib/secure-credentials-api";
import { cn } from "@/lib/utils";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

const DEFAULT_PAGE_SIZE = 50;

const TYPE_ICONS: Record<CredentialType, typeof Monitor> = {
  pc_login: Monitor,
  gmail: Mail,
  outlook: Mail,
  company_email: Mail,
  two_fa_key: Shield,
  other: KeyRound,
};

export function CredentialsPanel() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");

  const [data, setData] = useState<SecureCredentialListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SecureCredential | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleting, setDeleting] = useState<SecureCredential | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await listSecureCredentials({
        page,
        page_size: pageSize,
        q: search || undefined,
        credential_type: typeFilter === "all" ? undefined : typeFilter,
      });
      setData(body);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const skipSearchPageReset = useRef(true);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    if (skipSearchPageReset.current) {
      skipSearchPageReset.current = false;
      return;
    }
    setPage(1);
  }, [search]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<CredentialType, number>> = {};
    for (const row of data?.items ?? []) {
      counts[row.credential_type] = (counts[row.credential_type] ?? 0) + 1;
    }
    return counts;
  }, [data?.items]);

  const searchActive = search.length > 0;
  const filtersActive = typeFilter !== "all";

  const clearSearchAndFilters = () => {
    setSearchDraft("");
    setSearch("");
    setTypeFilter("all");
    setPage(1);
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    await createSecureCredential(payload as SecureCredentialCreateRequest);
    notify.success("Credential saved");
    setPage(1);
    await load();
  };

  const handleUpdate = async (
    id: number,
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    await updateSecureCredential(id, payload as SecureCredentialUpdateRequest);
    notify.success("Credential updated");
    await load();
  };

  const handleDelete = async (credential: SecureCredential) => {
    await deleteSecureCredential(credential.id);
    notify.success("Credential deleted");
    await load();
  };

  const openEdit = async (row: SecureCredential) => {
    setEditLoading(true);
    try {
      const detail = await getSecureCredential(row.id);
      setEditing(detail);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to load credential.");
    } finally {
      setEditLoading(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, (currentPage - 1) * pageSize + (data?.items.length ?? 0));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-muted/30 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={searchDraft}
                onChange={setSearchDraft}
                placeholder="Search by service name…"
                aria-label="Search credentials"
                className="min-w-0 flex-1"
              />
              {searchActive || filtersActive ? (
                <button
                  type="button"
                  onClick={clearSearchAndFilters}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter by credential type"
            >
              {CREDENTIAL_TYPE_FILTER_OPTIONS.map((opt) => {
                const active = typeFilter === opt.value;
                const Icon =
                  opt.value === "all" ? KeyRound : TYPE_ICONS[opt.value as CredentialType];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTypeFilter(opt.value);
                      setPage(1);
                    }}
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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
              aria-label="Refresh credentials"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add Credential
            </button>
          </div>
        </div>
      </div>

      {error ? <ErrorAlert message={error} onRetry={() => void load()} /> : null}

      <CredentialsTable
        items={data?.items ?? []}
        loading={loading}
        hasLoaded={data != null}
        filtersActive={filtersActive}
        searchActive={searchActive}
        onEdit={(row) => void openEdit(row)}
        onDelete={setDeleting}
        onAdd={() => setShowCreate(true)}
      />

      {editLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
            <Spinner className="size-4" />
            Loading credential…
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="tabular-nums">{rangeStart}</span> to{" "}
            <span className="tabular-nums">{rangeEnd}</span> of{" "}
            <span className="tabular-nums">{total}</span> credentials
            {loading ? (
              <Spinner className="ml-2 inline-block size-3 align-middle text-muted-foreground" />
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              >
                {CREDENTIALS_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || loading}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <CredentialsFormDialog
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <CredentialsFormDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
        />
      ) : null}

      {deleting ? (
        <CredentialsDeleteConfirm
          credential={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}
