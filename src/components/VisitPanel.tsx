"use client";

import { useState } from "react";
import { addReview, estimateSpend, markVisited, reviewStats, unmarkVisited, useLocalState } from "@/lib/store";
import { DEMO_REVIEWS } from "@/lib/data/catalog";
import type { Business } from "@/lib/types";

/** "Did you visit this place?" — the honest on-ramp to reviews and impact. */
export default function VisitPanel({ business }: { business: Business }) {
  const state = useLocalState();
  const visited = state.visited.includes(business.slug);
  const [askReview, setAskReview] = useState(false);
  const spend = estimateSpend(business);

  return (
    <section id="impact" className="ll-card space-y-3 p-4">
      <h2 className="font-display text-lg font-semibold">Did you visit this place?</h2>

      {!visited ? (
        <>
          <p className="text-sm text-muted">
            Marking a visit is how LocalLoop estimates your local impact. It is a self-report, not a transaction
            record.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                markVisited(business.slug);
                setAskReview(true);
              }}
              className="ll-btn ll-btn-primary"
            >
              Yes, I visited
            </button>
            <button type="button" onClick={() => setAskReview(false)} className="ll-btn ll-btn-ghost">
              Not yet
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="rounded-xl border border-moss/30 bg-moss-soft p-3 text-sm text-moss">
            You are supporting a local business. Estimated local spending from this visit: <strong>RM{spend}</strong>{" "}
            (the middle of the listed price range — an estimate, not a receipt).
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAskReview((v) => !v)} className="ll-btn ll-btn-ghost">
              {askReview ? "Close review form" : "Leave a review"}
            </button>
            <button type="button" onClick={() => unmarkVisited(business.slug)} className="ll-btn ll-btn-ghost">
              Undo visit
            </button>
            <a href="/impact" className="ll-btn ll-btn-primary">
              See my trip impact
            </a>
          </div>
        </>
      )}

      {askReview && <ReviewForm business={business} />}
    </section>
  );
}

function ReviewForm({ business }: { business: Business }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <form
      className="space-y-3 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = text.trim().replace(/https?:\/\/\S+/g, "").slice(0, 800);
        if (clean.length < 10) {
          setError("Please write at least a sentence — reviews without detail are not useful to anyone.");
          return;
        }
        if (/(.)\1{6,}/.test(clean)) {
          setError("That looks like spam. Please write something a real visitor would find useful.");
          return;
        }
        setError(null);
        addReview({
          businessSlug: business.slug,
          rating,
          text: clean,
          author: author.trim() || "LocalLoop visitor",
          visitedDate,
          verifiedVisit: true,
        });
        setDone(true);
        setText("");
      }}
    >
      {done && (
        <p className="rounded-xl border border-moss/30 bg-moss-soft p-3 text-sm text-moss">
          Thanks — your review is saved on this device and now counts toward the rating shown.
        </p>
      )}

      <fieldset>
        <legend className="ll-label mb-1">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={`h-9 w-9 rounded-full border text-sm ${
                rating >= n ? "border-honey bg-honey-soft text-honey" : "border-line bg-white text-muted"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="ll-label mb-1 block">What should other visitors know?</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={800}
          className="ll-input"
          placeholder="What did you eat, buy or experience? Who did you meet?"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="ll-label mb-1 block">Name (optional)</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={60} className="ll-input" />
        </label>
        <label className="block">
          <span className="ll-label mb-1 block">Date visited</span>
          <input
            type="date"
            value={visitedDate}
            onChange={(e) => setVisitedDate(e.target.value)}
            className="ll-input"
          />
        </label>
      </div>

      {error && <p className="rounded-xl border border-clay/40 bg-clay-soft p-3 text-sm text-clay-dark">{error}</p>}

      <button type="submit" className="ll-btn ll-btn-primary">
        Post review
      </button>
      <p className="text-[0.7rem] text-muted">
        Reviews are rate-limited to one per business per device. Businesses cannot edit or delete their own reviews.
      </p>
    </form>
  );
}

/** Merges seeded demo reviews with this visitor's own reviews. */
export function ReviewsPanel({ business }: { business: Business }) {
  const state = useLocalState();
  const stats = reviewStats(business.slug, business, state);
  const seeded = DEMO_REVIEWS.filter((r) => r.businessSlug === business.slug);
  const reviews = [...stats.localReviews, ...seeded];

  return (
    <section className="ll-card space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">Visitor reviews</h2>
        <p className="text-sm font-semibold">
          {stats.count > 0 ? `★ ${stats.rating.toFixed(1)} · ${stats.count} review${stats.count === 1 ? "" : "s"}` : "No reviews yet"}
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">
          No reviews yet. Reviews only come from visitors who say they have been here — a business cannot write its own.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">{r.author}</span>
                <span aria-hidden>·</span>
                <span aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}</span>
                <span aria-hidden>·</span>
                <span>visited {r.visitedDate}</span>
                {r.verifiedVisit && <span className="ll-chip border-moss/30 bg-moss-soft text-moss">Verified visit</span>}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[0.7rem] text-muted">
        Review text is sanitised on submission and links are stripped. Demo reviews are fictional.
      </p>
    </section>
  );
}