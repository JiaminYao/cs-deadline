"use client";

import { useState, useEffect, useMemo } from "react";
import { resolveDeadlineUTC } from "@/lib/countdown";
import { isTBD } from "@/lib/utils";
import { useDisplayTimezone } from "@/contexts/DisplayTimezoneContext";

interface Props {
  isoLocal: string;
  timezone: string;
}

function formatInTZ(date: Date, ianaTZ: string): { datetime: string; tzLabel: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).formatToParts(date);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    const tzLabel = (get("timeZoneName") || "UTC").replace(/^GMT/, "UTC");
    return {
      datetime: `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`,
      tzLabel,
    };
  } catch {
    return { datetime: "", tzLabel: "" };
  }
}

function formatOriginal(isoLocal: string, timezone: string): { datetime: string; tzLabel: string } {
  const datetime = isoLocal.replace("T", " ").substring(0, 19);
  return { datetime, tzLabel: timezone };
}

export function DeadlineLabel({ isoLocal, timezone }: Props) {
  const { timezone: selectedTZ, resolvedTimezone } = useDisplayTimezone();
  const isActualLocal = selectedTZ === "auto";
  const [local, setLocal] = useState<{ datetime: string; tzLabel: string } | null>(null);

  const deadlineUTC = useMemo(
    () => (isTBD(isoLocal) ? null : resolveDeadlineUTC(isoLocal, timezone)),
    [isoLocal, timezone]
  );

  useEffect(() => {
    if (!deadlineUTC) return;
    setLocal(formatInTZ(deadlineUTC, resolvedTimezone));
  }, [deadlineUTC, resolvedTimezone]);

  if (!deadlineUTC || !local) return null;

  const original = formatOriginal(isoLocal, timezone);
  const sameTime = local.datetime === original.datetime && local.tzLabel === original.tzLabel;

  return (
    <div className="flex flex-col gap-0.5 text-xs font-mono text-gray-400 dark:text-gray-600 leading-tight">
      <span>
        <span className="text-gray-400 dark:text-gray-500 not-italic font-sans">
          {isActualLocal ? "Your local " : "Displayed in "}
        </span>
        <span className="font-semibold text-gray-500 dark:text-gray-400">{local.tzLabel}</span>
        <span className="text-gray-400 dark:text-gray-500 not-italic font-sans"> Deadline: </span>
        {local.datetime}
      </span>
      {!sameTime && (
        <span>
          <span className="text-gray-400 dark:text-gray-500 not-italic font-sans">Conference </span>
          <span className="font-semibold text-gray-500 dark:text-gray-400">{original.tzLabel}</span>
          <span className="text-gray-400 dark:text-gray-500 not-italic font-sans"> Deadline: </span>
          {original.datetime}
        </span>
      )}
    </div>
  );
}
