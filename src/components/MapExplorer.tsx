"use client";

import { useMemo, useState } from "react";
import MapView from "./MapView";
import LocationBar from "./LocationBar";
import { DESTINATIONS } from "@/lib/data/businesses";
import { queryBusinesses } from "@/lib/repo";
import { mergeLocalBusinesses, useLocalState } from "@/lib/store";
import { cappedLocalScore } from "@/lib/score";
import type { BusinessFilters, IntentKey } from "@/lib/types";

const CATEGORY_FILTERS: { key: IntentKey | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "eat", label: "🍜 Food" },
  { key: "shop", label: "🎨 Shopping" },
  { key: "stay", label: "🏡 Stay" },
  { key: "experience", label: "🧑‍🌾 Experience" },
  { key: "explore", label: "🚶 Culture & nature" },
  { key: "buy", label: "🎁 Buy local" },
];

export default function MapExplorer() {
  const state = useLocalState();
  const [category, setCategory] = useState<IntentKey | "all">("all");
  const [openNow, setOpenNow] = useState(false);
  const [under20, setUnder20] = useState(false);
  const [walking, setWalking] = useState(false);
  const [locallyOwned, setLocallyOwned] = useState(false);
  const [familyOwned, setFamilyOwned] = useState(false);
  const [eco, setEco] = useState(false);
  const [highlyRated, setHighlyRated] = useState(false);

  const destination = DESTINATIONS.find((d) => d.slug === state.destination) ?? DESTINATIONS[0];
  const origin = state.origin
    ? { latitude: state.origin.latitude, longitude: state.origin.longitude }
    : { latitude: destination.latitude, longitude: destination.longitude };

  const points = useMemo(() => {
    const filters: BusinessFilters = {
      intent: category === "all" ? undefined : category,
      openNow,
      under20,
      walking,
      locallyOwned,
      familyOwned,
      eco,
      highlyRated,
    };
    const now = new Date();
    return queryBusinesses(filters, origin, now)
      .map((r) => {
        const merged = mergeLocalBusinesses([r.business], state)[0] ?? r.business;
        return { business: merged, distanceKm: r.distanceKm, score: cappedLocalScore(merged) };
      })
      .filter((p) => p.business.status === "published");
  }, [category, openNow, under20, walking, locallyOwned, familyOwned, eco, highlyRated, origin, state]);

  return (
    <div className="space-y-4">
      <LocationBar />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={category === c.key}
            onClick={() => setCategory(c.key)}
            className={`ll-chip ${category === c.key ? "ll-chip-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip on={openNow} set={setOpenNow} label="Open now" />
        <Chip on={under20} set={setUnder20} label="Under RM20" />
        <Chip on={walking} set={setWalking} label="Walking distance" />
        <Chip on={locallyOwned} set={setLocallyOwned} label="Locally owned" />
        <Chip on={familyOwned} set={setFamilyOwned} label="Family owned" />
        <Chip on={eco} set={setEco} label="Eco-friendly" />
        <Chip on={highlyRated} set={setHighlyRated} label="Highly rated" />
      </div>

      <MapView
        points={points}
        origin={origin}
        originLabel={state.origin ? "You are here" : `${destination.name} centre`}
        height={420}
      />

      <p className="text-xs text-muted">
        {points.length} marker{points.length === 1 ? "" : "s"} shown. Map data © OpenStreetMap contributors — no API
        key is exposed in the browser for this layer.
      </p>

      <ul className="space-y-2">
        {points.slice(0, 12).map((p) => (
          <li key={p.business.slug}>
            <a href={`/places/${p.business.slug}`} className="ll-card flex items-center gap-3 p-3">
              <span aria-hidden className="text-2xl">
                {p.business.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.business.name}</span>
                <span className="block text-xs text-muted">
                  {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`} ·{" "}
                  {p.business.priceRange} · Local Score {p.score}
                </span>
              </span>
              <span aria-hidden className="text-muted">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>

      {points.length === 0 && (
        <p className="ll-card p-5 text-center text-sm text-muted">
          Nothing matches those filters. Loosen one and the markers will come back.
        </p>
      )}
    </div>
  );
}

function Chip({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => set(!on)} className={`ll-chip ${on ? "ll-chip-active" : ""}`}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}