"use client";

import { useState, useEffect } from "react";

export function LocalTimezoneLabel() {
  const [tzLabel, setTzLabel] = useState<string | null>(null);

  useEffect(() => {
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const absH = Math.floor(Math.abs(offsetMin) / 60);
    const absM = Math.abs(offsetMin) % 60;
    const label = absM === 0
      ? `UTC${sign}${absH}`
      : `UTC${sign}${String(absH).padStart(2, "0")}:${String(absM).padStart(2, "0")}`;
    setTzLabel(label);
  }, []);

  return (
    <span className="font-semibold text-gray-700 dark:text-gray-300">
      {tzLabel ?? "local time"}
    </span>
  );
}
