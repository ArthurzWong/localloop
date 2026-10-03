"use client";

import { useEffect, useState } from "react";
import { estimateSpend as spendOf } from "./pricing";
import type {
  Business,
  BusinessFilters,
  IntentKey,
  Review,
  ScoreInputs,
  VerificationStatus,
} from "./types";

/**
 * Guest-first, backend-free client state.
 *
 * Reads come from the seed catalogue on the server; everything a visitor or an
 * admin *does* (save, review, submit, verify, track impact) lives here and is
 * persisted to localStorage. When Supabase is wired in, these actions become
 * server actions and this module shrinks to a cache.
 */

const STORAGE_KEY = "localloop.state.v1";

export interface AdminDecision {
  status: "pending" | "published" | "rejected";
  verificationStatus: VerificationStatus;
  note?: string;
  decidedAt: string;
}

export interface Preferences {
  travelStyle: "solo" | "couple" | "family" | "friends";
  budget: "low" | "medium" | "high";
  likesWalking: boolean;
  interests: string[];
  dietary: string[];
}

export interface GeoOrigin {
  latitude: number;
  longitude: number;
  label: string;
  source: "geolocation" | "destination";
}

export interface LocalState {
  hydrated: boolean;
  destination: string;
  origin: GeoOrigin | null;
  saved: string[];
  visited: string[];
  reviews: Review[];
  submissions: Business[];
  decisions: Record<string, AdminDecision>;
  scoreOverrides: Record<string, Partial<ScoreInputs>>;
  preferences: Preferences;
  impactSeen: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  travelStyle: "couple",
  budget: "medium",
  likesWalking: true,
  interests: [],
  dietary: [],
};

const DEFAULTS: LocalState = {
  hydrated: false,
  destination: "riverstone",
  origin: null,
  saved: [],
  visited: [],
  reviews: [],
  submissions: [],
  decisions: {},
  scoreOverrides: {},
  preferences: DEFAULT_PREFERENCES,
  impactSeen: false,
};

let state: LocalState = DEFAULTS;
let hydrateStarted = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const { hydrated: _h, ...rest } = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* storage disabled — the app still works, just without memory */
  }
}

export function getLocalState(): LocalState {
  return state;
}

export function updateLocalState(patch: Partial<LocalState>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

export function hydrateLocalState() {
  if (hydrateStarted || typeof window === "undefined") return;
  hydrateStarted = true;
  let loaded: Partial<LocalState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = JSON.parse(raw) as Partial<LocalState>;
  } catch {
    loaded = {};
  }
  state = {
    ...DEFAULTS,
    ...loaded,
    preferences: { ...DEFAULT_PREFERENCES, ...(loaded.preferences ?? {}) },
    hydrated: true,
  };
  emit();
}

