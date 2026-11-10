"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronRight, ExternalLink, Plus, Search } from "lucide-react";
import type { CredentialTreeEmployerNode } from "@/types/secure-credentials";

type JobsEmployersViewProps = {
  employers: CredentialTreeEmployerNode[];
  loading: boolean;
  onOpen: (employerId: number) => void;
  onAddEmployer: () => void;
};

export function JobsEmployersView({
  employers,
  loading,
  onOpen,
  onAddEmployer,
}: JobsEmployersViewProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employers;
    return employers.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.website_url?.toLowerCase().includes(q) ?? false) ||
        (e.notes?.toLowerCase().includes(q) ?? false),
    );
  }, [employers, query]);

  const totalLogins = employers.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-card via-card to-muted/25 px-4 py-4 md:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Jobs vault
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            Employer folders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a folder to manage that company&apos;s portals and work logins.
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {employers.length} folder{employers.length === 1 ? "" : "s"} · {totalLogins} login
            {totalLogins === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddEmployer}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add employer
        </button>
      </div>

      {employers.length > 0 ? (
        <div className="border-b border-border/60 px-4 py-3 md:px-5">
          <label className="relative block max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter employers…"
              className="form-control w-full pl-10"
              aria-label="Filter employers"
            />
          </label>
        </div>
      ) : null}

      {loading && employers.length === 0 ? (
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[4.5rem] animate-pulse border-b border-border/40 bg-muted/20 last:border-b-0"
            />
          ))}
        </div>
      ) : employers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <Building2 className="size-7" aria-hidden />
          </div>
          <p className="text-base font-semibold text-foreground">No employer folders yet</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Create a folder for each company (e.g. Acme Corp), then add Greenhouse, Workday, or
            email logins inside it.
          </p>
          <button
            type="button"
            onClick={onAddEmployer}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add employer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          No employers match “{query.trim()}”.
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {filtered.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                onClick={() => onOpen(emp.id)}
                className="group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03] md:px-5"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-foreground">
                    {emp.name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      {emp.count} login{emp.count === 1 ? "" : "s"}
                    </span>
                    {emp.website_url ? (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">
                          {emp.website_url.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                    ) : null}
                  </span>
                  {emp.notes?.trim() ? (
                    <span className="mt-1 line-clamp-1 text-xs text-muted-foreground/90">
                      {emp.notes.trim()}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {emp.count}
                  </span>
                  <ChevronRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
