"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cs-deadlines-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggle = useCallback((title: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  return { favorites, toggle };
}
