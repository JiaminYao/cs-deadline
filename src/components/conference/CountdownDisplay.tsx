"use client";

import { useMemo } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { resolveDeadlineUTC } from "@/lib/countdown";
import { isTBD } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  isoLocal: string;
  timezone: string;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownDisplay({ isoLocal, timezone }: Props) {
  const tbd = isTBD(isoLocal);
  const deadlineUTC = useMemo(
    () => (tbd ? new Date(0) : resolveDeadlineUTC(isoLocal, timezone)),
    [isoLocal, timezone, tbd]
  );

  const countdown = useCountdown(tbd ? null : deadlineUTC);

  if (tbd) {
    return <span className="font-mono text-xl text-gray-400 dark:text-gray-600 tabular-nums">TBD</span>;
  }

  if (!countdown) {
    return <span className="font-mono text-xl text-gray-400 tabular-nums">--d --h --m --s</span>;
  }

  if (countdown.expired) {
    return <span className="font-mono text-xl text-gray-400 dark:text-gray-600 tabular-nums">00m 00s</span>;
  }

  const colorClass = {
    safe:     "text-green-600 dark:text-green-400",
    soon:     "text-yellow-600 dark:text-yellow-400",
    urgent:   "text-orange-600 dark:text-orange-400",
    critical: "text-red-600 dark:text-red-400 animate-pulse",
    expired:  "text-gray-400",
  }[countdown.urgency];

  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  parts.push(`${pad2(countdown.hours)}h`);
  parts.push(`${pad2(countdown.minutes)}m`);
  parts.push(`${pad2(countdown.seconds)}s`);

  return (
    <span className={cn("font-mono text-xl font-normal tabular-nums", colorClass)}>
      {parts.join(" ")}
    </span>
  );
}
