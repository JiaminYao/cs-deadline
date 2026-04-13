import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoreRank } from "@/lib/types";

export function CoreBadge({ rank }: { rank: CoreRank }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold font-mono border",
      rank === "A*"       ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800"
      : rank === "A"      ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700"
      : rank === "B"      ? "bg-sky-100 text-sky-600 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-800"
      : rank === "C"      ? "bg-blue-50 text-blue-300 border-blue-100 dark:bg-blue-900/10 dark:text-blue-600 dark:border-blue-900"
      : "bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700"
    )}>
      {rank === "A*" ? "CORE A" : rank === "Unranked" ? "Non-CORE" : `CORE ${rank}`}
      {rank === "A*" && <Star className="w-3 h-3 fill-current" />}
    </span>
  );
}
