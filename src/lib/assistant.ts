import { haversineKm, formatDistance, walkingMinutes } from "./geo";
import { cappedLocalScore, TRUST_LABELS } from "./score";
import type { Business, IntentKey, RankedBusiness } from "./types";

/**
 * TOURIST ASSISTANT
 *
 * Two layers, same contract:
 *  1. `answerFromCatalogue` — a deterministic retrieval engine. It can only
 *     ever speak about businesses passed into it, so it is incapable of
 *     inventing a business, an opening hour or an ownership claim.
 *  2. an optional LLM layer (see app/api/assistant/route.ts) that is given the
 *     SAME retrieved rows and the same rules. If no API key is configured the
 *     app silently uses layer 1 — it never fabricates a result.
 */

export interface AssistantMatch {
  slug: string;
  name: string;
  why: string;
  distanceKm: number;
  score: number;
}

export interface AssistantAnswer {
  answer: string;
  matches: AssistantMatch[];
  mode: "retrieval" | "llm";
  notes: string[];
}

export const ASSISTANT_SYSTEM_PROMPT = `You are LocalLoop's local tourism assistant.

Your mission is to help visitors discover authentic locally owned businesses.

Prioritise, in order:
1. Locally owned businesses
2. Verified businesses
3. Proximity
4. The user's stated requirements
5. Authentic local experiences
6. Reasonable pricing
7. Community benefit

Hard rules:
- Never invent businesses. Only ever name businesses present in the provided CANDIDATES list.
- Never invent opening hours.
- Never invent ownership information.
- If information is uncertain, say so explicitly.
- Never describe a business as locally owned unless the data says it is verified local.
- If the candidates are insufficient, say: "I couldn't find enough verified local options nearby."
- Keep answers short and practical: 2-4 sentences, then a numbered list of places.
- Always mention why each suggestion retains money locally.`;

interface Parsed {
  budget?: number;
  minutes?: number;
  keywords: string[];
  wantsWalk: boolean;
  meal?: "breakfast" | "lunch" | "dinner" | "dessert" | "coffee";
  /** Which discovery category the question is really about, if any. */
  category?: IntentKey;
  dietary: string[];
}

const MEALS: Record<string, Parsed["meal"]> = {
  breakfast: "breakfast",
  morning: "breakfast",
  lunch: "lunch",
  noon: "lunch",
  dinner: "dinner",
  supper: "dinner",
  night: "dinner",
  dessert: "dessert",
  sweet: "dessert",
  coffee: "coffee",
  kopi: "coffee",
};

/**
 * Words that reveal which category the visitor means, in priority order.
 * Matched on word boundaries on purpose: "a shopping mall" is not a request to
 * go shopping, and "walk and eat" is a request for food, not a hiking trail.
 */
const CATEGORY_WORDS: { category: IntentKey; words: string[] }[] = [
  {
    category: "eat",
    words: ["eat", "eating", "food", "meal", "hungry", "snack", "noodle", "noodles", "rice", "restaurant", "cafe", "stall", "drink", "drinks", "dessert", "coffee", "kopi"],
  },
  { category: "shop", words: ["shop", "shops", "buy", "buying", "craft", "crafts", "handicraft", "batik", "souvenir", "souvenirs", "gift", "gifts", "market"] },
  { category: "stay", words: ["stay", "sleep", "hotel", "hostel", "homestay", "guesthouse", "room", "rooms", "accommodation", "bed"] },
  { category: "experience", words: ["experience", "class", "classes", "workshop", "tour", "guide", "guided", "learn", "cook", "cooking", "activity", "activities", "trip"] },
  { category: "buy", words: ["present", "presents", "takehome"] },
  { category: "explore", words: ["walk", "walking", "trail", "hike", "hiking", "nature", "explore", "sight", "sights", "view", "views", "park", "river", "beach", "lookout", "boardwalk", "culture", "history", "museum", "photography"] },
];

const DIETARY = ["vegan", "vegetarian", "halal", "spicy", "seafood"];

/** Word-boundary match so "shopping mall" cannot be read as "shop". */
function hasWord(haystack: string, word: string): boolean {
  return new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(haystack);
}