export function useLocalState(): LocalState {
  const [, bump] = useState(0);
  useEffect(() => {
    hydrateLocalState();
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

/* ─────────────────────────────── actions ─────────────────────────────── */

export function toggleSaved(slug: string) {
  const saved = state.saved.includes(slug)
    ? state.saved.filter((s) => s !== slug)
    : [...state.saved, slug];
  updateLocalState({ saved });
}

export function markVisited(slug: string) {
  if (state.visited.includes(slug)) return;
  updateLocalState({ visited: [...state.visited, slug] });
}

export function unmarkVisited(slug: string) {
  updateLocalState({ visited: state.visited.filter((s) => s !== slug) });
}

export function addReview(review: Omit<Review, "id" | "createdAt">) {
  const entry: Review = {
    ...review,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  updateLocalState({ reviews: [entry, ...state.reviews] });
}

export function submitBusiness(business: Business) {
  updateLocalState({
    submissions: [
      {
        ...business,
        status: "pending",
        verificationStatus: "COMMUNITY_SUBMITTED",
        createdAt: new Date().toISOString(),
      },
      ...state.submissions,
    ],
  });
}

export function decideSubmission(
  slug: string,
  decision: Omit<AdminDecision, "decidedAt">,
) {
  updateLocalState({
    decisions: {
      ...state.decisions,
      [slug]: { ...decision, decidedAt: new Date().toISOString() },
    },
  });
}

/** A business owner editing their own listing (their own submission only). */
export function updateSubmission(slug: string, patch: Partial<Business>) {
  updateLocalState({
    submissions: state.submissions.map((s) => (s.slug === slug ? { ...s, ...patch } : s)),
  });
}

export function deleteReview(id: string) {
  updateLocalState({ reviews: state.reviews.filter((r) => r.id !== id) });
}

export function setScoreOverride(slug: string, inputs: Partial<ScoreInputs>) {
  updateLocalState({
    scoreOverrides: {
      ...state.scoreOverrides,
      [slug]: { ...(state.scoreOverrides[slug] ?? {}), ...inputs },
    },
  });
}

export function setDestination(slug: string) {
  updateLocalState({ destination: slug, origin: null });
}

export function setOrigin(origin: GeoOrigin | null) {
  updateLocalState({ origin });
}

export function setPreferences(patch: Partial<Preferences>) {
  updateLocalState({ preferences: { ...state.preferences, ...patch } });
}

export function markImpactSeen() {
  if (!state.impactSeen) updateLocalState({ impactSeen: true });
}

export function resetLocalState() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  state = { ...DEFAULTS, hydrated: true };
  emit();
}

/* ────────────────────────── derived helpers ────────────────────────── */

/** Applies admin score edits to a business (used everywhere the score shows). */
export function withOverrides(b: Business, overrides: Record<string, Partial<ScoreInputs>>): Business {
  const o = overrides[b.slug];
  if (!o) return b;
  return { ...b, scoreInputs: { ...b.scoreInputs, ...o } };
}

/** Folds local submissions + admin decisions into a server-provided row set. */
export function mergeLocalBusinesses(serverRows: Business[], s: LocalState): Business[] {
  const rejected = new Set(
    Object.entries(s.decisions)
      .filter(([, d]) => d.status === "rejected")
      .map(([slug]) => slug),
  );
  const decidedVerification = new Map(
    Object.entries(s.decisions).map(([slug, d]) => [slug, d.verificationStatus]),
  );
  const out = serverRows
    .filter((b) => !rejected.has(b.slug))
    .map((b) => {
      const v = decidedVerification.get(b.slug);
      const withV = v ? { ...b, verificationStatus: v } : b;
      return withOverrides(withV, s.scoreOverrides);
    });

  for (const sub of s.submissions) {
    const d = s.decisions[sub.slug];
    if (d?.status === "rejected") continue;
    const merged: Business = {
      ...sub,
      status: d?.status === "published" ? "published" : "pending",
      verificationStatus: d?.verificationStatus ?? sub.verificationStatus,
    };
    out.push(withOverrides(merged, s.scoreOverrides));
  }
  return out;
}

/** Estimated spend per visit, taken from the middle of the listed price range. */
export { estimateSpend } from "./pricing";

export interface ImpactSummary {
  placesVisited: number;
  estimatedSpend: number;
  byBusiness: { business: Business; amount: number }[];
}

export function impactSummary(rows: Business[], s: LocalState): ImpactSummary {
  const visited = rows.filter((b) => s.visited.includes(b.slug));
  const byBusiness = visited.map((b) => ({ business: b, amount: spendOf(b) }));
  return {
    placesVisited: visited.length,
    estimatedSpend: byBusiness.reduce((sum, x) => sum + x.amount, 0),
    byBusiness,
  };
}

export function reviewStats(businessSlug: string, base: { rating: number; reviewCount: number }, s: LocalState) {
  const local = s.reviews.filter((r) => r.businessSlug === businessSlug);
  const total = base.rating * base.reviewCount + local.reduce((sum, r) => sum + r.rating, 0);
  const count = base.reviewCount + local.length;
  return {
    rating: count ? Math.round((total / count) * 10) / 10 : 0,
    count,
    localReviews: local,
  };
}

/** Simple client-side filter used by the map and saved screens. */
export function applyClientFilters(rows: Business[], filters: BusinessFilters): Business[] {
  return rows.filter((b) => {
    if (filters.intent && b.categorySlug !== filters.intent) return false;
    if (filters.locallyOwned && !b.locallyOwned) return false;
    if (filters.familyOwned && b.ownershipType !== "family_owned") return false;
    if (filters.eco && b.ecoPractices.length === 0) return false;
    if (filters.highlyRated && b.rating < 4.5) return false;
    if (filters.under20 && b.priceLevel > 1) return false;
    return true;
  });
}

export function intentLabel(intent: IntentKey): string {
  switch (intent) {
    case "eat":
      return "Eat Local";
    case "shop":
      return "Shop Local";
    case "stay":
      return "Stay Local";
    case "experience":
      return "Experience Local";
    case "explore":
      return "Explore Local";
    default:
      return "Buy Local";
  }
}