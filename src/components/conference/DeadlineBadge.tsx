import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/types";

const config: Record<Urgency, { label: string; className: string }> = {
  safe:     { label: "On Track",  className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  soon:     { label: "Due Soon",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  urgent:   { label: "Urgent",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  critical: { label: "Critical",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  expired:  { label: "Closed",    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
};

export function DeadlineBadge({ urgency }: { urgency: Urgency }) {
  const { label, className } = config[urgency];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
}
