"use client";

import { cn } from "@/lib/utils";
import {
  API_JOBS_STACKS,
  jobsStackLabel,
  type ApiJobsStack,
} from "@/types/api-jobs";

type JobsStackTabsProps = {
  activeStack: ApiJobsStack;
  onChange: (stack: ApiJobsStack) => void;
};

/** Top-level Jobs panel tabs — Shopify vs AI Full Stack. */
export function JobsStackTabs({ activeStack, onChange }: JobsStackTabsProps) {
  return (
    <div
      className="mb-4 inline-flex rounded-full border border-input bg-muted/50 p-1 shadow-sm"
      role="tablist"
      aria-label="Job stack"
    >
      {API_JOBS_STACKS.map((stack) => {
        const active = activeStack === stack;
        return (
          <button
            key={stack}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(stack)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {jobsStackLabel(stack)}
          </button>
        );
      })}
    </div>
  );
}
