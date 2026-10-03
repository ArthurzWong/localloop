"use client";

import { useState } from "react";
import { scoreBreakdown } from "@/lib/score";
import type { Business, ScoreInputs } from "@/lib/types";

/**
 * The Local Score is deliberately explainable. This component is the whole
 * transparency story: every point, its ceiling, and what it means.
 */
export default function ScoreBreakdown({
  business,
  compact = false,
}: {
  business: Pick<Business, "scoreInputs" | "rating" | "reviewCount" | "ownershipType" | "verificationStatus">;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const lines = scoreBreakdown(business);
  const total = lines.reduce((s, l) => s + l.points, 0);
  const capped = business.ownershipType === "chain" ? Math.min(total, 25) : total;

  return (
    <section className="ll-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Local Score</h2>
          <p className="text-sm text-muted">
            {capped} / 100 — how much of your money is likely to stay in the local economy.
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-semibold text-white">
          {capped}
        </span>
      </div>

      {business.ownershipType === "chain" && (
        <p className="mt-3 rounded-xl border border-line bg-parchment p-3 text-xs text-muted">
          This listing is part of a chain, so the score is capped at 25 no matter how pleasant it is. LocalLoop does
          not hide chains — it stops them from being scored as if they were local.
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 text-sm font-semibold text-clay underline decoration-clay/40 underline-offset-4"
      >
        {open ? "Hide the calculation" : "How is this score calculated?"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2.5">
            {lines.map((line) => (
              <li key={line.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {line.label}
                    {line.derived && (
                      <span className="ml-1.5 rounded-full bg-parchment px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted">
                        derived
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted">
                    {line.points} / {line.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-parchment">
                  <div
                    className="h-full rounded-full bg-clay"
                    style={{ width: `${(line.points / line.max) * 100}%` }}
                  />
                </div>
                {!compact && <p className="mt-1 text-xs text-muted">{line.explain}</p>}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-line bg-parchment/60 p-3 text-xs leading-relaxed text-muted">
            <p className="mb-1 font-semibold text-ink">How to read this</p>
            <p>
              The Local Score is a transparent heuristic, not a scientific measurement. Ownership points are only
              awarded where we have evidence — an unverified business shows a low ownership score rather than a
              guess. Review points are derived from visitor ratings and cannot be edited by the business.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Small inline meter used on cards and in the admin editor. */
export function ScoreInputsEditor({
  inputs,
  onChange,
}: {
  inputs: ScoreInputs;
  onChange: (patch: Partial<ScoreInputs>) => void;
}) {
  const fields: { key: keyof ScoreInputs; label: string; max: number }[] = [
    { key: "localOwnership", label: "Local ownership", max: 30 },
    { key: "communityPresence", label: "Community presence", max: 20 },
    { key: "localProducts", label: "Local products", max: 20 },
    { key: "independent", label: "Independent business", max: 15 },
    { key: "sustainability", label: "Sustainability", max: 10 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f.key} className="text-sm">
          <span className="mb-1 flex items-center justify-between font-medium">
            {f.label}
            <span className="tabular-nums text-muted">
              {inputs[f.key]} / {f.max}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={f.max}
            value={inputs[f.key]}
            onChange={(e) => onChange({ [f.key]: Number(e.target.value) } as Partial<ScoreInputs>)}
            className="w-full accent-clay"
          />
        </label>
      ))}
    </div>
  );
}