import { Star } from "lucide-react";

export function CSRankingsBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
      CSRankings
      <Star className="w-3 h-3 fill-current" />
    </span>
  );
}
