"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { LinksFormDialog } from "@/components/links/links-form-dialog";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/lib/notify";
import {
  createWebsiteLink,
  deleteWebsiteLink,
  listWebsiteLinks,
  updateWebsiteLink,
} from "@/lib/website-links-api";
import type {
  WebsiteLink,
  WebsiteLinkCreateRequest,
  WebsiteLinkUpdateRequest,
} from "@/types/website-links";

export function LinksPanel() {
  const [items, setItems] = useState<WebsiteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<WebsiteLink | null>(null);
  const [deleting, setDeleting] = useState<WebsiteLink | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWebsiteLinks();
      setItems(res.items);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to load links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((row) => {
      return (
        String(row.display_index).includes(needle) ||
        row.url.toLowerCase().includes(needle) ||
        (row.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, search]);

  const nextIndex = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map((r) => r.display_index)) + 1;
  }, [items]);

  const handleCreate = async (
    payload: WebsiteLinkCreateRequest | WebsiteLinkUpdateRequest,
  ) => {
    await createWebsiteLink(payload as WebsiteLinkCreateRequest);
    notify.success("Link saved");
    await load();
  };

  const handleUpdate = async (
    payload: WebsiteLinkCreateRequest | WebsiteLinkUpdateRequest,
  ) => {
    if (!editing) return;
    await updateWebsiteLink(editing.id, payload as WebsiteLinkUpdateRequest);
    notify.success("Link updated");
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteWebsiteLink(deleting.id);
      notify.success("Link deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete link.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by index, URL, or description…"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="hover:bg-primary/92 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="size-4" aria-hidden />
          Add link
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading links…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <Link2 className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">
            {items.length === 0 ? "No shared links yet" : "No links match your search"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length === 0
              ? "Add a URL with a display index. Everyone can see and edit this list."
              : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">URL</th>
                <th className="px-3 py-2.5 font-semibold">Description</th>
                <th className="px-3 py-2.5 font-semibold">Updated</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                    {row.display_index}
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-[28rem] items-center gap-1.5 truncate font-medium text-primary hover:underline"
                    >
                      <span className="truncate">{row.url}</span>
                      <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    </a>
                  </td>
                  <td className="max-w-[20rem] truncate px-3 py-2.5 text-muted-foreground">
                    {row.description?.trim() || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                    {row.updated_by_name ? `${row.updated_by_name} · ` : null}
                    {new Date(row.updated_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${row.url}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(row);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        aria-label={`Delete ${row.url}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate ? (
        <LinksFormDialog
          mode="create"
          defaultIndex={nextIndex}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <LinksFormDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      ) : null}

      {deleting ? (
        <Modal
          aria-label="Delete link confirmation"
          title="Delete link?"
          description="This removes the link from the shared list for everyone."
          onClose={() => setDeleting(null)}
          maxWidth="max-w-sm"
        >
          <div className="space-y-5">
            <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-500" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/90">
                Permanently remove{" "}
                <strong className="break-all font-semibold text-foreground">
                  {deleting.url}
                </strong>
                ?
              </p>
            </div>
            {deleteError ? (
              <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                {deleteError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteBusy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteBusy ? <Spinner className="size-3.5 border-white/30 border-t-white" /> : null}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
