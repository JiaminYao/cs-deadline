import { createEvents, type EventAttributes } from "ics";
import type { Conference } from "./types";
import { resolveDeadlineUTC } from "./countdown";

// ── External calendar URL builders ──────────────────────────────────────────

function toGoogleDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function toOutlookDate(d: Date) {
  return d.toISOString().slice(0, 19) + "Z";
}

function toYahooDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

export interface CalendarUrls {
  ical: () => void;
  google: string;
  yahoo: string;
  outlook: string;
}

export function buildCalendarUrls(
  conference: Conference,
  type: "full_paper" | "abstract"
): CalendarUrls {
  const isoLocal = type === "full_paper"
    ? conference.deadlines.full_paper
    : conference.deadlines.abstract!;
  const deadline = resolveDeadlineUTC(isoLocal, conference.timezone);
  const end = new Date(deadline.getTime() + 60 * 60 * 1000); // +1h

  const label = type === "full_paper" ? "DEADLINE" : "ABSTRACT";
  const title = encodeURIComponent(`[${label}] ${conference.title} ${conference.date}`);
  const details = encodeURIComponent(`${conference.full_name}\n${conference.link}`);
  const location = encodeURIComponent(conference.place ?? "");

  const gStart = toGoogleDate(deadline);
  const gEnd   = toGoogleDate(end);

  return {
    ical: () => downloadDeadlineICS(conference, type),
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gStart}/${gEnd}&details=${details}&location=${location}`,
    yahoo:  `https://calendar.yahoo.com/?v=60&TITLE=${title}&ST=${toYahooDate(deadline)}&DUR=0100&DESC=${details}&in_loc=${location}`,
    outlook: `https://outlook.live.com/calendar/0/action/compose?rru=addevent&startdt=${toOutlookDate(deadline)}&enddt=${toOutlookDate(end)}&subject=${title}&body=${details}&location=${location}`,
  };
}

function toICSDate(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

function buildEvents(conference: Conference): EventAttributes[] {
  const events: EventAttributes[] = [];

  const fullDeadline = resolveDeadlineUTC(
    conference.deadlines.full_paper,
    conference.timezone
  );

  events.push({
    title: `[DEADLINE] ${conference.title} ${conference.date}`,
    start: toICSDate(fullDeadline),
    duration: { hours: 1 },
    description: `${conference.full_name}\n${conference.link}`,
    url: conference.link,
    status: "CONFIRMED",
  });

  if (conference.deadlines.abstract) {
    const abstractDeadline = resolveDeadlineUTC(
      conference.deadlines.abstract,
      conference.timezone
    );
    events.push({
      title: `[ABSTRACT] ${conference.title} ${conference.date}`,
      start: toICSDate(abstractDeadline),
      duration: { hours: 1 },
      description: `Abstract deadline for ${conference.full_name}\n${conference.link}`,
      url: conference.link,
      status: "CONFIRMED",
    });
  }

  return events;
}

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDeadlineICS(conference: Conference, type: "full_paper" | "abstract") {
  const isoLocal = type === "full_paper" ? conference.deadlines.full_paper : conference.deadlines.abstract!;
  const deadline = resolveDeadlineUTC(isoLocal, conference.timezone);
  const label = type === "full_paper" ? "DEADLINE" : "ABSTRACT";
  const event: EventAttributes = {
    title: `[${label}] ${conference.title} ${conference.date}`,
    start: toICSDate(deadline),
    duration: { hours: 1 },
    description: `${conference.full_name}\n${conference.link}`,
    url: conference.link,
    status: "CONFIRMED",
  };
  const { error, value } = createEvents([event]);
  if (error || !value) return;
  downloadICS(value, `${conference.title.toLowerCase()}-${type}.ics`);
}

export function downloadConferenceICS(conference: Conference) {
  const events = buildEvents(conference);
  const { error, value } = createEvents(events);
  if (error || !value) return;
  downloadICS(value, `${conference.title.toLowerCase()}-deadlines.ics`);
}

export function downloadAllConferencesICS(conferences: Conference[]) {
  const allEvents = conferences.flatMap(buildEvents);
  const { error, value } = createEvents(allEvents);
  if (error || !value) return;
  downloadICS(value, "cs-deadlines.ics");
}
