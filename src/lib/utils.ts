import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cityOnly(place: string): string {
  const parts = place.split(",").map((s) => s.trim()).filter(Boolean);
  // 4+ parts always have a venue as the first segment (e.g. "Hotel, City, State, Country")
  // 3 parts is already "City, State, Country" — keep as-is
  if (parts.length >= 4) {
    return parts.slice(1).join(", ");
  }
  return place;
}

export function extractYear(date: string): string | null {
  const m = date.match(/\b(20\d{2})\b/);
  return m ? m[1] : null;
}

export function isTBD(isoLocal: string): boolean {
  return !isoLocal || isoLocal.toUpperCase().includes("TBD");
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString + "Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
