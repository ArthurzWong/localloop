import type { Metadata } from "next";
import Link from "next/link";
import { WALK_ROUTES } from "@/lib/data/catalog";
import { getBusiness } from "@/lib/repo";
import { formatWalkTime, haversineKm, walkingMinutes } from "@/lib/geo";
import { cappedLocalScore } from "@/lib/score";
import { estimateSpend, formatRM } from "@/lib/pricing";
import type { Business } from "@/lib/types";

export const metadata: Metadata = {
  title: "Walk Local",
  description: "Walking routes where every stop is a locally owned business.",
};

export default function WalkPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="ll-label">Walk Local</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Loops where the money stays put</h1>
        <p className="text-sm text-muted">
          Each loop is short enough to walk, and every stop is a locally owned business — so one morning out keeps
          value in the same few streets.
        </p>
      </header>

      {WALK_ROUTES.map((route) => {
        const stops = route.stops
          .map((s) => ({ stop: s, business: getBusiness(s.businessSlug) }))
          .filter((x): x is { stop: (typeof route.stops)[number]; business: Business } => Boolean(x.business));

        let totalKm = 0;
        for (let i = 1; i < stops.length; i++) {
          totalKm += haversineKm(stops[i - 1].business, stops[i].business);
        }
        const spend = stops.reduce((sum, s) => sum + estimateSpend(s.business), 0);
        const avgScore = stops.length
          ? Math.round(stops.reduce((sum, s) => sum + cappedLocalScore(s.business), 0) / stops.length)
          : 0;

        return (
          <section key={route.slug} id={route.slug} className="ll-card space-y-4 p-5">
            <div>
              <h2 className="font-display text-xl font-semibold">{route.name}</h2>
              <p className="mt-1 text-sm text-muted">{route.summary}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-y border-line py-3 text-center sm:grid-cols-4">
              <Stat label="Stops" value={String(stops.length)} />
              <Stat label="Walking distance" value={`${totalKm.toFixed(1)} km`} />
              <Stat label="On foot" value={formatWalkTime(walkingMinutes(totalKm))} />
              <Stat label="Est. local spend" value={formatRM(spend)} />
            </dl>

            <ol className="space-y-3">
              {stops.map(({ stop, business }, i) => {
                const legKm = i === 0 ? 0 : haversineKm(stops[i - 1].business, business);
                return (
                  <li key={business.slug} className="flex gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/places/${business.slug}`} className="font-semibold hover:text-clay">
                        {business.name}
                      </Link>
                      <p className="text-xs text-muted">{stop.note}</p>
                      <p className="mt-0.5 text-[0.7rem] text-muted">
                        {business.priceRange} · Local Score {cappedLocalScore(business)}
                        {i > 0 && ` · ${legKm < 1 ? `${Math.round(legKm * 1000)} m` : `${legKm.toFixed(1)} km`} from the previous stop`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="rounded-xl border border-line bg-parchment/60 p-3 text-xs leading-relaxed text-muted">
              Average Local Score across this loop: <strong className="text-ink">{avgScore}</strong>. The estimated
              local spend is the sum of the middle of each listed price range — an estimate, not a receipt. We do not
              claim a carbon saving for walking here: LocalLoop has no defensible per-visit emissions methodology yet,
              so it shows you the distance and lets you decide.
            </p>

            <Link href={`/map`} className="ll-btn ll-btn-ghost w-fit">
              See these stops on the map
            </Link>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}