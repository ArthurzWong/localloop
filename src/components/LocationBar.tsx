"use client";

import { useState } from "react";
import { DESTINATIONS } from "@/lib/data/businesses";
import { setDestination, setOrigin, useLocalState } from "@/lib/store";

/**
 * Destination / location control.
 * Guest-first: no account, no sign-up. Geolocation is optional and the app
 * works identically if permission is denied.
 */
export default function LocationBar({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const state = useLocalState();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = DESTINATIONS.find((d) => d.slug === state.destination) ?? DESTINATIONS[0];
  const usingGeo = state.origin?.source === "geolocation";

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("This browser can't share a location. Enter your destination instead.");
      return;
    }
    setBusy(true);
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        setOrigin({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Your location",
          source: "geolocation",
        });
        setStatus("Using your location. Distances are measured from where you are now.");
      },
      (err) => {
        setBusy(false);
        setOrigin(null);
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — no problem. Enter your destination below."
            : "We couldn't get your location. Enter your destination instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  return (
    <div className={variant === "hero" ? "ll-card p-4" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="ll-chip border-clay/30 bg-clay-soft text-clay">
          📍 {usingGeo ? "Your location" : current.name}
          {!usingGeo && current.slug === "riverstone" && " (demo)"}
        </span>

        <button type="button" onClick={useMyLocation} disabled={busy} className="ll-chip hover:border-clay hover:text-clay">
          {busy ? "Locating…" : usingGeo ? "Refresh my location" : "Use my location"}
        </button>

        {usingGeo && (
          <button
            type="button"
            onClick={() => {
              setOrigin(null);
              setStatus(null);
            }}
            className="ll-chip hover:border-clay hover:text-clay"
          >
            Clear
          </button>
        )}

        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span className="sr-only sm:not-sr-only">Destination</span>
          <select
            value={state.destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setStatus(null);
            }}
            className="ll-input w-auto py-1.5 text-xs font-semibold"
            aria-label="Choose destination"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
                {d.slug === "riverstone" ? " — demo data" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status && <p className="mt-2 text-xs text-muted">{status}</p>}

      {!usingGeo && state.destination !== "riverstone" && (
        <p className="mt-2 rounded-xl border border-honey/40 bg-honey-soft p-2.5 text-xs text-ink/80">
          {current.name} has no live listings yet — LocalLoop is seeding Riverstone first. You are seeing the
          Riverstone demo dataset so the flow can be tested end to end.
        </p>
      )}
    </div>
  );
}