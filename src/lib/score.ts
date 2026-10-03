import type { Business, ScoreInputs, VerificationStatus } from "./types";

/**
 * LOCAL SCORE — a transparent, deliberately simple 0–100 score.
 *
 * It is NOT a scientific measure. Every point is traceable to a declared
 * input so a visitor can see exactly why a business scored what it scored,
 * and an admin can edit the inputs.
 *
 *   Local ownership ................ 30
 *   Community presence ............. 20
 *   Local products / services ...... 20
 *   Independent business ........... 15
 *   Sustainability & practices ..... 10
 *   Visitor reviews (derived) ......  5
 *                                  ---
 *                                  100
 */

export const SCORE_WEIGHTS = {
  localOwnership: { label: "Local ownership", max: 30, explain: "Who owns the business, and where they live." },
  communityPresence: { label: "Community presence", max: 20, explain: "Local staff, local suppliers, years rooted in the area." },
  localProducts: { label: "Local products & services", max: 20, explain: "How much of what is sold is made or sourced locally." },
  independent: { label: "Independent business", max: 15, explain: "Not part of a chain or franchise." },
  sustainability: { label: "Sustainability & community practices", max: 10, explain: "Waste, sourcing, fair pay, community activity." },
  reviews: { label: "Visitor reviews", max: 5, explain: "Derived from visitor ratings. Never editable by the business." },
} as const;

export type ScoreKey = keyof typeof SCORE_WEIGHTS;

export interface ScoreLine {
  key: ScoreKey;
  label: string;
  points: number;
  max: number;
  explain: string;
  derived: boolean;
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

/** Review points are derived from real review data — never hand-set. */
export function reviewPoints(rating: number, reviewCount: number): number {
  if (reviewCount === 0) return 0;
  const quality = (Math.max(0, Math.min(5, rating)) / 5) * 3; // 0–3
  const volume = (Math.min(reviewCount, 20) / 20) * 2; // 0–2
  return clamp(quality + volume, 5);
}

export function scoreBreakdown(business: Pick<Business, "scoreInputs" | "rating" | "reviewCount">): ScoreLine[] {
  const i: ScoreInputs = business.scoreInputs;
  return [
    { key: "localOwnership", points: clamp(i.localOwnership, 30), derived: false, ...SCORE_WEIGHTS.localOwnership },
    { key: "communityPresence", points: clamp(i.communityPresence, 20), derived: false, ...SCORE_WEIGHTS.communityPresence },
    { key: "localProducts", points: clamp(i.localProducts, 20), derived: false, ...SCORE_WEIGHTS.localProducts },
    { key: "independent", points: clamp(i.independent, 15), derived: false, ...SCORE_WEIGHTS.independent },
    { key: "sustainability", points: clamp(i.sustainability, 10), derived: false, ...SCORE_WEIGHTS.sustainability },
    {
      key: "reviews",
      points: reviewPoints(business.rating, business.reviewCount),
      derived: true,
      ...SCORE_WEIGHTS.reviews,
    },
  ];
}

export function localScore(business: Pick<Business, "scoreInputs" | "rating" | "reviewCount">): number {
  return scoreBreakdown(business).reduce((sum, line) => sum + line.points, 0);
}

/** Cap a score once the business is a chain — a chain cannot be "local". */
export function cappedLocalScore(business: Business): number {
  const raw = localScore(business);
  if (business.ownershipType === "chain") return Math.min(raw, 25);
  return raw;
}

export const TRUST_LABELS: Record<VerificationStatus, { label: string; short: string; tone: string; explain: string }> = {
  UNVERIFIED: {
    label: "Local status: Unverified",
    short: "Unverified",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
    explain: "We have no evidence yet about who owns this business. It may well be local — we just have not confirmed it.",
  },
  COMMUNITY_SUBMITTED: {
    label: "Community submitted",
    short: "Community submitted",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    explain: "A member of the public suggested this place. Ownership is not yet confirmed.",
  },
  OWNER_VERIFIED: {
    label: "Owner verified",
    short: "Owner verified",
    tone: "bg-sky-50 text-sky-800 border-sky-200",
    explain: "The owner told us about the business and we confirmed their contact details.",
  },
  ADMIN_VERIFIED: {
    label: "Verified local",
    short: "Verified local",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    explain: "A LocalLoop admin checked ownership, location and local practices against evidence.",
  },
  COMMUNITY_VERIFIED: {
    label: "Community verified",
    short: "Community verified",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    explain: "Confirmed by multiple local residents as genuinely locally owned.",
  },
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  locally_owned: "Locally owned",
  locally_operated: "Locally operated",
  family_owned: "Family owned",
  cooperative: "Cooperative",
  independent: "Independent",
  chain: "Chain / franchise",
  unknown: "Ownership unknown",
};