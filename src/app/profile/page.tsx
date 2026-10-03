"use client";

import Link from "next/link";
import { DEFAULT_PREFERENCES, resetLocalState, setPreferences, useLocalState } from "@/lib/store";

const INTERESTS = ["Food", "Crafts", "History", "Nature", "Culture", "Shopping", "Nightlife"];
const DIETARY = ["Vegetarian", "Vegan", "Halal", "Spicy", "Seafood"];

export default function ProfilePage() {
  const state = useLocalState();
  const p = state.preferences;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Profile</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Your travel style</h1>
        <p className="text-sm text-muted">
          All optional. LocalLoop works without an account, and none of this is required to discover places.
        </p>
      </header>

      <section className="ll-card space-y-4 p-4">
        <Group label="Who is travelling">
          {(["solo", "couple", "family", "friends"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={p.travelStyle === v}
              onClick={() => setPreferences({ travelStyle: v })}
              className={`ll-chip ${p.travelStyle === v ? "ll-chip-active" : ""}`}
            >
              {v}
            </button>
          ))}
        </Group>

        <Group label="Budget per stop">
          {(["low", "medium", "high"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={p.budget === v}
              onClick={() => setPreferences({ budget: v })}
              className={`ll-chip ${p.budget === v ? "ll-chip-active" : ""}`}
            >
              {v === "low" ? "Under RM20" : v === "medium" ? "RM20–60" : "RM60+"}
            </button>
          ))}
        </Group>

        <Group label="Interests">
          {INTERESTS.map((v) => {
            const on = p.interests.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setPreferences({ interests: on ? p.interests.filter((x) => x !== v) : [...p.interests, v] })
                }
                className={`ll-chip ${on ? "ll-chip-active" : ""}`}
              >
                {on ? "✓ " : ""}
                {v}
              </button>
            );
          })}
        </Group>

        <Group label="Dietary needs">
          {DIETARY.map((v) => {
            const on = p.dietary.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setPreferences({ dietary: on ? p.dietary.filter((x) => x !== v) : [...p.dietary, v] })}
                className={`ll-chip ${on ? "ll-chip-active" : ""}`}
              >
                {on ? "✓ " : ""}
                {v}
              </button>
            );
          })}
        </Group>

        <Group label="Getting around">
          <button
            type="button"
            aria-pressed={p.likesWalking}
            onClick={() => setPreferences({ likesWalking: !p.likesWalking })}
            className={`ll-chip ${p.likesWalking ? "ll-chip-active" : ""}`}
          >
            {p.likesWalking ? "✓ " : ""}I prefer walking
          </button>
        </Group>

        <p className="text-[0.7rem] text-muted">
          Preferences are stored on this device only. In the roadmap they feed the recommendation engine alongside
          budget, dietary needs, weather, time available and crowd levels — the MVP ranking is deliberately simple and
          transparent.
        </p>
      </section>

      <section className="ll-card space-y-3 p-4">
        <h2 className="font-display text-base font-semibold">Your data</h2>
        <ul className="space-y-1 text-sm text-muted">
          <li>· {state.saved.length} saved place(s)</li>
          <li>· {state.visited.length} visit(s) marked</li>
          <li>· {state.reviews.length} review(s) written</li>
          <li>· {state.submissions.length} business submission(s)</li>
          <li>· {Object.keys(state.decisions).length} admin decision(s)</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPreferences(DEFAULT_PREFERENCES);
            }}
            className="ll-btn ll-btn-ghost text-sm"
          >
            Reset preferences
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear saved places, visits, reviews, submissions and admin decisions on this device?")) {
                resetLocalState();
              }
            }}
            className="ll-btn ll-btn-ghost text-sm"
          >
            Clear all demo data
          </button>
        </div>
        <p className="text-[0.7rem] text-muted">
          Nothing is sent to a server in this MVP. Production stores this in Postgres with row-level security, and
          guest data migrates to an account only when the visitor chooses to create one.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/business" className="ll-card p-4">
          <p className="ll-label">For businesses</p>
          <p className="mt-1 font-display text-lg font-semibold">Business dashboard</p>
          <p className="mt-1 text-sm text-muted">Manage your listing and see its verification status.</p>
        </Link>
        <Link href="/admin" className="ll-card p-4">
          <p className="ll-label">For admins</p>
          <p className="mt-1 font-display text-lg font-semibold">Verification queue</p>
          <p className="mt-1 text-sm text-muted">Approve, reject and set ownership verification.</p>
        </Link>
      </section>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="ll-label mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}