import Link from "next/link";
import LocationBar from "@/components/LocationBar";
import Photo from "@/components/Photo";
import { CATEGORIES, WALK_ROUTES } from "@/lib/data/catalog";
import { intentSummaries, platformStats, publishedBusinesses } from "@/lib/repo";
import { cappedLocalScore } from "@/lib/score";

export default function HomePage() {
  const stats = platformStats();
  const intents = intentSummaries();
  const featured = [...publishedBusinesses()]
    .sort((a, b) => cappedLocalScore(b) - cappedLocalScore(a))
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <span className="ll-chip border-honey/40 bg-honey-soft">Demo data · fictional destination: Riverstone</span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl">
          Travel local.
          <br />
          <span className="text-clay">Spend local.</span>
          <br />
          Keep the value local.
        </h1>
        <p className="text-base leading-relaxed text-muted">
          Discover the small businesses, people and places that make every destination unique — and see where your
          tourism money keeps the most value in the community.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link href="/discover" className="ll-btn ll-btn-primary">
            Explore Local
          </Link>
          <Link href="/business" className="ll-btn ll-btn-ghost">
            I&apos;m a Local Business
          </Link>
          <Link href="/assistant" className="ll-btn ll-btn-ghost">
            Ask the assistant
          </Link>
        </div>

        <LocationBar variant="hero" />
      </section>

      {/* ── Why this exists ────────────────────────────────────── */}
      <section className="ll-card space-y-3 p-5">
        <p className="ll-label">Tourism should benefit the people who live there</p>
        <p className="text-sm leading-relaxed text-muted">
          Visitors spend billions in destinations every year. But too much of that spending flows to large chains and
          companies owned outside the community. LocalLoop helps visitors find independent businesses, local
          experiences and community-owned places — and shows its working, so you can judge for yourself.
        </p>
        <div className="grid grid-cols-3 gap-3 border-t border-line pt-4">
          <Metric value={stats.total} label="Local businesses listed" />
          <Metric value={stats.verified} label="Ownership verified" />
          <Metric value={stats.localEmployees} label="Local people employed" />
        </div>
        <p className="text-[0.7rem] text-muted">
          Demo data — counts come from the fictional Riverstone dataset shipped with this MVP.
        </p>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">What are you after?</h2>
          <Link href="/discover" className="text-sm font-semibold text-clay underline underline-offset-4">
            All categories
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const summary = intents.find((i) => i.intent === c.intent);
            return (
              <Link
                key={c.slug}
                href={`/places?intent=${c.intent}`}
                className="ll-card flex flex-col gap-1 p-4 transition hover:border-clay/50"
              >
                <span aria-hidden className="text-2xl">
                  {c.emoji}
                </span>
                <span className="font-display text-base font-semibold">{c.name}</span>
                <span className="text-xs text-muted">
                  {summary?.count ?? 0} places · avg score {summary?.avgScore ?? 0}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Highest local value right now</h2>
        <p className="text-sm text-muted">
          Ranked by Local Score — ownership, community presence, local sourcing, independence and practices.
        </p>
        <div className="space-y-3">
          {featured.map((b) => (
            <Link key={b.slug} href={`/places/${b.slug}`} className="ll-card flex gap-3 overflow-hidden p-3">
              <Photo
                src={b.photo}
                alt={`${b.name} — demo photo`}
                emoji={b.emoji}
                className="h-20 w-24 shrink-0 rounded-xl"
              />
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight">{b.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{b.description}</p>
                <p className="mt-1.5 text-xs font-semibold text-moss">
                  Local Score {cappedLocalScore(b)} · {b.priceRange}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Walk Local ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Walk Local</h2>
        <p className="text-sm text-muted">
          Ready-made walking loops where every stop is a locally owned business. No car, no chain, no detour.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {WALK_ROUTES.map((r) => (
            <Link key={r.slug} href={`/walk#${r.slug}`} className="ll-card p-4">
              <p className="font-display text-base font-semibold">{r.name}</p>
              <p className="mt-1 text-xs text-muted">{r.summary}</p>
              <p className="mt-2 text-xs font-semibold text-clay">{r.stops.length} stops →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Business + community CTAs ──────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="ll-card space-y-2 bg-moss-soft/60 p-5">
          <h2 className="font-display text-xl font-semibold">Are you a local business?</h2>
          <p className="text-sm text-muted">
            Let visitors discover you without needing a website, SEO knowledge or a marketing budget.
          </p>
          <Link href="/business/register" className="ll-btn ll-btn-moss">
            Get Listed
          </Link>
        </div>
        <div className="ll-card space-y-2 p-5">
          <h2 className="font-display text-xl font-semibold">Know a great local place?</h2>
          <p className="text-sm text-muted">
            Recommend it. Community submissions are clearly marked as unverified until an admin checks them.
          </p>
          <Link href="/business/register?mode=community" className="ll-btn ll-btn-ghost">
            Recommend a Business
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}