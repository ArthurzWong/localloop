"use client";

import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import { allBusinesses } from "@/lib/repo";
import { cappedLocalScore } from "@/lib/score";
import { DESTINATIONS } from "@/lib/data/businesses";
import { haversineKm } from "@/lib/geo";
import { useLocalState } from "@/lib/store";

export default function SavedPage() {
  const state = useLocalState();
  const destination = DESTINATIONS.find((d) => d.slug === state.destination) ?? DESTINATIONS[0];
  const origin = state.origin
    ? { latitude: state.origin.latitude, longitude: state.origin.longitude }
    : { latitude: destination.latitude, longitude: destination.longitude };

  const rows = allBusinesses({ includePending: true })
    .filter((b) => state.saved.includes(b.slug))
    .map((b) => ({ business: b, distanceKm: haversineKm(origin, b), score: cappedLocalScore(b) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Saved</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Your shortlist</h1>
        <p className="text-sm text-muted">
          Saved places live on this device only. No account is needed to use LocalLoop — saving is the point at which
          an account starts to be useful.
        </p>
      </header>

      {!state.hydrated ? (
        <div className="ll-card h-40 animate-pulse bg-white/60" />
      ) : rows.length === 0 ? (
        <div className="ll-card space-y-2 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            ♡
          </p>
          <h2 className="font-display text-lg font-semibold">Nothing saved yet</h2>
          <p className="text-sm text-muted">
            Tap Save on any place and it will show up here, sorted by how close it is to you.
          </p>
          <Link href="/places" className="ll-btn ll-btn-primary mx-auto">
            Start discovering
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-muted">{rows.length} saved place(s)</p>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.business.slug}>
                <BusinessCard business={row.business} distanceKm={row.distanceKm} score={row.score} />
              </li>
            ))}
          </ul>
        </>
      )}

      <section className="ll-card p-4">
        <h2 className="font-display text-base font-semibold">Guest-first by design</h2>
        <p className="mt-1 text-sm text-muted">
          You can open LocalLoop, choose a destination and discover local businesses without signing up. An account is
          only needed to sync saves across devices, keep trip history or manage a business listing.
        </p>
      </section>
    </div>
  );
}