import type { Metadata } from "next";
import Link from "next/link";
import PlacesExplorer from "@/components/PlacesExplorer";
import { CATEGORIES } from "@/lib/data/catalog";
import type { IntentKey } from "@/lib/types";

export const metadata: Metadata = {
  title: "Discover Local",
  description: "Find locally owned food, shops, stays, experiences and trails.",
};

const VALID: IntentKey[] = ["eat", "shop", "stay", "experience", "explore", "buy"];

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  const initialIntent = VALID.includes(intent as IntentKey) ? (intent as IntentKey) : undefined;
  const active = CATEGORIES.find((c) => c.intent === initialIntent);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">{active ? active.name : "Discover Local"}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          {active ? active.blurb : "Places owned by the people who live here."}
        </h1>
        <p className="text-sm text-muted">
          Every listing shows its ownership status and Local Score, so you can see why it is here.
        </p>
      </header>

      <nav aria-label="Categories" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/places?intent=${c.intent}`}
            className={`ll-card flex items-center gap-2 p-3 text-sm font-semibold ${
              initialIntent === c.intent ? "border-clay/60 bg-clay-soft" : ""
            }`}
          >
            <span aria-hidden className="text-lg">
              {c.emoji}
            </span>
            {c.name}
          </Link>
        ))}
      </nav>

      <PlacesExplorer initialIntent={initialIntent} />
    </div>
  );
}