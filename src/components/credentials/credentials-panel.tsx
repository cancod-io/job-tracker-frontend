"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { CredentialsDeleteConfirm } from "@/components/credentials/credentials-delete-confirm";
import {
  CredentialsFormDialog,
  type CredentialFormDefaults,
} from "@/components/credentials/credentials-form-dialog";
import { CredentialsTable } from "@/components/credentials/credentials-table";
import { EmployerDeleteConfirm } from "@/components/credentials/employer-delete-confirm";
import { EmployerFormDialog } from "@/components/credentials/employer-form-dialog";
import { IdentityDetail } from "@/components/credentials/identity-detail";
import { IdentityFormDialog } from "@/components/credentials/identity-form-dialog";
import { JobsEmployerDetail } from "@/components/credentials/jobs-employer-detail";
import { JobsEmployersView } from "@/components/credentials/jobs-employers-view";
import { ACCOUNT_SLOT_LABELS } from "@/components/credentials/constants";
import { VaultTree, type VaultSelection } from "@/components/credentials/vault-tree";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import {
  createCredentialIdentity,
  deleteCredentialIdentity,
  updateCredentialIdentity,
} from "@/lib/credential-identities-api";
import {
  createCredentialEmployer,
  deleteCredentialEmployer,
  listCredentialEmployers,
  updateCredentialEmployer,
} from "@/lib/credential-employers-api";
import { countryFlagEmoji } from "@/lib/countries";
import { notify } from "@/lib/notify";
import {
  createSecureCredential,
  deleteCredentialQrImage,
  deleteSecureCredential,
  getCredentialTree,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
  uploadCredentialQrImage,
} from "@/lib/secure-credentials-api";
import { cn } from "@/lib/utils";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerUpdateRequest,
  CredentialIdentity,
  CredentialIdentityCreateRequest,
  CredentialIdentityUpdateRequest,
  CredentialTreeResponse,
  CredentialType,
  CredentialQrExtras,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

