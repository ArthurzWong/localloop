/**
 * Verifies the assistant's intent handling against the demo catalogue.
 *
 *   npx tsx scripts/assistant-check.ts
 *
 * These are behaviour assertions, not unit tests: each case states what a
 * visitor would reasonably expect the answer to contain.
 */

import { answerFromCatalogue, parseQuestion } from "../src/lib/assistant";
import { DEMO_DESTINATION } from "../src/lib/data/businesses";
import { queryBusinesses } from "../src/lib/repo";
import { assistantCandidates } from "../src/lib/assistant";

const origin = { latitude: DEMO_DESTINATION.latitude, longitude: DEMO_DESTINATION.longitude };
const now = new Date();

interface Case {
  q: string;
  mustIncludeCategory?: string;
  mustContainAny?: string[];
  mustNotContain?: string[];
}

const CASES: Case[] = [
  { q: "Where can I have breakfast near me?", mustIncludeCategory: "eat", mustContainAny: ["Ah Mei", "Ah Soon", "Nasi Lemak", "Kopi"] },
  { q: "I only have RM30.", mustNotContain: ["Sungai Tepi Seafood", "Night Fishing", "Farm Stay", "Pottery", "Batik", "Rattan"], mustContainAny: ["Ah Mei", "Ah Soon", "Cendol", "Nasi Lemak", "Laksa", "Kopi"] },
  { q: "I want to walk and eat.", mustIncludeCategory: "eat", mustNotContain: ["Heritage Walk", "Trail", "Boardwalk", "Lookout"], mustContainAny: ["Ah Mei", "Ah Soon", "Laksa", "Cendol", "Kopi"] },
  { q: "I want something my family won't find in a shopping mall.", mustNotContain: ["River Mall Coffee", "CityMart"] },
  { q: "I have 2 hours before my bus.", mustNotContain: ["Farm Stay", "Night Fishing"] },
  { q: "Show me something genuinely local.", mustNotContain: ["River Mall Coffee", "CityMart"] },
  { q: "Where can I buy a souvenir?", mustIncludeCategory: "shop", mustContainAny: ["Batik", "Rattan", "Pottery", "Loom", "Market"] },
  { q: "I need somewhere to stay tonight.", mustIncludeCategory: "stay", mustContainAny: ["Homestay", "Rumah Rehat", "Hostel", "Loft", "Farm Stay"] },
  { q: "Where can I eat for RM10?", mustIncludeCategory: "eat" },
  { q: "something to do with my kids", mustNotContain: ["River Mall Coffee"] },
];

function categoryOf(slug: string): string | undefined {
  return queryBusinesses({}, origin, now).find((r) => r.business.slug === slug)?.business.categorySlug;
}

let failures = 0;

for (const c of CASES) {
  const parsed = parseQuestion(c.q);
  const wanted = parsed.meal ? "eat" : parsed.category;
  const candidates = assistantCandidates(queryBusinesses({}, origin, now), origin, wanted ? 30 : 16, wanted);
  const answer = answerFromCatalogue(c.q, candidates, { originLabel: "Riverstone" });
  const names = answer.matches.map((m) => m.name);
  const text = `${answer.answer}`;

  const problems: string[] = [];

  if (c.mustContainAny && !c.mustContainAny.some((n) => text.includes(n))) {
    problems.push(`expected one of [${c.mustContainAny.join(", ")}]`);
  }
  if (c.mustNotContain) {
    const bad = c.mustNotContain.filter((n) => text.includes(n));
    if (bad.length) problems.push(`should not mention [${bad.join(", ")}]`);
  }
  if (c.mustIncludeCategory) {
    const wrong = answer.matches.filter((m) => categoryOf(m.slug) !== c.mustIncludeCategory);
    if (wrong.length) problems.push(`non-${c.mustIncludeCategory} results: [${wrong.map((w) => w.name).join(", ")}]`);
  }

  const label = problems.length === 0 ? "PASS" : "FAIL";
  if (problems.length) failures++;
  console.log(`${label}  "${c.q}"`);
  console.log(`      parsed: meal=${parsed.meal ?? "-"} category=${parsed.category ?? "-"} budget=${parsed.budget ?? "-"} walk=${parsed.wantsWalk}`);
  console.log(`      top3:   ${names.join(" | ") || "(none)"}`);
  if (problems.length) console.log(`      ⚠ ${problems.join("; ")}`);
}

console.log(`\n${CASES.length - failures}/${CASES.length} cases behaved as a visitor would expect.`);
process.exit(failures === 0 ? 0 : 1);