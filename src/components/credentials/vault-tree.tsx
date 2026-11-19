"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Monitor,
  Plus,
  UserRound,
  Wrench,
} from "lucide-react";
import { countryFlagEmoji } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { CredentialTreeResponse } from "@/types/secure-credentials";

export type VaultSelection =
  | { kind: "root" }
  | { kind: "accounts" }
  | { kind: "identity"; identityId: number }
  | { kind: "devices" }
  | { kind: "apps" }
  | { kind: "jobs" }
  | { kind: "employer"; employerId: number };

type VaultTreeProps = {
  tree: CredentialTreeResponse;
  selection: VaultSelection;
  onSelect: (selection: VaultSelection) => void;
  onAddIdentity: () => void;
  onAddEmployer: () => void;
};

function Row({
  active,
  onClick,
  children,
  depth = 0,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  depth?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
    >
      {children}
    </button>
  );
}

export function VaultTree({
  tree,
  selection,
  onSelect,
  onAddIdentity,
  onAddEmployer,
}: VaultTreeProps) {
  const accountsOpen =
    selection.kind === "accounts" || selection.kind === "identity" || selection.kind === "root";
  const jobsOpen = selection.kind === "jobs" || selection.kind === "employer";

  return (
    <div className="space-y-1 text-sm">
      <Row active={selection.kind === "root"} onClick={() => onSelect({ kind: "root" })}>
        <UserRound className="size-3.5 shrink-0 opacity-80" aria-hidden />
        <span className="font-semibold">Personal</span>
        <span className="ml-auto tabular-nums opacity-80">{tree.personal.count}</span>
      </Row>

      <Row
        active={selection.kind === "accounts"}
        onClick={() => onSelect({ kind: "accounts" })}
        depth={1}
      >
        {accountsOpen ? (
          <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
        )}
        <span>Accounts</span>
        <span className="ml-auto tabular-nums opacity-70">
          {tree.personal.accounts.identity_count}
        </span>
      </Row>

      {tree.personal.accounts.identities.map((ident) => (
        <Row
          key={ident.id}
          active={selection.kind === "identity" && selection.identityId === ident.id}
          onClick={() => onSelect({ kind: "identity", identityId: ident.id })}
          depth={2}
        >
          <span className="shrink-0 text-base leading-none" aria-hidden>
            {countryFlagEmoji(ident.country_code)}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{ident.display_name}</span>
          <span className="tabular-nums opacity-70">{ident.count}</span>
        </Row>
      ))}

      <button
        type="button"
        onClick={onAddIdentity}
        className="ml-6 flex w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
      >
        <Plus className="size-3.5" aria-hidden />
        Add identity
      </button>

      <Row
        active={selection.kind === "devices"}
        onClick={() => onSelect({ kind: "devices" })}
        depth={1}
      >
        <Monitor className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <span>Devices & remote</span>
        <span className="ml-auto tabular-nums opacity-70">{tree.personal.devices.count}</span>
      </Row>

      <Row active={selection.kind === "apps"} onClick={() => onSelect({ kind: "apps" })} depth={1}>
        <Wrench className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <span>Apps & other</span>
        <span className="ml-auto tabular-nums opacity-70">{tree.personal.apps.count}</span>
      </Row>

      <div className="my-2 border-t border-border" />

      <Row active={selection.kind === "jobs"} onClick={() => onSelect({ kind: "jobs" })}>
        <Briefcase className="size-3.5 shrink-0 opacity-80" aria-hidden />
        <span className="font-semibold">Jobs</span>
        <span className="ml-auto tabular-nums opacity-80">{tree.jobs.credential_count}</span>
      </Row>

      {jobsOpen || tree.jobs.employers.length > 0
        ? tree.jobs.employers.map((emp) => (
            <Row
              key={emp.id}
              active={selection.kind === "employer" && selection.employerId === emp.id}
              onClick={() => onSelect({ kind: "employer", employerId: emp.id })}
              depth={1}
            >
              <span className="min-w-0 flex-1 truncate">{emp.name}</span>
              <span className="tabular-nums opacity-70">{emp.count}</span>
            </Row>
          ))
        : null}

      <button
        type="button"
        onClick={onAddEmployer}
        className="ml-2 flex w-[calc(100%-0.5rem)] items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
      >
        <Plus className="size-3.5" aria-hidden />
        Add employer
      </button>
    </div>
  );
}