/** Lowest and highest figure in a listed price range. "Free" yields 0/0. */
function priceBounds(b: Business): { min: number; max: number } {
  const nums = (b.priceRange.match(/\d+/g) ?? []).map(Number);
  if (nums.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function detectCategory(lower: string): IntentKey | undefined {
  for (const { category, words } of CATEGORY_WORDS) {
    if (words.some((w) => hasWord(lower, w))) return category;
  }
  return undefined;
}

export function parseQuestion(q: string): Parsed {
  const lower = q.toLowerCase();
  const budgetMatch = lower.match(/(?:rm|myr|\$)\s?(\d+)/) ?? lower.match(/(\d+)\s?(?:ringgit|bucks)/);
  const timeMatch = lower.match(/(\d+)\s?(?:hour|hr)/);
  const minMatch = lower.match(/(\d+)\s?(?:minute|min)/);
  const mealKey = Object.keys(MEALS).find((k) => hasWord(lower, k));
  const keywords = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return {
    budget: budgetMatch ? Number(budgetMatch[1]) : undefined,
    minutes: timeMatch ? Number(timeMatch[1]) * 60 : minMatch ? Number(minMatch[1]) : undefined,
    keywords,
    wantsWalk: hasWord(lower, "walk") || /on foot|stroll/.test(lower),
    meal: mealKey ? MEALS[mealKey] : undefined,
    category: mealKey ? "eat" : detectCategory(lower),
    dietary: DIETARY.filter((d) => hasWord(lower, d)),
  };
}

const STOPWORDS = new Set([
  "where", "what", "show", "something", "genuinely", "local", "near", "nearby", "here",
  "have", "want", "would", "could", "before", "only", "mall", "family", "find", "place",
  "places", "good", "best", "with", "that", "this", "give", "some", "thing", "really",
]);

function scoreCandidate(b: Business, parsed: Parsed, distanceKm: number, openNow: boolean): number {
  let s = cappedLocalScore(b) * 0.35;
  if (b.verificationStatus === "ADMIN_VERIFIED" || b.verificationStatus === "COMMUNITY_VERIFIED") s += 10;
  if (b.locallyOwned) s += 6;
  s += Math.max(0, 10 - distanceKm * 3.5);
  s += openNow ? 8 : -6;
  s += b.rating * 1.5;

  const haystack = [b.name, b.description, b.whatsLocal, ...b.tags, ...b.products].join(" ").toLowerCase();

  // A stated category intent is the strongest signal there is. Asking to eat
  // must never surface a rattan workshop because it happens to score well.
  if (parsed.category) {
    if (b.categorySlug !== parsed.category) s -= 45;
    else s += 20;
  }
  if (parsed.meal) {
    if (b.categorySlug !== "eat") s -= 45;
    if (b.tags.includes(parsed.meal)) s += 40;
    else s -= 12;
  }
  if (parsed.wantsWalk && distanceKm <= 1.2) s += 8;
  if (parsed.budget) {
    // Affordability decides it: a visitor with RM30 cannot use a RM90 trip,
    // and "most expensive item is within budget" beats "cheapest item is".
    const { min, max } = priceBounds(b);
    if (max && max <= parsed.budget) s += 14;
    else if (min && min <= parsed.budget) s += 4;
    else s -= 35;
  }
  for (const d of parsed.dietary) if (hasWord(haystack, d)) s += 8;
  for (const k of parsed.keywords) if (haystack.includes(k)) s += 6;
  return s;
}

export function answerFromCatalogue(
  question: string,
  candidates: { business: Business; distanceKm: number; openNow: boolean }[],
  opts: { originLabel?: string } = {},
): AssistantAnswer {
  const parsed = parseQuestion(question);
  const notes: string[] = [];

  if (parsed.budget) notes.push(`Budget interpreted as RM${parsed.budget}.`);
  if (parsed.meal) notes.push(`Meal intent: ${parsed.meal}.`);
  if (parsed.wantsWalk) notes.push("Walking preferred — weighting places within 1.2 km.");

  // Non-negotiables: never recommend a chain as "local", never recommend
  // somewhere we have no evidence about when a verified option exists.
  const scored = candidates
    .map((c) => ({ ...c, fit: scoreCandidate(c.business, parsed, c.distanceKm, c.openNow) }))
    .sort((a, b) => b.fit - a.fit);

  const verified = scored.filter(
    (c) => c.business.verificationStatus === "ADMIN_VERIFIED" || c.business.verificationStatus === "COMMUNITY_VERIFIED",
  );
  let pool = verified.length >= 3 ? verified : scored;

  // Honour a stated category: only food listings can answer "breakfast", and a
  // request to eat should not be answered with a walking trail.
  const wantCategory = parsed.meal ? "eat" : parsed.category;
  if (wantCategory) {
    const inCategory = pool.filter((c) => c.business.categorySlug === wantCategory);
    if (inCategory.length > 0) pool = inCategory;
  }

  // A stated budget is a constraint, not a preference. Showing a RM30–180
  // pottery studio to someone with RM30 is not a helpful answer.
  if (parsed.budget) {
    const budget = parsed.budget;
    const affordable = pool.filter((c) => priceBounds(c.business).max <= budget);
    if (affordable.length >= 2) {
      pool = affordable;
    } else {
      const partlyAffordable = pool.filter((c) => priceBounds(c.business).min <= budget);
      if (partlyAffordable.length >= 2) pool = partlyAffordable;
    }
  }

  const top = pool.slice(0, 3);

  if (top.length === 0) {
    return {
      answer:
        "I couldn't find enough verified local options nearby. Try widening the distance, or browse the map for places that are still awaiting verification.",
      matches: [],
      mode: "retrieval",
      notes,
    };
  }

  const unverifiedInPool = pool.filter((c) => c.business.verificationStatus === "UNVERIFIED").length;
  if (unverifiedInPool > 0 && verified.length < 3) {
    notes.push(
      `${unverifiedInPool} nearby listing(s) have unverified ownership — flagged rather than presented as local.`,
    );
  }

  const lead = buildLead(parsed, top, opts.originLabel);
  const list = top
    .map((c, i) => {
      const trust = TRUST_LABELS[c.business.verificationStatus].short;
      const walk = `${walkingMinutes(c.distanceKm)} min walk`;
      return `${i + 1}. ${c.business.name} — ${formatDistance(c.distanceKm)}, ${walk}, Local Score ${cappedLocalScore(c.business)}, ${trust}. ${c.business.whatsLocal}`;
    })
    .join("\n");

  return {
    answer: `${lead}\n\n${list}\n\nEvery place above is in the LocalLoop database for Riverstone. Prices and hours are as listed by the business — check before you set off.`,
    matches: top.map((c) => ({
      slug: c.business.slug,
      name: c.business.name,
      why: c.business.whatsLocal,
      distanceKm: Math.round(c.distanceKm * 100) / 100,
      score: cappedLocalScore(c.business),
    })),
    mode: "retrieval",
    notes,
  };
}

function buildLead(
  parsed: Parsed,
  top: { business: Business; distanceKm: number }[],
  originLabel?: string,
): string {
  const where = originLabel ? ` around ${originLabel}` : " near you";
  const best = top[0].business;
  const parts: string[] = [];
  if (parsed.meal === "breakfast") parts.push(`For breakfast${where}`);
  else if (parsed.meal === "lunch") parts.push(`For lunch${where}`);
  else if (parsed.meal === "dinner") parts.push(`For dinner${where}`);
  else if (parsed.meal === "coffee") parts.push(`For a proper local coffee${where}`);
  else if (parsed.meal === "dessert") parts.push(`For something sweet${where}`);
  else if (parsed.category === "eat") parts.push(`For local food${where}`);
  else if (parsed.category === "shop") parts.push(`For locally made things${where}`);
  else if (parsed.category === "stay") parts.push(`For somewhere local to stay${where}`);
  else if (parsed.category === "experience") parts.push(`For a local experience${where}`);
  else if (parsed.category === "explore") parts.push(`For local places to explore${where}`);
  else if (parsed.category === "buy") parts.push(`For something made here to take home${where}`);
  else parts.push(`Based on what is actually in the database${where}`);
  parts.push(`the strongest local-value option is ${best.name}.`);
  if (parsed.budget) parts.push(`I kept it inside RM${parsed.budget}.`);
  if (parsed.minutes) parts.push(`All of these are within about ${parsed.minutes} minutes.`);
  return parts.join(" ");
}

/** Builds the candidate list the assistant is allowed to see. */
export function assistantCandidates(
  rows: RankedBusiness[],
  origin: { latitude: number; longitude: number },
  limit = 12,
  category?: string,
): { business: Business; distanceKm: number; openNow: boolean }[] {
  return rows
    .filter((r) => r.business.status === "published")
    .filter((r) => (category ? r.business.categorySlug === category : true))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit)
    .map((r) => ({
      business: r.business,
      distanceKm: haversineKm(origin, r.business),
      openNow: r.openNow,
    }));
}