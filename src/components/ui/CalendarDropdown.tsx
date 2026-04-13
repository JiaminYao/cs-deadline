"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { buildCalendarUrls } from "@/lib/ics";
import type { Conference } from "@/lib/types";

const CALENDAR_OPTIONS = [
  {
    key: "google",
    label: "Google Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
        <path d="M6 2h12l4 4v16H2V6L6 2z" fill="#4285F4" />
        <path d="M18 2l4 4h-4V2z" fill="#1967D2" />
        <path d="M2 6h4V2L2 6z" fill="#1967D2" />
        <rect x="6" y="10" width="12" height="2" rx="1" fill="white" />
        <rect x="6" y="14" width="8" height="2" rx="1" fill="white" />
      </svg>
    ),
  },
  {
    key: "yahoo",
    label: "Yahoo! Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#6001D2">
        <path d="M3 3h4.5l4.5 9 4.5-9H21l-7.5 13.5V21h-3v-4.5L3 3z" />
      </svg>
    ),
  },
  {
    key: "outlook",
    label: "Outlook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
        <rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4" />
        <rect x="10" y="1" width="13" height="10" rx="1.5" fill="#28A8E0" />
        <rect x="10" y="12" width="13" height="11" rx="1.5" fill="#0078D4" />
        <circle cx="8" cy="12" r="4" fill="white" />
        <circle cx="8" cy="12" r="2.5" fill="#0078D4" />
      </svg>
    ),
  },
  {
    key: "ical",
    label: "iCal (.ics)",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
        <rect x="2" y="4" width="20" height="18" rx="2" stroke="#6B7280" strokeWidth="1.5" />
        <path d="M2 9h20" stroke="#6B7280" strokeWidth="1.5" />
        <path d="M7 2v4M17 2v4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 14h4M7 17h6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

interface Props {
  conference: Conference;
  type: "full_paper" | "abstract";
}

export function CalendarDropdown({ conference, type }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const urls = open ? buildCalendarUrls(conference, type) : null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Add to calendar"
        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <CalendarPlus className="w-3.5 h-3.5" />
      </button>

      {open && urls && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 text-sm">
          {CALENDAR_OPTIONS.map(({ key, label, icon }) => {
            if (key === "ical") {
              return (
                <button
                  key={key}
                  onClick={() => { urls.ical(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {icon}
                  {label}
                </button>
              );
            }
            return (
              <a
                key={key}
                href={urls[key as "google" | "yahoo" | "outlook"]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {icon}
                {label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
