"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  KeyRound,
  Mail,
  Monitor,
  Plus,
  RefreshCw,
  Shield,
  UserRound,
} from "lucide-react";
import { CredentialsDeleteConfirm } from "@/components/credentials/credentials-delete-confirm";
import {
  CredentialsFormDialog,
  type CredentialFormDefaults,
} from "@/components/credentials/credentials-form-dialog";
import { CredentialsTable } from "@/components/credentials/credentials-table";
import { EmployerDeleteConfirm } from "@/components/credentials/employer-delete-confirm";
import { EmployerFormDialog } from "@/components/credentials/employer-form-dialog";
import {
  CREDENTIAL_TYPE_FILTER_OPTIONS,
  formatCredentialType,
} from "@/components/credentials/constants";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import {
  createCredentialEmployer,
  deleteCredentialEmployer,
  listCredentialEmployers,
  updateCredentialEmployer,
} from "@/lib/credential-employers-api";
import { notify } from "@/lib/notify";
import {
  createSecureCredential,
  deleteSecureCredential,
  getCredentialTree,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
} from "@/lib/secure-credentials-api";
import { cn } from "@/lib/utils";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerUpdateRequest,
  CredentialTreeResponse,
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialUpdateRequest,
  VaultScope,
} from "@/types/secure-credentials";

type VaultTab = "personal" | "jobs";

const TYPE_ICONS: Record<CredentialType, typeof Monitor> = {
  pc_login: Monitor,
  gmail: Mail,
  outlook: Mail,
  company_email: Mail,
  two_fa_key: Shield,
  other: KeyRound,
};

