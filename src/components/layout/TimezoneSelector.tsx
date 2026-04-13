"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useDisplayTimezone, TIMEZONE_OPTIONS } from "@/contexts/DisplayTimezoneContext";

function getOffsetLabel(ianaTimezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const label = tzName.replace(/^GMT/, "UTC");
    if (label) return label;
  } catch {}

  // Fallback: compute offset manually
  try {
    const date = new Date();
    const utcMs = Date.UTC(
      date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
      date.getUTCHours(), date.getUTCMinutes()
    );
    const localStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: ianaTimezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(date);
    const [datePart, timePart] = localStr.split(", ");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, m] = timePart.split(":").map(Number);
    const localMs = Date.UTC(y, mo - 1, d, h, m);
    const diffMin = Math.round((localMs - utcMs) / 60000);
    const sign = diffMin >= 0 ? "+" : "-";
    const absH = Math.floor(Math.abs(diffMin) / 60);
    const absM = Math.abs(diffMin) % 60;
    return absM === 0 ? `UTC${sign}${absH}` : `UTC${sign}${absH}:${String(absM).padStart(2, "0")}`;
  } catch {}

  return "UTC";
}

export function TimezoneSelector() {
  const { timezone, setTimezone, resolvedTimezone } = useDisplayTimezone();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const offsetLabel = mounted ? getOffsetLabel(resolvedTimezone) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        suppressHydrationWarning
      >
        {offsetLabel ? (
          <>
            <span>{offsetLabel}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </>
        ) : (
          <span className="opacity-50">…</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
          {TIMEZONE_OPTIONS.map((opt) => {
            const isSelected = timezone === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setTimezone(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
