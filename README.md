# LocalLoop

**Travel local. Spend local. Keep the value local.**

A mobile-first web app / PWA that helps visitors find and spend money at genuinely
local small businesses — food stalls, family kitchens, craft workshops, homestays,
community trails — instead of large chains and businesses owned outside the destination.

The differentiator is not a map. It is **local value retention**, made visible and
checkable.

---

## What's implemented (MVP)

| Area | Status |
|---|---|
| Landing page + hero, impact section, business/community CTAs | ✅ |
| Destination picker + optional geolocation (works if permission denied) | ✅ |
| 6 database-driven discovery categories | ✅ |
| Discovery list: search, category, 7 filters, 5 sort modes, distance bands | ✅ |
| Business card + business detail page | ✅ |
| Transparent 0–100 **Local Score** with "How is this calculated?" | ✅ |
| 5-state trust system (never claims verification it doesn't have) | ✅ |
| Interactive map (Leaflet + OpenStreetMap, no API key in the browser) | ✅ |
| Walk Local routes with distance, walking time, estimated spend | ✅ |
| Business registration / community submission flow | ✅ |
| Admin dashboard: verification queue, score editor, reviews, categories, impact stats | ✅ |
| Guest-first: full discovery with no account | ✅ |
| AI tourist assistant (retrieval engine + optional LLM layer) | ✅ |
| Reviews with anti-spam checks; businesses cannot edit their own | ✅ |
| PWA: manifest, icons, service worker | ✅ |
| 32 fictional **DEMO** listings for the invented destination *Riverstone* | ✅ |
| Bookings, payments, sponsorship, tourism-authority dashboards | ❌ Phase 2/3 |

### The Local Score

A deliberately simple, fully traceable heuristic — not a scientific measure:

| Factor | Max |
|---|---|
| Local ownership | 30 |
| Community presence (local staff, suppliers, years rooted) | 20 |
| Local products & services | 20 |
| Independent business | 15 |
| Sustainability & community practices | 10 |
| Visitor reviews (derived from ratings, not editable) | 5 |

A chain is capped at **25** overall. Ownership points are only awarded where there is
evidence — an unverified business shows a low ownership score rather than a flattering
guess.

### Ranking (MVP, deliberately not AI)

`40% Local Score · 20% distance · 15% rating · 10% category relevance · 10% open status · 5% popularity`

No paid placement can override local relevance. That is why the MVP ships with **no
featured/sponsored slot at all** rather than a half-safe one.

---

## Demo data warning

Every business in this repository is **fictional**, set in the invented destination of
**Riverstone**. Records are flagged `isDemo: true` and labelled `DEMO` in the UI. Nothing
here describes a real business, and the app never presents demo figures as real impact.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
```

Optional — enables the language-model layer of the assistant:

```bash
cp .env.example .env.local
# set OPENAI_API_KEY (server-side only)
```

Without a key the assistant still works: it answers from the database using the
deterministic retrieval engine.

Regenerate the PWA icons (standard library only, no Pillow):

```bash
python3 scripts/make-icons.py
```

---

## Architecture

```
src/lib/
  types.ts        domain types (framework-free)
  score.ts        Local Score engine + trust labels
  repo.ts         ★ storage boundary + ranking engine
  geo.ts          distance, walking time, open-now, deep links
  pricing.ts      estimated spend (midpoint of listed price range)
  assistant.ts    retrieval engine + system prompt
  store.ts        guest-first client state (localStorage)
  data/           Riverstone demo dataset + categories, reviews, routes
src/app/          routes (App Router)
src/components/   UI
```

### Swapping in a real database

`src/lib/repo.ts` is the **only** module that reads business data. Replace its functions
with Postgres/Supabase queries and no UI code changes. The client-side `store.ts` actions
(save, review, submit, verify, track impact) become server actions behind Supabase Row
Level Security; the tables to create are listed in the product brief
(`businesses`, `business_categories`, `business_photos`, `business_hours`,
`business_verifications`, `reviews`, `favorites`, `tourist_sessions`, `discoveries`,
`routes`, `route_stops`, `impact_events`, `admin_users`).

### Security posture

- No API key is ever exposed to the browser. `OPENAI_API_KEY` is read only inside
  `src/app/api/assistant/route.ts` (a route handler). Nothing uses `NEXT_PUBLIC_*`.
- The assistant is given a fixed candidate list per request and instructed never to
  name a business outside it, so it cannot invent a business, an opening time or an
  ownership claim. If nothing verified is nearby, it says so.
- Review text is length-checked, link-stripped and repeat-character checked.
- **Not yet implemented:** an auth gate on `/admin`. It is labelled on-screen as a demo
  surface. Wire Supabase Auth + an `admin_users` table before putting real data behind it.

---

## Honesty rules baked into the product

1. Never display "Verified Local" without evidence — show "Local status: Unverified".
2. Spending and impact figures are always labelled estimates, never receipts.
3. No CO₂ saving is claimed for walking — there is no defensible per-visit methodology,
   so the app shows distance and lets the visitor decide.
4. If there is nothing good nearby, the app says so rather than filling the space.