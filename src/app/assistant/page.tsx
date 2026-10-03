"use client";

import { useState } from "react";
import Link from "next/link";
import { DESTINATIONS } from "@/lib/data/businesses";
import { useLocalState } from "@/lib/store";

interface Match {
  slug: string;
  name: string;
  why: string;
  distanceKm: number;
  score: number;
}

interface Answer {
  answer: string;
  matches: Match[];
  mode: "retrieval" | "llm";
  notes: string[];
}

const SUGGESTIONS = [
  "Where can I have breakfast near me?",
  "I only have RM30.",
  "Show me something genuinely local.",
  "I want something my family won't find in a shopping mall.",
  "I have 2 hours before my bus.",
  "I want to walk and eat.",
];

export default function AssistantPage() {
  const state = useLocalState();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const destination = DESTINATIONS.find((d) => d.slug === state.destination) ?? DESTINATIONS[0];

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 3) {
      setError("Ask a slightly longer question.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          latitude: state.origin?.latitude,
          longitude: state.origin?.longitude,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "The assistant could not answer just now.");
      }
      setAnswer((await res.json()) as Answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">Local assistant</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Ask for what you actually want</h1>
        <p className="text-sm text-muted">
          It answers only from the LocalLoop database for {destination.name}. No invented businesses, no invented
          opening hours, no ownership guesses.
        </p>
      </header>

      <form
        className="ll-card space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label className="block">
          <span className="ll-label mb-1 block">Your question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            maxLength={400}
            className="ll-input"
            placeholder="Where can I have breakfast near me?"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={loading} className="ll-btn ll-btn-primary">
            {loading ? "Looking…" : "Ask"}
          </button>
          {answer && (
            <button
              type="button"
              onClick={() => {
                setAnswer(null);
                setQuestion("");
              }}
              className="ll-btn ll-btn-ghost"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                void ask(s);
              }}
              className="ll-chip hover:border-clay hover:text-clay"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p className="ll-card border-clay/40 bg-clay-soft p-4 text-sm text-clay-dark" role="alert">
          {error}
        </p>
      )}

      {loading && <div className="ll-card h-32 animate-pulse bg-white/60" />}

      {answer && !loading && (
        <section className="space-y-3">
          <div className="ll-card space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Answer</h2>
              <span className="ll-chip">
                {answer.mode === "llm" ? "Language model + database" : "Database retrieval"}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed">{answer.answer}</p>
            {answer.notes.length > 0 && (
              <ul className="space-y-1 border-t border-line pt-3 text-[0.7rem] text-muted">
                {answer.notes.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            )}
          </div>

          {answer.matches.length > 0 && (
            <ul className="space-y-2">
              {answer.matches.map((m) => (
                <li key={m.slug}>
                  <Link href={`/places/${m.slug}`} className="ll-card flex items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{m.name}</span>
                      <span className="block text-xs text-muted">
                        {m.distanceKm < 1 ? `${Math.round(m.distanceKm * 1000)} m` : `${m.distanceKm.toFixed(1)} km`}{" "}
                        · Local Score {m.score}
                      </span>
                      <span className="mt-1 block text-xs text-muted">{m.why}</span>
                    </span>
                    <span aria-hidden className="text-muted">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="ll-card space-y-2 p-4">
        <h2 className="font-display text-base font-semibold">Why it refuses to guess</h2>
        <p className="text-sm text-muted">
          A tourism assistant that invents a restaurant is worse than no assistant. This one is given a fixed candidate
          list per request and is instructed never to name anything outside it. If there is nothing verified nearby, it
          says exactly that.
        </p>
        <p className="text-[0.7rem] text-muted">
          Set <code>OPENAI_API_KEY</code> (and optionally <code>LLM_MODEL</code>) on the server to enable the
          language-model layer. Without it, the same questions are answered by the deterministic retrieval engine.
        </p>
      </section>
    </div>
  );
}