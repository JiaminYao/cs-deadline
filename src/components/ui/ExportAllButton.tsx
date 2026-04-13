"use client";

import { Download } from "lucide-react";
import { downloadAllConferencesICS } from "@/lib/ics";
import type { Conference } from "@/lib/types";

export function ExportAllButton({ conferences }: { conferences: Conference[] }) {
  return (
    <button
      onClick={() => downloadAllConferencesICS(conferences)}
      disabled={conferences.length === 0}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      Export .ics
    </button>
  );
}
