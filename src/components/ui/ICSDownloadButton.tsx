"use client";

import { CalendarPlus } from "lucide-react";
import { downloadConferenceICS } from "@/lib/ics";
import type { Conference } from "@/lib/types";

export function ICSDownloadButton({ conference }: { conference: Conference }) {
  return (
    <button
      onClick={() => downloadConferenceICS(conference)}
      title="Add to calendar"
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
    >
      <CalendarPlus className="w-4 h-4" />
    </button>
  );
}
