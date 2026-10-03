import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import OpenStatus from "@/components/OpenStatus";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import DetailActions, { DistanceLine } from "@/components/DetailActions";
import VisitPanel, { ReviewsPanel } from "@/components/VisitPanel";
import { DemoBadge, OwnershipBadge, ScorePill, TrustBadge } from "@/components/Badges";
import { categoryEmoji, categoryName, getBusiness, publishedBusinesses } from "@/lib/repo";
import { cappedLocalScore, TRUST_LABELS } from "@/lib/score";
import { haversineKm, hoursLabel, mapUrl, walkingMinutes, formatWalkTime } from "@/lib/geo";
import { DEMO_DESTINATION } from "@/lib/data/businesses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = getBusiness(slug);
  if (!business) return { title: "Place not found" };
  return {
    title: business.name,
    description: business.description,
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = getBusiness(slug);
  if (!business) notFound();

  const score = cappedLocalScore(business);
  const trust = TRUST_LABELS[business.verificationStatus];
  const origin = { latitude: DEMO_DESTINATION.latitude, longitude: DEMO_DESTINATION.longitude };

  const nearby = publishedBusinesses()
    .filter((b) => b.slug !== business.slug)
    .map((b) => ({ b, km: haversineKm(origin, b) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, 3);

  return (
    <article className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-muted">
        <Link href="/places" className="hover:text-clay">
          Discover
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/places?intent=${business.categorySlug}`} className="hover:text-clay">
          {categoryName(business.categorySlug)}
        </Link>
      </nav>

      <div className="relative">
        <Photo
          src={business.photo}
          alt={`${business.name} — demo photo`}
          emoji={business.emoji}
          className="h-56 w-full rounded-3xl"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="ll-chip border-transparent bg-white/95">
            {categoryEmoji(business.categorySlug)} {categoryName(business.categorySlug)}
          </span>
          {business.isDemo && <DemoBadge />}
        </div>
        <div className="absolute right-3 top-3">
          <ScorePill score={score} />
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold leading-tight">{business.name}</h1>
        <p className="text-sm text-muted">{business.description}</p>
        <div className="flex flex-wrap gap-1.5">
          <TrustBadge status={business.verificationStatus} />
          <OwnershipBadge business={business} />
          <span className="ll-chip">{business.priceRange}</span>
          <span className="ll-chip">Since {new Date().getFullYear() - business.yearsOperating}</span>
        </div>
        <p className="rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-muted">
          <strong className="font-semibold text-ink">{trust.label}.</strong> {trust.explain}
        </p>
        <DistanceLine business={business} />
      </header>

      <DetailActions business={business} />

      <section className="ll-card space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">Why visit?</h2>
        <p className="text-sm leading-relaxed text-muted">{business.whyVisit}</p>

        <h3 className="font-display text-base font-semibold pt-1">What&apos;s local here?</h3>
        <p className="text-sm leading-relaxed text-muted">{business.whatsLocal}</p>

        <div className="grid grid-cols-3 gap-3 border-t border-line pt-3 text-center">
          <Stat value={business.localEmployeeCount} label="Local staff" />
          <Stat value={business.localSupplierCount} label="Local suppliers" />
          <Stat value={business.yearsOperating} label="Years trading" />
        </div>
      </section>

      <section className="ll-card space-y-2 border-l-4 border-l-clay p-4">
        <h2 className="font-display text-lg font-semibold">Why this place matters</h2>
        <p className="text-sm leading-relaxed text-muted">{business.story}</p>
        <p className="text-[0.7rem] text-muted">Owner: {business.ownerName} · Demo listing</p>
      </section>

      <ScoreBreakdown business={business} />

      <section className="ll-card space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">Good to know</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="ll-label">Opening hours</dt>
            <dd className="mt-0.5 text-muted">{hoursLabel(business.hours)}</dd>
          </div>
          <div>
            <dt className="ll-label">Address</dt>
            <dd className="mt-0.5 text-muted">{business.address}</dd>
          </div>
          <div>
            <dt className="ll-label">Price range</dt>
            <dd className="mt-0.5 text-muted">{business.priceRange}</dd>
          </div>
          <div>
            <dt className="ll-label">Category</dt>
            <dd className="mt-0.5 text-muted">{categoryName(business.categorySlug)}</dd>
          </div>
        </dl>

        <div>
          <p className="ll-label mb-1.5">Products &amp; services</p>
          <ul className="flex flex-wrap gap-1.5">
            {business.products.map((p) => (
              <li key={p} className="ll-chip">
                {p}
              </li>
            ))}
          </ul>
        </div>

        {business.ecoPractices.length > 0 && (
          <div>
            <p className="ll-label mb-1.5">Sustainability &amp; community practices</p>
            <ul className="space-y-1 text-sm text-muted">
              {business.ecoPractices.map((e) => (
                <li key={e}>♻︎ {e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <OpenStatus hours={business.hours} />
          <a
            href={mapUrl(business)}
            target="_blank"
            rel="noopener noreferrer"
            className="ll-chip hover:border-clay hover:text-clay"
          >
            View on map
          </a>
          <span className="ll-chip">
            {formatWalkTime(walkingMinutes(haversineKm(origin, business)))} from town centre
          </span>
        </div>
      </section>

      <VisitPanel business={business} />
      <ReviewsPanel business={business} />

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Also nearby</h2>
        <ul className="space-y-2">
          {nearby.map(({ b, km }) => (
            <li key={b.slug}>
              <Link href={`/places/${b.slug}`} className="ll-card flex items-center gap-3 p-3">
                <span aria-hidden className="text-2xl">
                  {b.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{b.name}</span>
                  <span className="block text-xs text-muted">
                    {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} · Local Score{" "}
                    {cappedLocalScore(b)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}