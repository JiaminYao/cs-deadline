import { Unlock } from "lucide-react";

export function OpenAccessBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <Unlock className="w-3 h-3" />
      Open
    </span>
  );
}
