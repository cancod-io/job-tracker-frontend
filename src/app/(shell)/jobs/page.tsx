import { Suspense } from "react";
import { JobsList, JobsListSkeleton } from "@/components/dashboard/jobs-list";
import { AppShell } from "@/components/layout/app-shell";

export default function JobsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-5 md:gap-6">
        <Suspense fallback={<JobsListSkeleton />}>
          <JobsList />
        </Suspense>
      </div>
    </AppShell>
  );
}
