"use client";

import Link from "next/link";
import { allBusinesses } from "@/lib/repo";
import { estimateSpend, formatRM } from "@/lib/pricing";
import { cappedLocalScore } from "@/lib/score";
import { categoryName } from "@/lib/repo";
import { useLocalState } from "@/lib/store";

/**
 * LOCAL IMPACT
 *
 * Everything here is a self-reported estimate. The page says so on every card,
 * because the product's whole promise collapses if it implies receipts it does
 * not have.
 */
export default function ImpactPage() {
  const state = useLocalState();
  const businesses = allBusinesses({ includePending: true });

  const visited = businesses.filter((b) => state.visited.includes(b.slug));
  const rows = visited.map((b) => ({ business: b, amount: estimateSpend(b) }));
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const localOwnedShare = visited.length
    ? Math.round((visited.filter((b) => b.locallyOwned).length / visited.length) * 100)
    : 0;
  const localJobs = visited.reduce((sum, b) => sum + b.localEmployeeCount, 0);
  const avgScore = visited.length
    ? Math.round(visited.reduce((sum, b) => sum + cappedLocalScore(b), 0) / visited.length)
    : 0;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Local Impact</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Where your spending went</h1>
        <p className="text-sm text-muted">
          These figures come from places you marked as visited, priced at the middle of each business&apos;s own listed
          price range. They are estimates, not transactions.
        </p>
      </header>

      {!state.hydrated ? (
        <div className="ll-card h-48 animate-pulse bg-white/60" />
      ) : rows.length === 0 ? (
        <div className="ll-card space-y-2 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            🧾
          </p>
          <h2 className="font-display text-lg font-semibold">No visits marked yet</h2>
          <p className="text-sm text-muted">
            Open a place, tap &ldquo;Yes, I visited&rdquo;, and your estimated local impact will build up here.
          </p>
          <Link href="/places" className="ll-btn ll-btn-primary mx-auto">
            Find a local place
          </Link>
        </div>
      ) : (
        <>
          <section className="ll-card space-y-4 p-5">
            <div className="rounded-xl border border-clay/30 bg-clay-soft p-4">
              <p className="text-sm font-semibold text-clay-dark">You are supporting local businesses.</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{formatRM(total)}</p>
              <p className="text-xs text-muted">Estimated local spending this trip · estimate, not a receipt</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Local businesses visited" value={String(visited.length)} />
              <Metric label="Locally owned" value={`${localOwnedShare}%`} />
              <Metric label="Local jobs behind them" value={String(localJobs)} />
              <Metric label="Avg Local Score" value={String(avgScore)} />
            </dl>

            <p className="rounded-xl border border-line bg-parchment/60 p-3 text-xs leading-relaxed text-muted">
              <strong className="text-ink">What this does not claim.</strong> LocalLoop does not know whether the money
              you spent actually stayed in the community. The figures above estimate the scale of spending directed to
              locally owned businesses; the real retention depends on each business&apos;s own suppliers, wages and
              ownership — which is exactly what the Local Score tries to make visible.
            </p>
          </section>

          <section className="ll-card divide-y divide-line p-0">
            {rows.map(({ business, amount }) => (
              <div key={business.slug} className="flex items-center gap-3 p-4">
                <span aria-hidden className="text-2xl">
                  {business.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/places/${business.slug}`} className="font-semibold hover:text-clay">
                    {business.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {categoryName(business.categorySlug)} · {business.priceRange} · Local Score{" "}
                    {cappedLocalScore(business)}
                  </p>
                </div>
                <p className="shrink-0 font-display text-base font-semibold tabular-nums">{formatRM(amount)}</p>
              </div>
            ))}
          </section>

          <section className="ll-card space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">The local economy graph (coming later)</h2>
            <p className="text-sm text-muted">
              Longer term, LocalLoop will trace the chain rather than just the visit: your spending → the business →
              local employees → local suppliers → local producers → the community. That is the difference between
              &ldquo;visit this restaurant&rdquo; and &ldquo;your spending supports this network&rdquo;.
            </p>
            <p className="text-[0.7rem] text-muted">
              Phase 2/3 on the roadmap. Not claimed as working in this MVP.
            </p>
          </section>
        </>
      )}

      <Link href="/places" className="ll-btn ll-btn-ghost">
        Keep discovering
      </Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}