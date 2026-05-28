"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/applications/kanban-board";

/**
 * `/applications` — job-application tracking pipeline.
 *
 * This page is intentionally thin: all state management and UI live in
 * `KanbanBoard` and its sub-components under `src/components/applications/`.
 */
export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="My Applications"
        description="Track your job search pipeline from first contact to offer."
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: "Applications" },
        ]}
        actions={
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <LayoutGrid className="size-4" aria-hidden />
            Browse jobs
          </Link>
        }
      />

      <KanbanBoard />
    </>
  );
}
