"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Conference } from "@/lib/types";
import { applyFilters } from "@/lib/filters";
import { useFilters } from "@/hooks/useFilters";
import { useFavorites } from "@/hooks/useFavorites";
import { resolveDeadlineUTC } from "@/lib/countdown";
import { isTBD, cn } from "@/lib/utils";
import { ConferenceCard } from "./ConferenceCard";
import { FilterBar } from "@/components/filters/FilterBar";
import { ExportAllButton } from "@/components/ui/ExportAllButton";

const PAGE_SIZE = 10;

function parseConfDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "TBD") return null;
  // "May 15, 2026 - May 18, 2026" → take the start date
  const m = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  if (!m) return null;
  try {
    return new Date(m[1]);
  } catch {
    return null;
  }
}

function isExpired(c: Conference): boolean {
  const now = new Date();

  // Explicit deadline: check if it has passed
  if (!isTBD(c.deadlines.full_paper)) {
    try {
      return resolveDeadlineUTC(c.deadlines.full_paper, c.timezone) <= now;
    } catch {
      return false;
    }
  }

  // TBD deadline: treat as expired if the conference start date is within 60 days from now or already past
  // (deadline is always well before the conference itself)
  const confDate = parseConfDate(c.date);
  if (confDate) {
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    return confDate <= sixtyDaysFromNow;
  }

  return false;
}

// ── Reusable pagination bar ───────────────────────────────────────────────────

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: total }, (_, i) => i + 1).map((p) => {
        const isActive = p === page;
        const isNear = Math.abs(p - page) <= 2 || p === 1 || p === total;
        const showEllipsis = !isNear && (p === 2 || p === total - 1);
        if (showEllipsis) return <span key={p} className="w-8 text-center text-gray-400 text-sm">…</span>;
        if (!isNear) return null;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors",
              isActive
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConferenceList({ conferences }: { conferences: Conference[] }) {
  const { filters, setFilters, resetFilters, hasActiveFilters } = useFilters();
  const { favorites, toggle } = useFavorites();
  const [activePage, setActivePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [pastOpen, setPastOpen] = useState(false);

  const filtered = useMemo(() => {
    const result = applyFilters(conferences, filters);
    return [...result].sort((a, b) => {
      const aFav = favorites.has(`${a.title}-${a.date}`) ? 0 : 1;
      const bFav = favorites.has(`${b.title}-${b.date}`) ? 0 : 1;
      return aFav - bFav;
    });
  }, [conferences, filters, favorites]);

  useEffect(() => { setActivePage(1); setPastPage(1); }, [filters]);

  const active = useMemo(() => filtered.filter((c) => !isExpired(c)), [filtered]);
  const past   = useMemo(() => filtered.filter((c) =>  isExpired(c)), [filtered]);

  const activePages = Math.ceil(active.length / PAGE_SIZE);
  const pastPages   = Math.ceil(past.length   / PAGE_SIZE);

  const activePaginated = active.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const pastPaginated   = past.slice((pastPage   - 1) * PAGE_SIZE, pastPage   * PAGE_SIZE);

  function renderCards(list: Conference[]) {
    return list.map((c) => (
      <ConferenceCard
        key={`${c.title}-${c.date}`}
        conference={c}
        isFavorited={favorites.has(`${c.title}-${c.date}`)}
        onToggleFavorite={() => toggle(`${c.title}-${c.date}`)}
      />
    ));
  }

  return (
    <div className="space-y-5">
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Next Events{" "}
          <span className="text-gray-300 dark:text-gray-600 font-normal normal-case tracking-normal">
            {active.length} conferences
          </span>
        </p>
        <ExportAllButton conferences={filtered} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base">No conferences match your filters.</p>
          <button onClick={resetFilters} className="mt-2 text-sm underline hover:text-gray-700 dark:hover:text-gray-200">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Active conferences */}
          {active.length > 0 && (
            <>
              <div className="flex flex-col gap-4">
                {renderCards(activePaginated)}
              </div>
              <Pagination page={activePage} total={activePages} onChange={setActivePage} />
            </>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <div className="mt-10 space-y-4">
              <button
                onClick={() => setPastOpen((v) => !v)}
                className="flex items-center gap-2 group"
              >
                <ChevronRight className={cn(
                  "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200",
                  pastOpen && "rotate-90"
                )} />
                <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  Past Events
                </h2>
                <span className="text-xs text-gray-300 dark:text-gray-600">
                  {past.length} conferences
                </span>
              </button>

              {pastOpen && (
                <>
                  <div className="flex flex-col gap-4 opacity-60">
                    {renderCards(pastPaginated)}
                  </div>
                  <Pagination page={pastPage} total={pastPages} onChange={setPastPage} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
