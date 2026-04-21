"use client";

import { Star, X } from "lucide-react";
import type { FilterState, Domain, CoreRank, Organizer } from "@/lib/types";
import { SearchBox } from "./SearchBox";
import { Dropdown } from "./Dropdown";
import { cn } from "@/lib/utils";

interface Props {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const domainOptions = [
  { value: "All"            as Domain | "All", label: "All" },
  { value: "AI"             as Domain | "All", label: "AI",             activeClass: "bg-red-500 text-white border-red-500" },
  { value: "CV & Multimedia"as Domain | "All", label: "CV",             activeClass: "bg-orange-500 text-white border-orange-500" },
  { value: "Systems"        as Domain | "All", label: "Systems",        activeClass: "bg-amber-500 text-white border-amber-500" },
  { value: "Networking"     as Domain | "All", label: "Networking",     activeClass: "bg-yellow-500 text-white border-yellow-500" },
  { value: "Security"       as Domain | "All", label: "Security",       activeClass: "bg-purple-500 text-white border-purple-500" },
  { value: "Data"           as Domain | "All", label: "Data",           activeClass: "bg-blue-500 text-white border-blue-500" },
  { value: "SE & PL"        as Domain | "All", label: "SE & PL",        activeClass: "bg-cyan-500 text-white border-cyan-500" },
  { value: "Theory"         as Domain | "All", label: "Theory",         activeClass: "bg-teal-500 text-white border-teal-500" },
  { value: "HCI"            as Domain | "All", label: "HCI",            activeClass: "bg-green-500 text-white border-green-500" },
  { value: "Graphics & AR"  as Domain | "All", label: "Graphics & AR",  activeClass: "bg-lime-500 text-white border-lime-500" },
  { value: "Interdisciplinary" as Domain | "All", label: "Other",       activeClass: "bg-gray-500 text-white border-gray-500" },
];

const rankOptions = [
  { value: "All" as CoreRank | "All", label: "All" },
  { value: "A*" as CoreRank | "All", label: <span className="inline-flex items-center gap-0.5">CORE A<Star className="w-2.5 h-2.5 fill-current" /></span>, activeClass: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "A"  as CoreRank | "All", label: "CORE A",  activeClass: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "B"        as CoreRank | "All", label: "CORE B",    activeClass: "bg-sky-100 text-sky-600 border-sky-200" },
  { value: "C"        as CoreRank | "All", label: "CORE C",    activeClass: "bg-blue-50 text-blue-300 border-blue-100" },
  { value: "Unranked" as CoreRank | "All", label: "Non-CORE",  activeClass: "bg-gray-500 text-white border-gray-500" },
];

const organizerOptions = [
  { value: "All" as Organizer | "All", label: "All" },
  { value: "ACM" as Organizer | "All", label: "ACM", activeClass: "bg-green-200 text-green-900 border-green-400" },
  { value: "IEEE" as Organizer | "All", label: "IEEE", activeClass: "bg-teal-100 text-teal-800 border-teal-300" },
  { value: "Other" as Organizer | "All", label: "Other", activeClass: "bg-gray-500 text-white border-gray-500" },
];

export function FilterBar({ filters, onFilterChange, onReset, hasActiveFilters }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 shadow-sm">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBox value={filters.search} onChange={(search) => onFilterChange({ search })} />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm">
        <Dropdown label="Domain" options={domainOptions} value={filters.domain} onChange={(domain) => onFilterChange({ domain })} defaultValue="All" />
        <Dropdown label="Core Ranking" options={rankOptions} value={filters.rank} onChange={(rank) => onFilterChange({ rank })} defaultValue="All" />
        <Dropdown label="Org" options={organizerOptions} value={filters.organizer} onChange={(organizer) => onFilterChange({ organizer })} defaultValue="All" />
        <button
          onClick={() => onFilterChange({ csrankings_only: !filters.csrankings_only })}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border shrink-0",
            filters.csrankings_only
              ? "bg-violet-600 text-white border-violet-600"
              : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          CSRankings
          <Star className="w-2.5 h-2.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
