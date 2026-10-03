"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScoreInputsEditor } from "@/components/ScoreBreakdown";
import { CATEGORIES } from "@/lib/data/catalog";
import { platformStats, publishedBusinesses, pendingBusinesses } from "@/lib/repo";
import { cappedLocalScore, scoreBreakdown, TRUST_LABELS } from "@/lib/score";
import { estimateSpend, formatRM } from "@/lib/pricing";
import {
  decideSubmission,
  deleteReview,
  setScoreOverride,
  useLocalState,
  withOverrides,
} from "@/lib/store";
import type { Business, VerificationStatus } from "@/lib/types";

const TABS = ["Queue", "Listings", "Reviews", "Impact", "Categories"] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS: VerificationStatus[] = [
  "UNVERIFIED",
  "COMMUNITY_SUBMITTED",
  "OWNER_VERIFIED",
  "ADMIN_VERIFIED",
  "COMMUNITY_VERIFIED",
];

export default function AdminPage() {
  const state = useLocalState();
  const [tab, setTab] = useState<Tab>("Queue");
  const [selected, setSelected] = useState<string | null>(null);

  const seedPending = pendingBusinesses();
  const queue = useMemo(() => {
    const rows: { business: Business; source: "seed" | "local" }[] = [
      ...seedPending.map((b) => ({ business: b, source: "seed" as const })),
      ...state.submissions.map((b) => ({ business: b, source: "local" as const })),
    ];
    return rows.filter((r) => (state.decisions[r.business.slug]?.status ?? "pending") === "pending");
  }, [seedPending, state.submissions, state.decisions]);

  const decided = Object.entries(state.decisions);
  const listings = publishedBusinesses().map((b) => withOverrides(b, state.scoreOverrides));
  const stats = platformStats();

  const localReviews = state.reviews;
  const allReviewed = [...localReviews];

  const visitedSpend = useMemo(() => {
    const all = [...publishedBusinesses(), ...state.submissions];
    return all
      .filter((b) => state.visited.includes(b.slug))
      .reduce((sum, b) => sum + estimateSpend(b), 0);
  }, [state.visited, state.submissions]);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Admin</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Verification &amp; moderation</h1>
        <p className="text-sm text-muted">
          In this MVP admin actions are applied on this device. In production every action here is a server action
          behind an admin role check — the UI is not the security boundary.
        </p>
        <div className="rounded-xl border border-clay/40 bg-clay-soft p-3 text-xs text-clay-dark">
          No sign-in gate is implemented in the MVP demo. Do not deploy this as-is with real business data — wire
          Supabase Auth with an <code>admin_users</code> table first.
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-current={tab === t ? "true" : undefined}
            onClick={() => setTab(t)}
            className={`ll-chip ${tab === t ? "ll-chip-active" : ""}`}
          >
            {t}
            {t === "Queue" && queue.length > 0 && ` (${queue.length})`}
          </button>
        ))}
      </nav>

      {tab === "Queue" && (
        <section className="space-y-3">
          {queue.length === 0 ? (
            <Empty title="Nothing waiting for verification" body="Every submitted business has been decided. New submissions will appear here." />
          ) : (
            queue.map(({ business, source }) => (
              <article key={business.slug} className="ll-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden className="text-3xl">
                    {business.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold">{business.name}</h2>
                    <p className="text-xs text-muted">
                      {business.address || "No address"} · {business.ownershipType.replace(/_/g, " ")} ·{" "}
                      {business.localEmployeeCount} local staff
                    </p>
                    <p className="mt-1 text-sm text-muted">{business.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="ll-chip">{TRUST_LABELS[business.verificationStatus].short}</span>
                      <span className="ll-chip">{source === "seed" ? "Seeded demo submission" : "Visitor submission"}</span>
                      <span className="ll-chip">
                        Claimed ownership points: {business.scoreInputs.localOwnership} / 30
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      decideSubmission(business.slug, {
                        status: "published",
                        verificationStatus: "ADMIN_VERIFIED",
                        note: "Ownership evidence checked by admin.",
                      });
                      // Verification is what unlocks the withheld ownership points.
                      setScoreOverride(business.slug, { localOwnership: 30, independent: 15 });
                    }}
                    className="ll-btn ll-btn-primary text-sm"
                  >
                    Approve &amp; verify local
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      decideSubmission(business.slug, {
                        status: "published",
                        verificationStatus: "COMMUNITY_SUBMITTED",
                        note: "Published without ownership verification.",
                      })
                    }
                    className="ll-btn ll-btn-ghost text-sm"
                  >
                    Publish as unverified
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      decideSubmission(business.slug, {
                        status: "rejected",
                        verificationStatus: "UNVERIFIED",
                        note: "Could not be verified / duplicate.",
                      })
                    }
                    className="ll-btn ll-btn-ghost text-sm"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {tab === "Listings" && (
        <section className="space-y-3">
          <p className="text-xs text-muted">
            {listings.length} published listings. Select one to edit the Local Score inputs — the same inputs a
            verification would set.
          </p>
          <ul className="space-y-2">
            {listings.map((b) => {
              const open = selected === b.slug;
              const lines = scoreBreakdown(b);
              return (
                <li key={b.slug} className="ll-card p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span aria-hidden className="text-xl">
                      {b.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs text-muted">
                        {b.ownershipType.replace(/_/g, " ")} · {TRUST_LABELS[b.verificationStatus].short} · score{" "}
                        {cappedLocalScore(b)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(open ? null : b.slug)}
                      className="ll-btn ll-btn-ghost text-sm"
                    >
                      {open ? "Close" : "Edit score"}
                    </button>
                    <Link href={`/places/${b.slug}`} className="ll-btn ll-btn-ghost text-sm">
                      View
                    </Link>
                  </div>

                  {open && (
                    <div className="mt-3 space-y-3 border-t border-line pt-3">
                      <ScoreInputsEditor
                        inputs={b.scoreInputs}
                        onChange={(patch) => setScoreOverride(b.slug, patch)}
                      />
                      <ul className="grid gap-1 text-xs text-muted sm:grid-cols-2">
                        {lines.map((l) => (
                          <li key={l.key} className="flex justify-between">
                            <span>
                              {l.label}
                              {l.derived && " (derived)"}
                            </span>
                            <span className="tabular-nums">
                              {l.points} / {l.max}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[0.7rem] text-muted">
                        Review points are derived from visitor ratings and cannot be edited here.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "Reviews" && (
        <section className="space-y-3">
          {allReviewed.length === 0 ? (
            <Empty
              title="No visitor reviews yet"
              body="Reviews written on this device appear here. Seeded demo reviews are shown on each listing page."
            />
          ) : (
            <ul className="space-y-2">
              {allReviewed.map((r) => (
                <li key={r.id} className="ll-card space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-ink">{r.author}</span>
                    <span>{"★".repeat(r.rating)}</span>
                    <span>{r.businessSlug}</span>
                    <span>visited {r.visitedDate}</span>
                  </div>
                  <p className="text-sm text-muted">{r.text}</p>
                  <button type="button" onClick={() => deleteReview(r.id)} className="ll-btn ll-btn-ghost text-sm">
                    Remove review
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="ll-card space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">Anti-gaming rules in force</h2>
            <ul className="space-y-1 text-sm text-muted">
              <li>· A business cannot write, edit or delete its own reviews.</li>
              <li>· Review text is length-checked, link-stripped and repeat-character checked on submit.</li>
              <li>· Ownership points are withheld until an admin verifies the claim.</li>
              <li>· Chains are capped at 25 overall regardless of visitor ratings.</li>
            </ul>
          </div>
        </section>
      )}

      {tab === "Impact" && (
        <section className="space-y-3">
          <div className="ll-card space-y-3 p-4">
            <h2 className="font-display text-base font-semibold">Platform statistics</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Listings" value={String(stats.total)} />
              <Stat label="Verified" value={String(stats.verified)} />
              <Stat label="Locally owned" value={String(stats.localOwned)} />
              <Stat label="Local jobs" value={String(stats.localEmployees)} />
            </dl>
            <p className="text-xs text-muted">
              Average Local Score across published listings: <strong className="text-ink">{stats.avgScore}</strong>
            </p>
          </div>

          <div className="ll-card space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">This device&apos;s tourist activity</h2>
            <dl className="grid grid-cols-2 gap-3">
              <Stat label="Places visited" value={String(state.visited.length)} />
              <Stat label="Estimated spend" value={formatRM(visitedSpend)} />
              <Stat label="Saved places" value={String(state.saved.length)} />
              <Stat label="Reviews written" value={String(state.reviews.length)} />
            </dl>
            <p className="text-[0.7rem] text-muted">
              Estimated spend is the sum of the middle of each visited business&apos;s price range. It is not
              transaction data.
            </p>
          </div>

          <div className="ll-card space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">Decisions made</h2>
            {decided.length === 0 ? (
              <p className="text-sm text-muted">No verification decisions yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {decided.map(([slug, d]) => (
                  <li key={slug} className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{slug}</span>
                    <span className="ll-chip">{d.status}</span>
                    <span className="ll-chip">{TRUST_LABELS[d.verificationStatus].short}</span>
                    <span className="text-xs text-muted">{d.note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ll-card space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">Reported businesses</h2>
            <p className="text-sm text-muted">
              Nothing reported. Reporting is a Phase 2 feature; the moderation queue above is the MVP substitute.
            </p>
          </div>
        </section>
      )}

      {tab === "Categories" && (
        <section className="space-y-3">
          <p className="text-xs text-muted">
            Categories are database rows, not hard-coded UI, so the taxonomy can grow without a code change.
          </p>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => {
              const count = publishedBusinesses().filter((b) => b.categorySlug === c.slug).length;
              return (
                <li key={c.slug} className="ll-card flex items-center gap-3 p-3">
                  <span aria-hidden className="text-2xl">
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">{c.blurb}</p>
                  </div>
                  <span className="ll-chip">{count} listings</span>
                </li>
              );
            })}
          </ul>
          <div className="ll-card p-4">
            <h2 className="font-display text-base font-semibold">Featured businesses</h2>
            <p className="mt-1 text-sm text-muted">
              Not implemented on purpose. The brief is explicit that sponsored placement must never override local
              relevance, so the MVP ships with no featured slot at all rather than a half-safe one.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="ll-card space-y-1 p-6 text-center">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
    </div>
  );
}