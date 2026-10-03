import { PENDING_BUSINESSES, SEED_BUSINESSES } from "./data/businesses";
import { CATEGORIES } from "./data/catalog";
import { haversineKm, isOpenNow } from "./geo";
import { cappedLocalScore } from "./score";
import type { Business, BusinessFilters, IntentKey, RankedBusiness, SortKey } from "./types";

/**
 * Storage boundary. Everything in the app reads businesses through this module,
 * so swapping the seed data for Postgres/Supabase means rewriting only this file.
 */

export function allBusinesses(opts: { includePending?: boolean } = {}): Business[] {
  const base = [...SEED_BUSINESSES, ...(opts.includePending ? PENDING_BUSINESSES : [])];
  return base;
}

export function publishedBusinesses(): Business[] {
  return SEED_BUSINESSES.filter((b) => b.status === "published");
}

export function pendingBusinesses(): Business[] {
  return PENDING_BUSINESSES;
}

export function getBusiness(slug: string): Business | undefined {
  return allBusinesses({ includePending: true }).find((b) => b.slug === slug);
}

export function businessBySlugOrThrow(slug: string): Business {
  const b = getBusiness(slug);
  if (!b) throw new Error(`Unknown business: ${slug}`);
  return b;
}

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function categoryEmoji(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.emoji ?? "📍";
}

/* ─────────────────────────────── ranking ─────────────────────────────── */

/**
 * RECOMMENDATION ENGINE (MVP — deliberately not AI).
 *
 *   40% local score
 *   20% distance
 *   15% rating
 *   10% relevance to the requested category
 *   10% open status
 *    5% popularity
 *
 * The integrity rule from the product brief: nothing — including any future
 * sponsored placement — may override local relevance beyond this weighting.
 */
export function rankBusiness(
  business: Business,
  origin: { latitude: number; longitude: number },
  filters: BusinessFilters,
  now: Date,
): RankedBusiness {
  const distanceKm = haversineKm(origin, business);
  const score = cappedLocalScore(business);
  const openNow = isOpenNow(business.hours, now);

  const scorePoints = (score / 100) * 40;
  const distancePoints = Math.max(0, 1 - distanceKm / 5) * 20;
  const ratingPoints = (Math.max(0, business.rating) / 5) * 15;

  let relevance = 0;
  if (filters.intent && business.categorySlug === filters.intent) relevance = 10;
  else if (filters.intent) relevance = 3;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [business.name, business.description, ...business.tags, ...business.products]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) relevance = Math.max(relevance, 8);
  }
  if (!filters.intent && !filters.q) relevance = 6;

  const openPoints = openNow ? 10 : 0;
  const popularityPoints = (Math.max(0, Math.min(100, business.popularity)) / 100) * 5;

  const rankParts = [
    { label: "Local score (40%)", points: round1(scorePoints), max: 40 },
    { label: "Distance (20%)", points: round1(distancePoints), max: 20 },
    { label: "Rating (15%)", points: round1(ratingPoints), max: 15 },
    { label: "Category relevance (10%)", points: round1(relevance), max: 10 },
    { label: "Open now (10%)", points: round1(openPoints), max: 10 },
    { label: "Popularity (5%)", points: round1(popularityPoints), max: 5 },
  ];

  return {
    business,
    distanceKm,
    score,
    openNow,
    rankParts,
    rankScore: round1(rankParts.reduce((s, p) => s + p.points, 0)),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function passesFilters(b: Business, distanceKm: number, filters: BusinessFilters): boolean {
  if (filters.intent && b.categorySlug !== filters.intent) return false;
  if (filters.category && b.categorySlug !== filters.category) return false;
  if (filters.locallyOwned && !b.locallyOwned) return false;
  if (filters.familyOwned && b.ownershipType !== "family_owned") return false;
  if (filters.eco && b.ecoPractices.length === 0) return false;
  if (filters.highlyRated && b.rating < 4.5) return false;
  if (filters.walking && distanceKm > 1.5) return false;
  if (typeof filters.maxKm === "number" && distanceKm > filters.maxKm) return false;
  if (filters.under20 && b.priceLevel > 1) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [b.name, b.description, b.whatsLocal, ...b.tags, ...b.products, categoryName(b.categorySlug)]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function queryBusinesses(
  filters: BusinessFilters,
  origin: { latitude: number; longitude: number },
  now: Date,
): RankedBusiness[] {
  const pool = filters.includePending
    ? allBusinesses({ includePending: true })
    : publishedBusinesses();

  const ranked = pool
    .map((b) => rankBusiness(b, origin, filters, now))
    .filter((r) => passesFilters(r.business, r.distanceKm, filters))
    .filter((r) => (filters.openNow ? r.openNow : true));

  return sortRanked(ranked, filters.sort ?? "recommended");
}

export function sortRanked(rows: RankedBusiness[], sort: SortKey): RankedBusiness[] {
  const copy = [...rows];
  switch (sort) {
    case "distance":
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    case "score":
      return copy.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
    case "rating":
      return copy.sort((a, b) => b.business.rating - a.business.rating || a.distanceKm - b.distanceKm);
    case "open":
      return copy.sort((a, b) => Number(b.openNow) - Number(a.openNow) || b.rankScore - a.rankScore);
    default:
      return copy.sort((a, b) => b.rankScore - a.rankScore);
  }
}

/* ─────────────────────────────── summaries ─────────────────────────────── */

export interface IntentSummary {
  intent: IntentKey;
  name: string;
  emoji: string;
  blurb: string;
  count: number;
  avgScore: number;
  verifiedCount: number;
}

export function intentSummaries(): IntentSummary[] {
  const pool = publishedBusinesses();
  return CATEGORIES.map((c) => {
    const rows = pool.filter((b) => b.categorySlug === c.slug);
    const avg = rows.length
      ? Math.round(rows.reduce((s, b) => s + cappedLocalScore(b), 0) / rows.length)
      : 0;
    return {
      intent: c.intent,
      name: c.name,
      emoji: c.emoji,
      blurb: c.blurb,
      count: rows.length,
      avgScore: avg,
      verifiedCount: rows.filter(
        (b) => b.verificationStatus === "ADMIN_VERIFIED" || b.verificationStatus === "COMMUNITY_VERIFIED",
      ).length,
    };
  });
}

export function platformStats() {
  const pool = publishedBusinesses();
  const verified = pool.filter(
    (b) => b.verificationStatus === "ADMIN_VERIFIED" || b.verificationStatus === "COMMUNITY_VERIFIED",
  );
  const localOwned = pool.filter((b) => b.locallyOwned);
  const employees = pool.reduce((s, b) => s + b.localEmployeeCount, 0);
  return {
    total: pool.length,
    verified: verified.length,
    localOwned: localOwned.length,
    localEmployees: employees,
    avgScore: pool.length ? Math.round(pool.reduce((s, b) => s + cappedLocalScore(b), 0) / pool.length) : 0,
  };
}

export function nearbyBusinesses(
  origin: { latitude: number; longitude: number },
  maxKm: number,
  now: Date,
): RankedBusiness[] {
  return queryBusinesses({ maxKm }, origin, now);
}

/** Grouping helper used by the discovery page's distance bands. */
export function distanceBands(
  rows: RankedBusiness[],
): { label: string; rows: RankedBusiness[] }[] {
  const bands: { label: string; max: number }[] = [
    { label: "Local places within 1 km", max: 1 },
    { label: "Local places within 3 km", max: 3 },
    { label: "Local places within 5 km", max: 5 },
  ];
  return bands.map((band) => ({
    label: band.label,
    rows: rows.filter((r) => r.distanceKm <= band.max),
  }));
}