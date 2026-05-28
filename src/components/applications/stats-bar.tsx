import { Briefcase, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiApplication, ApiApplicationStatus } from "@/types/application";

type StatItem = {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
};

type StatsBarProps = {
  applications: ApiApplication[];
};

/**
 * Displays a 2×2 / 1×4 grid of summary stats for the Kanban pipeline.
 */
export function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const byStatus = (s: ApiApplicationStatus) =>
    applications.filter((a) => a.status === s).length;

  const stats: StatItem[] = [
    { label: "Total",        value: total,                     icon: Briefcase,   color: "text-foreground" },
    { label: "Applied",      value: byStatus("applied"),       icon: CheckCircle2, color: "text-sky-500" },
    { label: "Interviewing", value: byStatus("interviewing"),  icon: TrendingUp,  color: "text-teal-500" },
    { label: "Offer",        value: byStatus("offer"),         icon: Clock,       color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60",
              color,
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold tabular-nums leading-none text-foreground">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
