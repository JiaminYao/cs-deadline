import type { Conference } from "./types";
import { resolveDeadlineUTC } from "./countdown";
import { isTBD } from "./utils";
import rawData from "../../data/conferences.json";

export function loadConferences(): Conference[] {
  const conferences = rawData as Conference[];
  const now = Date.now();

  return [...conferences].sort((a, b) => {
    const aTBD = isTBD(a.deadlines.full_paper);
    const bTBD = isTBD(b.deadlines.full_paper);

    const aDeadline = aTBD ? Infinity : resolveDeadlineUTC(a.deadlines.full_paper, a.timezone).getTime();
    const bDeadline = bTBD ? Infinity : resolveDeadlineUTC(b.deadlines.full_paper, b.timezone).getTime();

    const aExpired = !aTBD && aDeadline < now;
    const bExpired = !bTBD && bDeadline < now;

    // Expired → bottom
    if (aExpired !== bExpired) return aExpired ? 1 : -1;
    // Both expired: sort by deadline descending (most recently expired first)
    if (aExpired && bExpired) return bDeadline - aDeadline;

    // TBD → second to last (before expired)
    if (aTBD !== bTBD) return aTBD ? 1 : -1;

    // Normal: earliest deadline first
    return aDeadline - bDeadline;
  });
}
