"use client";

import Link from "next/link";
import Photo from "./Photo";
import OpenStatus from "./OpenStatus";
import { DemoBadge, OwnershipBadge, ScorePill, TrustBadge } from "./Badges";
import { categoryEmoji, categoryName } from "@/lib/repo";
import { formatDistance, walkingMinutes } from "@/lib/geo";
import { reviewStats, toggleSaved, useLocalState } from "@/lib/store";
import type { Business } from "@/lib/types";

export default function BusinessCard({
  business,
  distanceKm,
  score,
  rankScore,
  showRank = false,
}: {
  business: Business;
  distanceKm: number;
  score: number;
  rankScore?: number;
  showRank?: boolean;
}) {
  const state = useLocalState();
  const saved = state.saved.includes(business.slug);
  const stats = reviewStats(business.slug, business, state);
  const visited = state.visited.includes(business.slug);

  return (
    <article className="ll-card overflow-hidden">
      <Link href={`/places/${business.slug}`} className="block">
        <div className="relative">
          <Photo
            src={business.photo}
            alt={`${business.name} — demo photo`}
            emoji={business.emoji}
            className="h-40 w-full"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="ll-chip border-transparent bg-white/95 text-ink">
              {categoryEmoji(business.categorySlug)} {categoryName(business.categorySlug)}
            </span>
            {business.isDemo && <DemoBadge />}
          </div>
          <div className="absolute right-3 top-3">
            <ScorePill score={score} />
          </div>
          {visited && (
            <span className="absolute bottom-3 left-3 ll-chip border-moss/30 bg-moss text-white">
              ✓ Visited on this trip
            </span>
          )}
        </div>
      </Link>

      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold leading-snug">
              <Link href={`/places/${business.slug}`} className="hover:text-clay">
                {business.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {formatDistance(distanceKm)} · {walkingMinutes(distanceKm)} min walk · {business.priceRange}
              {stats.count > 0 && (
                <>
                  {" "}
                  · ★ {stats.rating.toFixed(1)} ({stats.count})
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSaved(business.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${business.name} from saved` : `Save ${business.name}`}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold ${
              saved ? "border-clay bg-clay-soft text-clay" : "border-line bg-white text-muted hover:border-clay hover:text-clay"
            }`}
          >
            {saved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted">{business.description}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <TrustBadge status={business.verificationStatus} size="xs" />
          <OwnershipBadge business={business} />
          {business.ecoPractices.length > 0 && (
            <span className="ll-chip border-moss/25 bg-moss-soft text-[0.7rem] text-moss">♻︎ Eco practices</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <OpenStatus hours={business.hours} />
          <div className="flex gap-2">
            <Link href={`/places/${business.slug}`} className="ll-btn ll-btn-ghost text-sm">
              View Place
            </Link>
            <Link href={`/places/${business.slug}#impact`} className="ll-btn ll-btn-primary text-sm">
              Visit
            </Link>
          </div>
        </div>

        {showRank && typeof rankScore === "number" && (
          <p className="border-t border-line pt-2 text-[0.7rem] text-muted">
            Ranking score {rankScore} / 100 — weighted mostly by Local Score (40%) and distance (20%).
          </p>
        )}
      </div>
    </article>
  );
}