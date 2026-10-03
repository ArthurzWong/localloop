"use client";

import { useEffect, useState } from "react";
import { isOpenNow, todayHoursLabel } from "@/lib/geo";
import type { BusinessHours } from "@/lib/types";

/**
 * Open/closed depends on the visitor's clock, so it is resolved on the client
 * after mount — the server must not guess and cause a hydration mismatch.
 */
export default function OpenStatus({
  hours,
  className = "",
}: {
  hours: BusinessHours;
  className?: string;
}) {
  const [state, setState] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setState({ open: isOpenNow(hours, now), label: todayHoursLabel(hours, now) });
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [hours]);

  if (!state) {
    return <span className={`ll-chip ${className}`}>Hours · {hours.open}–{hours.close}</span>;
  }

  return (
    <span
      className={`ll-chip ${
        state.open ? "border-moss/30 bg-moss-soft text-moss" : "border-line bg-parchment text-muted"
      } ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${state.open ? "bg-moss" : "bg-muted"}`} />
      {state.open ? "Open now" : "Closed now"} · {state.label}
    </span>
  );
}