export function CredentialsPanel() {
  const [tab, setTab] = useState<VaultTab>("personal");
  const [selectedEmployerId, setSelectedEmployerId] = useState<number | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");

  const [tree, setTree] = useState<CredentialTreeResponse | null>(null);
  const [employers, setEmployers] = useState<CredentialEmployer[]>([]);
  const [searchItems, setSearchItems] = useState<SecureCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<CredentialFormDefaults>({});
  const [editing, setEditing] = useState<SecureCredential | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleting, setDeleting] = useState<SecureCredential | null>(null);
  const [showEmployerCreate, setShowEmployerCreate] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<CredentialEmployer | null>(null);
  const [deletingEmployer, setDeletingEmployer] = useState<{
    id: number;
    name: string;
    credentialCount: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [treeBody, empBody] = await Promise.all([
        getCredentialTree(),
        listCredentialEmployers(),
      ]);
      setTree(treeBody);
      setEmployers(empBody.items);
    } catch (e) {
      setTree(null);
      setEmployers([]);
      setError(e instanceof Error ? e.message : "Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const skipSearchReset = useRef(true);
  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchDraft.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    if (skipSearchReset.current) {
      skipSearchReset.current = false;
      return;
    }
  }, [search]);

  useEffect(() => {
    if (!search) {
      setSearchItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const body = await listSecureCredentials({
          page: 1,
          page_size: 100,
          q: search,
          vault_scope: tab === "personal" ? "personal" : "job",
          employer_id: tab === "jobs" && selectedEmployerId ? selectedEmployerId : undefined,
          credential_type: typeFilter === "all" ? undefined : typeFilter,
        });
        if (!cancelled) setSearchItems(body.items);
      } catch {
        if (!cancelled) setSearchItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, tab, selectedEmployerId, typeFilter]);

  const selectedEmployer = useMemo(() => {
    if (selectedEmployerId == null) return null;
    return (
      tree?.jobs.employers.find((e) => e.id === selectedEmployerId) ??
      employers.find((e) => e.id === selectedEmployerId) ??
      null
    );
  }, [selectedEmployerId, tree, employers]);

  const items = useMemo(() => {
    if (search) return searchItems;
    if (!tree) return [];
    if (tab === "personal") {
      const rows = tree.personal.items;
      return typeFilter === "all" ? rows : rows.filter((r) => r.credential_type === typeFilter);
    }
    if (selectedEmployerId != null) {
      const emp = tree.jobs.employers.find((e) => e.id === selectedEmployerId);
      const rows = emp?.items ?? [];
      return typeFilter === "all" ? rows : rows.filter((r) => r.credential_type === typeFilter);
    }
    return [];
  }, [search, searchItems, tree, tab, selectedEmployerId, typeFilter]);

  const searchActive = search.length > 0;
  const filtersActive = typeFilter !== "all";

  const openCreate = (scope: VaultScope = tab === "jobs" ? "job" : "personal") => {
    setCreateDefaults({
      vaultScope: scope,
      employerId: selectedEmployerId,
    });
    setShowCreate(true);
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    await createSecureCredential(payload as SecureCredentialCreateRequest);
    notify.success("Credential saved");
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

  const handleCreateEmployer = async (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => {
    const created = await createCredentialEmployer(payload as CredentialEmployerCreateRequest);
    notify.success("Employer folder created");
    await load();
    setSelectedEmployerId(created.id);
  };

  const handleUpdateEmployer = async (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => {
    if (!editingEmployer) return;
    await updateCredentialEmployer(editingEmployer.id, payload as CredentialEmployerUpdateRequest);
    notify.success("Employer updated");
    await load();
  };

  const handleDeleteEmployer = async () => {
    if (!deletingEmployer) return;
    await deleteCredentialEmployer(deletingEmployer.id);
    notify.success("Employer deleted");
    setSelectedEmployerId(null);
    await load();
  };

  const handleInlineEmployer = async (name: string) => {
    const created = await createCredentialEmployer({ name });
    await load();
    return created;
  };

  const showingJobsList = tab === "jobs" && selectedEmployerId == null && !search;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-muted/30 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div
              className="inline-flex rounded-xl border border-border/80 bg-card p-1"
              role="tablist"
              aria-label="Vault scope"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "personal"}
                onClick={() => {
                  setTab("personal");
                  setSelectedEmployerId(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                  tab === "personal"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UserRound className="size-4" aria-hidden />
                Personal
                <span className="rounded-full bg-white/15 px-1.5 text-[10px] tabular-nums">
                  {tree?.personal.count ?? 0}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "jobs"}
                onClick={() => setTab("jobs")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                  tab === "jobs"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Briefcase className="size-4" aria-hidden />
                Jobs
                <span className="rounded-full bg-white/15 px-1.5 text-[10px] tabular-nums">
                  {tree?.jobs.credential_count ?? 0}
                </span>
              </button>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={searchDraft}
                onChange={setSearchDraft}
                placeholder="Search credentials…"
                aria-label="Search credentials"
                className="min-w-0 flex-1"
              />
              {searchActive || filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setSearch("");
                    setTypeFilter("all");
                  }}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {!showingJobsList ? (
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
                      onClick={() => setTypeFilter(opt.value)}
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
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            {tab === "jobs" && selectedEmployerId == null ? (
              <button
                type="button"
                onClick={() => setShowEmployerCreate(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold hover:bg-muted"
              >
                <Plus className="size-4" aria-hidden />
                Add employer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCreate()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="size-4" aria-hidden />
                Add Credential
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? <ErrorAlert message={error} onRetry={() => void load()} /> : null}

      {tab === "personal" && !search ? (
        <p className="text-xs text-muted-foreground">Personal › life accounts</p>
      ) : null}
      {tab === "jobs" && selectedEmployerId == null && !search ? (
        <p className="text-xs text-muted-foreground">
          Jobs › {tree?.jobs.employer_count ?? 0} employer
          {(tree?.jobs.employer_count ?? 0) === 1 ? "" : "s"}
        </p>
      ) : null}
      {tab === "jobs" && selectedEmployerId != null ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setSelectedEmployerId(null)}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Jobs
          </button>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold text-foreground">
            {selectedEmployer && "name" in selectedEmployer ? selectedEmployer.name : "Employer"}
          </span>
        </div>
      ) : null}

      {showingJobsList ? (
        <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
          {(tree?.jobs.employers.length ?? 0) === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Building2 className="mb-3 size-10 text-muted-foreground" aria-hidden />
              <p className="text-base font-semibold">No employers yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add an employer folder, then store portal logins under it.
              </p>
              <button
                type="button"
                onClick={() => setShowEmployerCreate(true)}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" aria-hidden />
                Add employer
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(tree?.jobs.employers ?? []).map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployerId(emp.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{emp.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {emp.count} credential{emp.count === 1 ? "" : "s"}
                        {emp.website_url ? ` · ${emp.website_url}` : ""}
                      </span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {emp.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {tab === "jobs" && selectedEmployerId != null ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {items.length} credential{items.length === 1 ? "" : "s"}
                {typeFilter !== "all" ? ` · ${formatCredentialType(typeFilter)}` : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const emp = employers.find((e) => e.id === selectedEmployerId);
                    if (emp) setEditingEmployer(emp);
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:underline"
                >
                  Edit employer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emp =
                      employers.find((e) => e.id === selectedEmployerId) ??
                      tree?.jobs.employers.find((e) => e.id === selectedEmployerId);
                    if (!emp) return;
                    setDeletingEmployer({
                      id: emp.id,
                      name: emp.name,
                      credentialCount:
                        "credential_count" in emp
                          ? emp.credential_count
                          : "count" in emp
                            ? emp.count
                            : 0,
                    });
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Delete employer
                </button>
              </div>
            </div>
          ) : null}

          <CredentialsTable
            items={items}
            loading={loading}
            hasLoaded={tree != null || searchItems.length > 0}
            filtersActive={filtersActive}
            searchActive={searchActive}
            showPath={searchActive}
            emptyTitle={
              searchActive || filtersActive
                ? "Nothing matches"
                : tab === "personal"
                  ? "No personal credentials yet"
                  : "No credentials in this folder"
            }
            emptyDescription={
              searchActive || filtersActive
                ? "Try another search or clear filters."
                : tab === "personal"
                  ? "Store Gmail, Outlook, PC login, or personal 2FA here. Job portals go under Jobs → an employer folder."
                  : "Add careers-portal, work email, or 2FA logins for this employer."
            }
            onEdit={(row) => void openEdit(row)}
            onDelete={setDeleting}
            onAdd={() => openCreate()}
          />
        </>
      )}

      {editLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
            <Spinner className="size-4" />
            Loading credential…
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <CredentialsFormDialog
          mode="create"
          employerOptions={employers}
          defaults={createDefaults}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          onCreateEmployerInline={handleInlineEmployer}
        />
      ) : null}

      {editing ? (
        <CredentialsFormDialog
          mode="edit"
          initial={editing}
          employerOptions={employers}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
          onCreateEmployerInline={handleInlineEmployer}
        />
      ) : null}

      {showEmployerCreate ? (
        <EmployerFormDialog
          mode="create"
          onClose={() => setShowEmployerCreate(false)}
          onSubmit={handleCreateEmployer}
        />
      ) : null}

      {editingEmployer ? (
        <EmployerFormDialog
          mode="edit"
          initial={editingEmployer}
          onClose={() => setEditingEmployer(null)}
          onSubmit={handleUpdateEmployer}
        />
      ) : null}

      {deleting ? (
        <CredentialsDeleteConfirm
          credential={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}

      {deletingEmployer ? (
        <EmployerDeleteConfirm
          employerName={deletingEmployer.name}
          credentialCount={deletingEmployer.credentialCount}
          onClose={() => setDeletingEmployer(null)}
          onConfirm={handleDeleteEmployer}
        />
      ) : null}
    </div>
  );
}
