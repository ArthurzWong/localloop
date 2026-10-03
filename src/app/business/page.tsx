"use client";

import { useState } from "react";
import Link from "next/link";
import { TRUST_LABELS } from "@/lib/score";
import { estimateSpend, formatRM } from "@/lib/pricing";
import { updateSubmission, useLocalState } from "@/lib/store";
import type { Business } from "@/lib/types";

/**
 * Business dashboard. In this MVP an owner's listing lives on their device;
 * in production the same screen reads from Postgres with a row-level policy
 * that only lets an owner edit their own business.
 */
export default function BusinessDashboardPage() {
  const state = useLocalState();
  const [editing, setEditing] = useState<string | null>(null);

  const mine = state.submissions;
  const decided = state.decisions;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Business dashboard</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Your listings</h1>
        <p className="text-sm text-muted">
          Only you can edit your own business. Verification status is set by an admin, never by the business.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/business/register" className="ll-btn ll-btn-primary">
            Add another listing
          </Link>
          <Link href="/admin" className="ll-btn ll-btn-ghost">
            Admin verification
          </Link>
        </div>
      </header>

      {!state.hydrated ? (
        <div className="ll-card h-40 animate-pulse bg-white/60" />
      ) : mine.length === 0 ? (
        <div className="ll-card space-y-2 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            🏪
          </p>
          <h2 className="font-display text-lg font-semibold">No listings yet</h2>
          <p className="text-sm text-muted">
            Registering takes a few minutes and does not need a website, an SEO budget or any technical knowledge.
          </p>
          <Link href="/business/register" className="ll-btn ll-btn-primary mx-auto">
            Get listed
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {mine.map((b) => {
            const decision = decided[b.slug];
            const status = decision?.status ?? b.status;
            const verification = decision?.verificationStatus ?? b.verificationStatus;
            return (
              <li key={b.slug} className="ll-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden className="text-3xl">
                    {b.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold">{b.name}</h2>
                    <p className="text-xs text-muted">{b.address || "No address given"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`ll-chip ${
                          status === "published"
                            ? "border-moss/30 bg-moss-soft text-moss"
                            : status === "rejected"
                              ? "border-clay/40 bg-clay-soft text-clay-dark"
                              : "border-honey/40 bg-honey-soft"
                        }`}
                      >
                        {status === "published" ? "Published" : status === "rejected" ? "Rejected" : "Pending review"}
                      </span>
                      <span className="ll-chip">{TRUST_LABELS[verification].short}</span>
                      <span className="ll-chip">Est. spend {formatRM(estimateSpend(b))} per visit</span>
                    </div>
                    {decision?.note && <p className="mt-2 text-xs text-muted">Admin note: {decision.note}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(editing === b.slug ? null : b.slug)}
                    className="ll-btn ll-btn-ghost text-sm"
                  >
                    {editing === b.slug ? "Close editor" : "Edit listing"}
                  </button>
                  <Link href={`/places/${b.slug}`} className="ll-btn ll-btn-ghost text-sm">
                    View public page
                  </Link>
                </div>

                {editing === b.slug && <EditForm business={b} />}
              </li>
            );
          })}
        </ul>
      )}

      <section className="ll-card space-y-3 p-4">
        <h2 className="font-display text-base font-semibold">What you get (and what you don&apos;t)</h2>
        <ul className="space-y-1.5 text-sm text-muted">
          <li>· Free basic listing, always.</li>
          <li>· Verification raises your Local Score by up to 15 points — evidence, not payment.</li>
          <li>· No paid placement can push you above a more locally rooted business.</li>
          <li>· You cannot edit or remove visitor reviews.</li>
        </ul>
        <p className="text-[0.7rem] text-muted">
          Business analytics, bookings and payments are Phase 2 features and are not implemented in this MVP.
        </p>
      </section>
    </div>
  );
}

function EditForm({ business }: { business: Business }) {
  const [description, setDescription] = useState(business.description);
  const [products, setProducts] = useState(business.products.join(", "));
  const [open, setOpen] = useState(business.hours.open);
  const [close, setClose] = useState(business.hours.close);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-3 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        updateSubmission(business.slug, {
          description: description.trim().slice(0, 240),
          products: products
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 8),
          hours: { ...business.hours, open, close },
        });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      }}
    >
      <label className="block">
        <span className="ll-label mb-1 block">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={240}
          className="ll-input"
        />
      </label>
      <label className="block">
        <span className="ll-label mb-1 block">Products / services</span>
        <input value={products} onChange={(e) => setProducts(e.target.value)} className="ll-input" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="ll-label mb-1 block">Opens</span>
          <input type="time" value={open} onChange={(e) => setOpen(e.target.value)} className="ll-input" />
        </label>
        <label className="block">
          <span className="ll-label mb-1 block">Closes</span>
          <input type="time" value={close} onChange={(e) => setClose(e.target.value)} className="ll-input" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="ll-btn ll-btn-primary text-sm">
          Save changes
        </button>
        {saved && <span className="text-xs font-semibold text-moss">Saved.</span>}
      </div>
    </form>
  );
}