"use client";

import { MapPin, Calendar, FlaskConical, Star } from "lucide-react";
import { DeadlineLabel } from "./DeadlineLabel";
import type { Conference } from "@/lib/types";
import { CoreBadge } from "@/components/badges/CoreBadge";
import { CSRankingsBadge } from "@/components/badges/CSRankingsBadge";
import { OrganizerBadge } from "@/components/badges/OrganizerBadge";
import { OpenAccessBadge } from "@/components/badges/OpenAccessBadge";
import { CountdownDisplay } from "./CountdownDisplay";
import { CalendarDropdown } from "@/components/ui/CalendarDropdown";
import { cn, cityOnly, extractYear, isTBD } from "@/lib/utils";
import { useDisplayTimezone } from "@/contexts/DisplayTimezoneContext";
import { resolveDeadlineUTC } from "@/lib/countdown";
import { useState, useEffect, useMemo } from "react";

function AbstractNote({ isoLocal, timezone }: { isoLocal: string; timezone: string }) {
  const { timezone: selectedTZ, resolvedTimezone } = useDisplayTimezone();
  const isActualLocal = selectedTZ === "auto";
  const [displayStr, setDisplayStr] = useState<string | null>(null);

  const deadlineUTC = useMemo(
    () => (isTBD(isoLocal) ? null : resolveDeadlineUTC(isoLocal, timezone)),
    [isoLocal, timezone]
  );

  useEffect(() => {
    if (!deadlineUTC) return;
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: resolvedTimezone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZoneName: "shortOffset",
      }).formatToParts(deadlineUTC);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
      const tz = (get("timeZoneName") || "UTC").replace(/^GMT/, "UTC");
      setDisplayStr(`${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} ${tz}`);
    } catch { /* ignore */ }
  }, [deadlineUTC, resolvedTimezone]);

  if (!deadlineUTC || !displayStr) return null;

  return (
    <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
      Note: Abstract deadline on {displayStr}{isActualLocal ? " (your local time)" : ""}
    </p>
  );
}

function DomainBadge({ domain }: { domain: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold w-fit",
      "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    )}>
      {domain}
    </span>
  );
}

const domainAccent: Record<string, string> = {
  "AI":               "border-l-red-400",
  "CV & Multimedia":  "border-l-orange-400",
  "Systems":          "border-l-amber-400",
  "Networking":       "border-l-yellow-400",
  "Security":         "border-l-purple-400",
  "Data":             "border-l-blue-400",
  "SE & PL":          "border-l-cyan-400",
  "Theory":           "border-l-teal-400",
  "HCI":              "border-l-green-400",
  "Graphics & AR":    "border-l-lime-400",
  "Interdisciplinary":"border-l-gray-400",
};

interface Props {
  conference: Conference;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function ConferenceCard({ conference: c, isFavorited, onToggleFavorite }: Props) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-stretch rounded-xl border-l-4 bg-white dark:bg-gray-900",
      "border border-gray-200 dark:border-gray-800",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      domainAccent[c.domains[0]] ?? "border-l-gray-300",
    )}>

      {/* Left — info */}
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-1.5">

        {/* Title + full name */}
        <div className="flex items-center gap-1">
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-extrabold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            {c.title}{extractYear(c.date) ? ` ${extractYear(c.date)}` : ""}
          </a>
          {c.domains.map((d) => <DomainBadge key={d} domain={d} />)}
          <button
            onClick={onToggleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Star className={cn(
              "w-4 h-4 transition-colors",
              isFavorited ? "fill-yellow-400 text-yellow-400" : "text-gray-400 dark:text-gray-500"
            )} />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
          {c.full_name}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0" />
            {c.date}
          </span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {cityOnly(c.place)}
          </span>
        </div>

        {/* Abstract note */}
        {c.deadlines.abstract && (
          <AbstractNote isoLocal={c.deadlines.abstract} timezone={c.timezone} />
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {c.is_csrankings && <CSRankingsBadge />}
          <CoreBadge rank={c.rank_core} />
          <OrganizerBadge organizer={c.organizer} />
          {c.open_access && <OpenAccessBadge />}
          {c.artifact_badge && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <FlaskConical className="w-3 h-3" />
              Artifact
            </span>
          )}
        </div>
      </div>

      {/* Right — deadline */}
      <div className="flex flex-col justify-center gap-3 px-6 py-5 bg-gray-50 dark:bg-gray-800/50 sm:border-l border-t sm:border-t-0 border-gray-100 dark:border-gray-800 rounded-r-xl w-full sm:w-[460px] sm:shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CountdownDisplay isoLocal={c.deadlines.full_paper} timezone={c.timezone} />
            <CalendarDropdown conference={c} type="full_paper" />
          </div>
          <DeadlineLabel isoLocal={c.deadlines.full_paper} timezone={c.timezone} />
        </div>
      </div>

    </div>
  );
}
