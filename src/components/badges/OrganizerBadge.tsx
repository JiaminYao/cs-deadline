import { cn } from "@/lib/utils";
import type { Organizer } from "@/lib/types";

export function OrganizerBadge({ organizer }: { organizer: Organizer }) {
  if (organizer === "Other") return null;
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border",
      organizer === "ACM"
        ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700"
        : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800"
    )}>
      {organizer}
    </span>
  );
}
