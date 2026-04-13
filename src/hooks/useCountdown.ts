"use client";

import { useState, useEffect } from "react";
import { computeCountdown } from "@/lib/countdown";
import type { CountdownResult } from "@/lib/types";

export function useCountdown(deadlineUTC: Date | null): CountdownResult | null {
  const [result, setResult] = useState<CountdownResult | null>(null);

  useEffect(() => {
    if (!deadlineUTC) return;
    const tick = () => setResult(computeCountdown(deadlineUTC));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineUTC]);

  return result;
}
