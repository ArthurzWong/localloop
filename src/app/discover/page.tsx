import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data/catalog";
import { intentSummaries } from "@/lib/repo";
import { SCORE_WEIGHTS } from "@/lib/score";

export const metadata: Metadata = {
  title: "Discover Local",
  description: "Choose what you want to do — eat, shop, stay, experience, explore or buy local.",
};

export default function DiscoverPage() {
  const intents = intentSummaries();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="ll-label">Discover Local</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">What are you after?</h1>
        <p className="text-sm text-muted">
          Pick an intent and LocalLoop ranks what is nearby by how much of your money stays in the community.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => {
          const s = intents.find((i) => i.intent === c.intent);
          return (
            <li key={c.slug}>
              <Link
                href={`/places?intent=${c.intent}`}
                className="ll-card flex h-full flex-col gap-2 p-5 transition hover:border-clay/50"
              >
                <span aria-hidden className="text-3xl">
                  {c.emoji}
                </span>
                <span className="font-display text-xl font-semibold">{c.name}</span>
                <span className="text-sm text-muted">{c.blurb}</span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  <span className="ll-chip">{s?.count ?? 0} places</span>
                  <span className="ll-chip">avg score {s?.avgScore ?? 0}</span>
                  <span className="ll-chip border-moss/30 bg-moss-soft text-moss">
                    {s?.verifiedCount ?? 0} verified
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="ll-card space-y-3 p-5">
        <h2 className="font-display text-xl font-semibold">Not sure? Ask in plain language.</h2>
        <p className="text-sm text-muted">
          &ldquo;Where can I have breakfast near me?&rdquo; · &ldquo;I only have RM30.&rdquo; · &ldquo;I have 2 hours
          before my bus.&rdquo; · &ldquo;I want something my family won&apos;t find in a shopping mall.&rdquo;
        </p>
        <Link href="/assistant" className="ll-btn ll-btn-primary w-fit">
          Open the local assistant
        </Link>
        <p className="text-[0.7rem] text-muted">
          The assistant can only answer from businesses already in the LocalLoop database. It will not invent a place,
          an opening time or an ownership claim — if there is nothing good nearby, it says so.
        </p>
      </section>

      <section className="ll-card space-y-3 p-5">
        <h2 className="font-display text-xl font-semibold">How the Local Score works</h2>
        <ul className="space-y-2">
          {Object.entries(SCORE_WEIGHTS).map(([key, w]) => (
            <li key={key} className="flex items-start justify-between gap-4 border-t border-line pt-2 first:border-t-0 first:pt-0">
              <div>
                <p className="text-sm font-semibold">{w.label}</p>
                <p className="text-xs text-muted">{w.explain}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-semibold tabular-nums text-clay">{w.max}</p>
            </li>
          ))}
        </ul>
        <p className="rounded-xl border border-line bg-parchment/60 p-3 text-xs leading-relaxed text-muted">
          Total 100. Ownership points are only awarded where we have evidence, so an unverified business scores low on
          ownership rather than being flattered with a guess. A chain is capped at 25 overall.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/walk" className="ll-card p-5">
          <p className="ll-label">Walk Local</p>
          <p className="mt-1 font-display text-lg font-semibold">Ready-made walking loops</p>
          <p className="mt-1 text-sm text-muted">Every stop is locally owned and within walking distance of the last.</p>
        </Link>
        <Link href="/impact" className="ll-card p-5">
          <p className="ll-label">Local Impact</p>
          <p className="mt-1 font-display text-lg font-semibold">See where your spending went</p>
          <p className="mt-1 text-sm text-muted">Estimated, clearly labelled, never dressed up as a receipt.</p>
        </Link>
      </section>
    </div>
  );
}