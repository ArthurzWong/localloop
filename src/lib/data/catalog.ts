import type { Category, Review, WalkRoute } from "../types";

/** Categories are data, not hard-coded UI, so they can be expanded later. */
export const CATEGORIES: Category[] = [
  { id: "cat-eat", slug: "eat", name: "Eat Local", emoji: "🍜", intent: "eat", blurb: "Stalls, kitchens and coffee shops run by people who live here." },
  { id: "cat-shop", slug: "shop", name: "Shop Local", emoji: "🎨", intent: "shop", blurb: "Craft, batik, books and makers working in the town." },
  { id: "cat-stay", slug: "stay", name: "Stay Local", emoji: "🏡", intent: "stay", blurb: "Homestays, guesthouses and cooperative hostels." },
  { id: "cat-experience", slug: "experience", name: "Experience Local", emoji: "🧑‍🌾", intent: "experience", blurb: "Cooking classes, guided walks, fishing trips, crafts." },
  { id: "cat-explore", slug: "explore", name: "Explore Local", emoji: "🚶", intent: "explore", blurb: "Trails, boardwalks, lookouts and community green space." },
  { id: "cat-buy", slug: "buy", name: "Buy Local", emoji: "🎁", intent: "buy", blurb: "Take something home that was actually made here." },
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const DEMO_REVIEWS: Review[] = [
  {
    id: "rev-001",
    businessSlug: "ah-mei-family-kitchen",
    author: "Hannah (visitor, Germany)",
    rating: 5,
    text: "Went twice. The duck really does sell out — go before 12. Ah Mei explained where the vegetables come from without being asked.",
    visitedDate: "2026-08-14",
    verifiedVisit: true,
    createdAt: "2026-08-15T09:12:00.000Z",
  },
  {
    id: "rev-002",
    businessSlug: "ah-soon-handmade-noodles",
    author: "Daniel (visitor, Singapore)",
    rating: 5,
    text: "You can watch the noodles being pulled. RM9 for a bowl. Cheapest and best meal of the trip.",
    visitedDate: "2026-08-02",
    verifiedVisit: true,
    createdAt: "2026-08-03T03:40:00.000Z",
  },
  {
    id: "rev-003",
    businessSlug: "riverstone-batik-workshop",
    author: "Priya (visitor, India)",
    rating: 4,
    text: "The two-hour class was well taught. Book ahead at weekends — it was full when we walked in.",
    visitedDate: "2026-07-21",
    verifiedVisit: false,
    createdAt: "2026-07-22T11:05:00.000Z",
  },
  {
    id: "rev-004",
    businessSlug: "heritage-walk-pak-samad",
    author: "Tom (visitor, Australia)",
    rating: 5,
    text: "Pak Samad grew up in these streets. Two hours felt like twenty minutes.",
    visitedDate: "2026-09-05",
    verifiedVisit: true,
    createdAt: "2026-09-06T01:30:00.000Z",
  },
  {
    id: "rev-005",
    businessSlug: "rumah-rehat-riverstone",
    author: "Sofia (visitor, Spain)",
    rating: 5,
    text: "Breakfast was bought fresh at the market that morning. Free bicycles made the town easy.",
    visitedDate: "2026-08-27",
    verifiedVisit: true,
    createdAt: "2026-08-28T06:15:00.000Z",
  },
];

export const WALK_ROUTES: WalkRoute[] = [
  {
    id: "route-001",
    slug: "old-town-local-loop",
    name: "Riverstone Old Town Local Loop",
    destination: "riverstone",
    summary:
      "A morning that keeps every ringgit on the same three streets: breakfast, coffee, a maker's workshop, dessert, then the riverside.",
    stops: [
      { businessSlug: "ah-soon-handmade-noodles", note: "Start here at 7am — hand-pulled noodles." },
      { businessSlug: "riverstone-kopi-toast", note: "Walk 4 minutes for hand-roasted kopi." },
      { businessSlug: "ah-heng-rattan", note: "Watch the weaving; small trays are the good souvenir." },
      { businessSlug: "uncle-tan-cendol", note: "Cendol opposite the old cinema." },
      { businessSlug: "riverside-heritage-trail", note: "Finish along the river trail." },
    ],
  },
  {
    id: "route-002",
    slug: "kampung-morning-loop",
    name: "Kampung Morning Loop",
    destination: "riverstone",
    summary: "Village-side breakfast, a herb garden, and the wetland boardwalk before the heat.",
    stops: [
      { businessSlug: "kampung-laksa-stall", note: "Laksa pounded fresh at 5am." },
      { businessSlug: "community-herb-garden", note: "Volunteers are usually there in the morning." },
      { businessSlug: "sungai-tepi-boardwalk", note: "Bird hide at the river mouth." },
      { businessSlug: "kampung-bamboo-homestay", note: "Stop for a drink if you are staying here." },
    ],
  },
  {
    id: "route-003",
    slug: "makers-and-craft-loop",
    name: "Makers & Craft Loop",
    destination: "riverstone",
    summary: "Four makers within 2km: rattan, batik, clay and songket. All buy-in stays in the district.",
    stops: [
      { businessSlug: "riverstone-batik-workshop", note: "Book the two-hour class." },
      { businessSlug: "ah-heng-rattan", note: "Three minutes on foot." },
      { businessSlug: "sungai-clay-pottery", note: "Cooperative kiln — buy direct from the potter." },
      { businessSlug: "sungai-loom-weaving", note: "Weekday demo only, small groups." },
    ],
  },
];