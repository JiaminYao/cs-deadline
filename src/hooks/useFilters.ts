"use client";

import { useState, useCallback } from "react";
import type { FilterState, Domain, CoreRank, Organizer } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  domain: "All",
  rank: "All",
  organizer: "All",
  csrankings_only: false,
};

export function useFilters() {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.domain !== "All" ||
    filters.rank !== "All" ||
    filters.organizer !== "All" ||
    filters.csrankings_only;

  return { filters, setFilters, resetFilters, hasActiveFilters };
}
