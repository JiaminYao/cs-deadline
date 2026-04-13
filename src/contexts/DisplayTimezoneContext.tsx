"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const TIMEZONE_OPTIONS = [
  { label: "Auto (browser local time)", value: "auto" },
  { label: "AoE (UTC−12)", value: "Etc/GMT+12" },
  { label: "Hawaii (UTC−10)", value: "Pacific/Honolulu" },
  { label: "USA/Los Angeles (UTC−8/−7)", value: "America/Los_Angeles" },
  { label: "USA/Denver (UTC−7/−6)", value: "America/Denver" },
  { label: "USA/Chicago (UTC−6/−5)", value: "America/Chicago" },
  { label: "USA/New York (UTC−5/−4)", value: "America/New_York" },
  { label: "London/Dublin (UTC+0/+1)", value: "Europe/London" },
  { label: "Paris (UTC+1/+2)", value: "Europe/Paris" },
  { label: "Dubai (UTC+4)", value: "Asia/Dubai" },
  { label: "India (UTC+5:30)", value: "Asia/Kolkata" },
  { label: "China/Singapore (UTC+8)", value: "Asia/Shanghai" },
  { label: "Japan/Korea (UTC+9)", value: "Asia/Tokyo" },
  { label: "Sydney (UTC+10/+11)", value: "Australia/Sydney" },
];

interface Ctx {
  timezone: string;        // "auto" or IANA name
  setTimezone: (tz: string) => void;
  resolvedTimezone: string; // always an IANA name, never "auto"
}

const DisplayTimezoneContext = createContext<Ctx>({
  timezone: "auto",
  setTimezone: () => {},
  resolvedTimezone: "UTC",
});

export function DisplayTimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState("auto");
  const [resolvedTimezone, setResolvedTimezone] = useState("UTC");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("display-timezone"); } catch {}
    const tz = stored ?? "auto";
    setTimezoneState(tz);
    setResolvedTimezone(
      tz === "auto" ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz
    );
  }, []);

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    setResolvedTimezone(
      tz === "auto" ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz
    );
    localStorage.setItem("display-timezone", tz);
  };

  return (
    <DisplayTimezoneContext.Provider value={{ timezone, setTimezone, resolvedTimezone }}>
      {children}
    </DisplayTimezoneContext.Provider>
  );
}

export function useDisplayTimezone() {
  return useContext(DisplayTimezoneContext);
}
