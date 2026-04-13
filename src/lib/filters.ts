import Fuse from "fuse.js";
import type { Conference, Domain, FilterState } from "./types";

const fuseOptions = {
  keys: ["title", "full_name"],
  threshold: 0.4,
  includeScore: false,
};

export function applyFilters(
  conferences: Conference[],
  filters: FilterState
): Conference[] {
  let result = conferences;

  if (filters.csrankings_only) {
    result = result.filter((c) => c.is_csrankings);
  }

  if (filters.domain !== "All") {
    result = result.filter((c) => c.domains.includes(filters.domain as Domain));
  }

  if (filters.rank !== "All") {
    result = result.filter((c) => c.rank_core === filters.rank);
  }

  if (filters.organizer !== "All") {
    result = result.filter((c) => c.organizer === filters.organizer);
  }

  if (filters.search.trim()) {
    const fuse = new Fuse(result, fuseOptions);
    result = fuse.search(filters.search.trim()).map((r) => r.item);
  }

  return result;
}
