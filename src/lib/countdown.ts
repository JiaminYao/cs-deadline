import type { CountdownResult, Urgency } from "./types";

/**
 * Parses a timezone string like "AoE", "UTC", "UTC-5", "UTC+8"
 * and returns the offset in hours to add to local time to get UTC.
 * AoE = UTC-12, so we add 12 to get UTC.
 */
// Returns the standard UTC offset in hours (e.g. AoE=UTC-12 → -12, UTC+8 → +8).
// Final conversion: UTC = local - offset  →  new Date(base - offset * 3600000)
function parseTimezoneOffsetHours(timezone: string): number {
  if (timezone === "AoE") return -12; // UTC-12 → base - (-12h) = base + 12h ✓
  if (timezone === "UTC") return 0;

  const match = timezone.match(/^UTC([+-])(\d+)$/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    return sign * parseInt(match[2], 10);
  }

  return 0;
}

/**
 * Given a naive ISO local datetime string (e.g. "2025-05-15T23:59:00")
 * and a timezone label, returns the corresponding UTC Date.
 */
export function resolveDeadlineUTC(isoLocal: string, timezone: string): Date {
  // Parse as if it were UTC first, then adjust
  const base = new Date(isoLocal + "Z");
  const offsetHours = parseTimezoneOffsetHours(timezone);
  return new Date(base.getTime() - offsetHours * 3_600_000);
}

function getUrgency(remainingMs: number): Urgency {
  if (remainingMs <= 0) return "expired";
  const days = remainingMs / 86_400_000;
  if (days < 1) return "critical";
  if (days < 7) return "urgent";
  if (days < 14) return "soon";
  return "safe";
}

function fmtDatetime(date: Date, offsetHours: number): string {
  // Apply offset to UTC to get local time
  const local = new Date(date.getTime() + offsetHours * 3_600_000);
  const Y = local.getUTCFullYear();
  const M = String(local.getUTCMonth() + 1).padStart(2, "0");
  const D = String(local.getUTCDate()).padStart(2, "0");
  const h = String(local.getUTCHours()).padStart(2, "0");
  const m = String(local.getUTCMinutes()).padStart(2, "0");
  const s = String(local.getUTCSeconds()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/**
 * Returns a human-readable deadline label, e.g.:
 * "2026-05-29 06:59:59 UTC-5 (2026-05-28 23:59:59 AoE)"
 */
export function formatDeadlineLabel(isoLocal: string, timezone: string): string {
  const utc = resolveDeadlineUTC(isoLocal, timezone);
  const origOffset = parseTimezoneOffsetHours(timezone);
  const origStr = fmtDatetime(utc, origOffset);
  const tzLabel = timezone === "AoE" ? "AoE" : timezone;

  // AoE = UTC-12
  const aoeStr = fmtDatetime(utc, -12);

  if (timezone === "AoE") {
    return `${origStr} AoE`;
  }
  return `${origStr} ${tzLabel} (${aoeStr} AoE)`;
}

export function computeCountdown(deadlineUTC: Date): CountdownResult {
  const remaining = deadlineUTC.getTime() - Date.now();

  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, urgency: "expired", expired: true };
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return {
    days,
    hours,
    minutes,
    seconds,
    urgency: getUrgency(remaining),
    expired: false,
  };
}