export function CredentialsPanel() {
  const [selection, setSelection] = useState<VaultSelection>({ kind: "accounts" });
  const [employerTypeFilter, setEmployerTypeFilter] = useState<CredentialType | "all">("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

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

  const [showIdentityCreate, setShowIdentityCreate] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<CredentialIdentity | null>(null);
  const [deletingIdentity, setDeletingIdentity] = useState<{
    id: number;
    name: string;
    count: number;
  } | null>(null);

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

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchDraft.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

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
        });
        if (!cancelled) setSearchItems(body.items);
      } catch {
        if (!cancelled) setSearchItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const selectedIdentity = useMemo(() => {
    if (selection.kind !== "identity" || !tree) return null;
    return tree.personal.accounts.identities.find((i) => i.id === selection.identityId) ?? null;
  }, [selection, tree]);

  const selectedEmployer = useMemo(() => {
    if (selection.kind !== "employer") return null;
    return (
      tree?.jobs.employers.find((e) => e.id === selection.employerId) ??
      employers.find((e) => e.id === selection.employerId) ??
      null
    );
  }, [selection, tree, employers]);

  const searchActive = search.length > 0;

  const openCreate = (defaults: CredentialFormDefaults = {}) => {
    setCreateDefaults(defaults);
    setShowCreate(true);
  };

  const openCreateForSelection = () => {
    if (selection.kind === "employer") {
      openCreate({ vaultScope: "job", employerId: selection.employerId });
      return;
    }
    if (selection.kind === "devices") {
      openCreate({
        vaultScope: "personal",
        credentialType: "pc_login",
        serviceName: "PC Login",
      });
      return;
    }
    if (selection.kind === "apps") {
      openCreate({ vaultScope: "personal", credentialType: "other" });
      return;
    }
    if (selection.kind === "identity") {
      openCreate({
        vaultScope: "personal",
        identityId: selection.identityId,
      });
      return;
    }
    openCreate({ vaultScope: "personal" });
  };

  const applyQrExtras = async (credentialId: number, extras?: CredentialQrExtras) => {
    if (extras?.qrFile) {
      await uploadCredentialQrImage(credentialId, extras.qrFile);
    } else if (extras?.removeQr) {
      await deleteCredentialQrImage(credentialId);
    }
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
    extras?: CredentialQrExtras,
  ) => {
    const created = await createSecureCredential(payload as SecureCredentialCreateRequest);
    await applyQrExtras(created.id, extras);
    notify.success("Credential saved");
    await load();
  };

  const handleUpdate = async (
    id: number,
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
    extras?: CredentialQrExtras,
  ) => {
    await updateSecureCredential(id, payload as SecureCredentialUpdateRequest);
    await applyQrExtras(id, extras);
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

  const handleCreateIdentity = async (
    payload: CredentialIdentityCreateRequest | CredentialIdentityUpdateRequest,
  ) => {
    const created = await createCredentialIdentity(payload as CredentialIdentityCreateRequest);
    notify.success("Identity created");
    await load();
    setSelection({ kind: "identity", identityId: created.id });
  };

  const handleUpdateIdentity = async (
    payload: CredentialIdentityCreateRequest | CredentialIdentityUpdateRequest,
  ) => {
    if (!editingIdentity) return;
    await updateCredentialIdentity(editingIdentity.id, payload as CredentialIdentityUpdateRequest);
    notify.success("Identity updated");
    await load();
  };

  const handleDeleteIdentity = async () => {
    if (!deletingIdentity) return;
    await deleteCredentialIdentity(deletingIdentity.id);
    notify.success("Identity deleted");
    setSelection({ kind: "accounts" });
    await load();
  };

  const handleCreateEmployer = async (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => {
    const created = await createCredentialEmployer(payload as CredentialEmployerCreateRequest);
    notify.success("Employer folder created");
    await load();
    setSelection({ kind: "employer", employerId: created.id });
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
    setSelection({ kind: "jobs" });
    await load();
  };

  const handleInlineEmployer = async (name: string) => {
    const created = await createCredentialEmployer({ name });
    await load();
    return created;
  };

  const identityToFormModel = (node: NonNullable<typeof selectedIdentity>): CredentialIdentity => ({
    id: node.id,
    owner_user_id: tree?.owner_user_id ?? 0,
    owner_name: tree?.owner_name ?? null,
    display_name: node.display_name,
    country_code: node.country_code,
    notes: node.notes,
    credential_count: node.count,
    created_at: "",
    updated_at: "",
  });

  const showPrimaryAdd =
    selection.kind === "devices" ||
    selection.kind === "apps" ||
    selection.kind === "employer" ||
    searchActive;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-muted/30 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Credentials vault</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Identities with country flags, account slots, devices, apps, and job employers.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={searchDraft}
                onChange={setSearchDraft}
                placeholder="Search all credentials…"
                aria-label="Search credentials"
                className="min-w-0 flex-1"
              />
              {searchActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setSearch("");
                  }}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
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
            {showPrimaryAdd ? (
              <button
                type="button"
                onClick={() => openCreateForSelection()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="size-4" aria-hidden />
                Add Credential
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <ErrorAlert message={error} onRetry={() => void load()} /> : null}

      {searchActive ? (
        <CredentialsTable
          items={searchItems}
          loading={false}
          hasLoaded
          filtersActive={false}
          searchActive
          showPath
          emptyTitle="No credentials match"
          emptyDescription="Try another search term."
          onEdit={(row) => void openEdit(row)}
          onDelete={setDeleting}
          onAdd={() => openCreate({ vaultScope: "personal" })}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border/70 bg-card p-3">
            {tree ? (
              <VaultTree
                tree={tree}
                selection={selection}
                onSelect={setSelection}
                onAddIdentity={() => setShowIdentityCreate(true)}
                onAddEmployer={() => setShowEmployerCreate(true)}
              />
            ) : loading ? (
              <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading…
              </div>
            ) : (
              <p className="px-2 py-4 text-sm text-muted-foreground">No vault data.</p>
            )}
          </aside>

          <section className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
            {loading && !tree ? (
              <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading vault…
              </div>
            ) : null}

            {tree && selection.kind === "root" ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Personal vault</h2>
                <p className="text-sm text-muted-foreground">
                  {tree.personal.count} credential
                  {tree.personal.count === 1 ? "" : "s"} across identities, devices, and apps.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        kind: "accounts" as const,
                        label: "Accounts",
                        count: tree.personal.accounts.identity_count,
                      },
                      {
                        kind: "devices" as const,
                        label: "Devices",
                        count: tree.personal.devices.count,
                      },
                      {
                        kind: "apps" as const,
                        label: "Apps",
                        count: tree.personal.apps.count,
                      },
                    ] as const
                  ).map((card) => (
                    <button
                      key={card.kind}
                      type="button"
                      onClick={() => setSelection({ kind: card.kind })}
                      className="rounded-xl border border-border bg-muted/20 p-4 text-left hover:border-primary/40 hover:bg-primary/5"
                    >
                      <p className="text-sm font-semibold">{card.label}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{card.count}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {tree && selection.kind === "accounts" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Accounts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Named identities with typed slots (Gmail, 2FA, LinkedIn…).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIdentityCreate(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add identity
                  </button>
                </div>
                {tree.personal.accounts.identities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    No identities yet. Add one to start filling account slots.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {tree.personal.accounts.identities.map((ident) => (
                      <li key={ident.id}>
                        <button
                          type="button"
                          onClick={() => setSelection({ kind: "identity", identityId: ident.id })}
                          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span className="text-xl leading-none" aria-hidden>
                            {countryFlagEmoji(ident.country_code)}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {ident.display_name}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {ident.count}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {tree && selection.kind === "identity" && selectedIdentity ? (
              <IdentityDetail
                identity={selectedIdentity}
                onEditIdentity={() => setEditingIdentity(identityToFormModel(selectedIdentity))}
                onDeleteIdentity={() =>
                  setDeletingIdentity({
                    id: selectedIdentity.id,
                    name: selectedIdentity.display_name,
                    count: selectedIdentity.count,
                  })
                }
                onAddSlot={(slot: CredentialType) =>
                  openCreate({
                    vaultScope: "personal",
                    identityId: selectedIdentity.id,
                    credentialType: slot,
                    serviceName: ACCOUNT_SLOT_LABELS[slot] ?? slot,
                  })
                }
                onEditCredential={(row) => void openEdit(row)}
                onDeleteCredential={setDeleting}
              />
            ) : null}

            {tree && selection.kind === "identity" && !selectedIdentity ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Identity not found. It may have been deleted.
              </p>
            ) : null}

            {tree && selection.kind === "devices" ? (
              <CredentialsTable
                items={tree.personal.devices.items}
                loading={loading}
                hasLoaded
                filtersActive={false}
                searchActive={false}
                embedded
                emptyTitle="No devices yet"
                emptyDescription="Add PC logins or AnyDesk remote access entries here."
                addLabel="Add device"
                onEdit={(row) => void openEdit(row)}
                onDelete={setDeleting}
                onAdd={() =>
                  openCreate({
                    vaultScope: "personal",
                    credentialType: "pc_login",
                    serviceName: "PC Login",
                  })
                }
              />
            ) : null}

            {tree && selection.kind === "apps" ? (
              <CredentialsTable
                items={tree.personal.apps.items}
                loading={loading}
                hasLoaded
                filtersActive={false}
                searchActive={false}
                embedded
                emptyTitle="No apps yet"
                emptyDescription="Store WhatsApp, tools, and other app logins here."
                addLabel="Add app"
                onEdit={(row) => void openEdit(row)}
                onDelete={setDeleting}
                onAdd={() => openCreate({ vaultScope: "personal", credentialType: "other" })}
              />
            ) : null}

            {tree && selection.kind === "jobs" ? (
              <JobsEmployersView
                employers={tree.jobs.employers}
                loading={loading}
                onOpen={(employerId) => setSelection({ kind: "employer", employerId })}
                onAddEmployer={() => setShowEmployerCreate(true)}
              />
            ) : null}

            {tree && selection.kind === "employer" && selectedEmployer ? (
              <JobsEmployerDetail
                employer={{
                  id: selectedEmployer.id,
                  name: selectedEmployer.name,
                  website_url: selectedEmployer.website_url,
                  notes: selectedEmployer.notes,
                  count:
                    "count" in selectedEmployer
                      ? selectedEmployer.count
                      : selectedEmployer.credential_count,
                }}
                items={("items" in selectedEmployer && Array.isArray(selectedEmployer.items)
                  ? selectedEmployer.items
                  : []
                ).filter(
                  (row) =>
                    employerTypeFilter === "all" || row.credential_type === employerTypeFilter,
                )}
                loading={loading}
                hasLoaded
                typeFilter={employerTypeFilter}
                searchActive={false}
                filtersActive={employerTypeFilter !== "all"}
                onBack={() => {
                  setEmployerTypeFilter("all");
                  setSelection({ kind: "jobs" });
                }}
                onTypeFilter={setEmployerTypeFilter}
                onAddCredential={() =>
                  openCreate({
                    vaultScope: "job",
                    employerId: selectedEmployer.id,
                  })
                }
                onEditEmployer={() => {
                  const emp = employers.find((e) => e.id === selectedEmployer.id);
                  if (emp) setEditingEmployer(emp);
                }}
                onDeleteEmployer={() => {
                  setDeletingEmployer({
                    id: selectedEmployer.id,
                    name: selectedEmployer.name,
                    credentialCount:
                      "count" in selectedEmployer
                        ? selectedEmployer.count
                        : selectedEmployer.credential_count,
                  });
                }}
                onEditCredential={(row) => void openEdit(row)}
                onDeleteCredential={setDeleting}
              />
            ) : null}
          </section>
        </div>
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
          onSubmit={(payload, extras) => handleUpdate(editing.id, payload, extras)}
          onCreateEmployerInline={handleInlineEmployer}
        />
      ) : null}

      {showIdentityCreate ? (
        <IdentityFormDialog
          mode="create"
          onClose={() => setShowIdentityCreate(false)}
          onSubmit={handleCreateIdentity}
        />
      ) : null}

      {editingIdentity ? (
        <IdentityFormDialog
          mode="edit"
          initial={editingIdentity}
          onClose={() => setEditingIdentity(null)}
          onSubmit={handleUpdateIdentity}
        />
      ) : null}

      {deletingIdentity ? (
        <IdentityDeleteConfirm
          name={deletingIdentity.name}
          count={deletingIdentity.count}
          onClose={() => setDeletingIdentity(null)}
          onConfirm={handleDeleteIdentity}
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

function IdentityDeleteConfirm({
  name,
  count,
  onClose,
  onConfirm,
}: {
  name: string;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      aria-label="Delete identity confirmation"
      title="Delete identity?"
      description="This cannot be undone."
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground/90">
          Permanently remove <strong>{name}</strong>
          {count > 0 ? ` and unlink ${count} credential${count === 1 ? "" : "s"} from it` : ""}?
        </p>
        {err ? (
          <p role="alert" className="text-sm text-rose-600">
            {err}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
