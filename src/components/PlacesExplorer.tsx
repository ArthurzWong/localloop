"use client";

import { useMemo, useState } from "react";
import BusinessCard from "./BusinessCard";
import LocationBar from "./LocationBar";
import { DESTINATIONS } from "@/lib/data/businesses";
import { CATEGORIES } from "@/lib/data/catalog";
import { queryBusinesses } from "@/lib/repo";
import { mergeLocalBusinesses, useLocalState } from "@/lib/store";
import { cappedLocalScore } from "@/lib/score";
import type { BusinessFilters, IntentKey, RankedBusiness, SortKey } from "@/lib/types";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "distance", label: "Distance" },
  { key: "score", label: "Local Score" },
  { key: "rating", label: "Rating" },
  { key: "open", label: "Open now" },
];

/**
 * Discovery surface. This is a client component so the visitor's live location
 * and their local actions (saves, submissions, admin decisions) re-rank the
 * list instantly — but it also renders on the server with default state, so the
 * first paint is real content rather than an empty shell.
 */
export default function PlacesExplorer({ initialIntent }: { initialIntent?: IntentKey }) {
  const state = useLocalState();
  const [intent, setIntent] = useState<IntentKey | "all">(initialIntent ?? "all");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [q, setQ] = useState("");
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

  const filters: BusinessFilters = useMemo(
    () => ({
      intent: intent === "all" ? undefined : intent,
      q: q.trim() || undefined,
      sort,
      openNow,
      under20,
      walking,
      locallyOwned,
      familyOwned,
      eco,
      highlyRated,
    }),
    [intent, q, sort, openNow, under20, walking, locallyOwned, familyOwned, eco, highlyRated],
  );

  const filtered: RankedBusiness[] = useMemo(() => {
    const now = new Date();
    return queryBusinesses(filters, origin, now)
      .map((r) => {
        const merged = mergeLocalBusinesses([r.business], state)[0] ?? r.business;
        return { ...r, business: merged, score: cappedLocalScore(merged) };
      })
      .filter((r) => r.business.status === "published");
  }, [filters, origin, state]);

  const activeFilterCount = [openNow, under20, walking, locallyOwned, familyOwned, eco, highlyRated].filter(
    Boolean,
  ).length;

  function clearAll() {
    setQ("");
    setIntent("all");
    setOpenNow(false);
    setUnder20(false);
    setWalking(false);
    setLocallyOwned(false);
    setFamilyOwned(false);
    setEco(false);
    setHighlyRated(false);
  }

  return (
    <div className="space-y-4">
      <LocationBar />

      <div className="space-y-2">
        <label className="block">
          <span className="sr-only">Search local businesses</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stalls, crafts, homestays, kopi…"
            className="ll-input"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Category">
          <button
            type="button"
            role="tab"
            aria-selected={intent === "all"}
            onClick={() => setIntent("all")}
            className={`ll-chip ${intent === "all" ? "ll-chip-active" : ""}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={intent === c.intent}
              onClick={() => setIntent(c.intent)}
              className={`ll-chip ${intent === c.intent ? "ll-chip-active" : ""}`}
            >
              <span aria-hidden>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip on={openNow} set={setOpenNow} label="Open now" />
          <FilterChip on={under20} set={setUnder20} label="Under RM20" />
          <FilterChip on={walking} set={setWalking} label="Walking distance" />
          <FilterChip on={locallyOwned} set={setLocallyOwned} label="Locally owned" />
          <FilterChip on={familyOwned} set={setFamilyOwned} label="Family owned" />
          <FilterChip on={eco} set={setEco} label="Eco practices" />
          <FilterChip on={highlyRated} set={setHighlyRated} label="Highly rated" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs font-semibold text-muted">
            {filtered.length} place{filtered.length === 1 ? "" : "s"}
            {state.origin ? " near your location" : ` in ${destination.name}`}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} on`}
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="ll-input w-auto py-1.5 text-xs"
              aria-label="Sort results"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ll-card space-y-2 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            🔍
          </p>
          <h2 className="font-display text-lg font-semibold">No local places match that yet</h2>
          <p className="text-sm text-muted">
            Try removing a filter, widening the distance, or searching a different word. LocalLoop would rather show
            you nothing than invent a listing.
          </p>
          <button type="button" onClick={clearAll} className="ll-btn ll-btn-ghost mx-auto">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {filtered.map((row) => (
              <li key={row.business.slug}>
                <BusinessCard
                  business={row.business}
                  distanceKm={row.distanceKm}
                  score={row.score}
                  rankScore={row.rankScore}
                  showRank={sort === "recommended"}
                />
              </li>
            ))}
          </ul>

          <DistanceBands rows={filtered} />

          <p className="text-[0.7rem] leading-relaxed text-muted">
            Ranking: 40% Local Score · 20% distance · 15% rating · 10% category relevance · 10% open status · 5%
            popularity. No paid placement can override local relevance.
          </p>
        </>
      )}
    </div>
  );
}

function FilterChip({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => set(!on)}
      className={`ll-chip ${on ? "ll-chip-active" : ""}`}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

function DistanceBands({ rows }: { rows: RankedBusiness[] }) {
  const bands = [
    { label: "Local places within 1 km", max: 1 },
    { label: "Local places within 3 km", max: 3 },
    { label: "Local places within 5 km", max: 5 },
  ];
  return (
    <section className="ll-card p-4">
      <h2 className="font-display text-base font-semibold">Discover nearby</h2>
      <ul className="mt-2 space-y-1.5 text-sm text-muted">
        {bands.map((b) => (
          <li key={b.label} className="flex items-center justify-between">
            <span>{b.label}</span>
            <span className="font-semibold tabular-nums text-ink">
              {rows.filter((r) => r.distanceKm <= b.max).length}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.7rem] text-muted">
        Distances are straight-line estimates from your chosen origin, not walking routes.
      </p>
    </section>
  );
}