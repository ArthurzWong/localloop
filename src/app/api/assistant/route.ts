import { NextResponse } from "next/server";
import { assistantCandidates, answerFromCatalogue, ASSISTANT_SYSTEM_PROMPT, parseQuestion } from "@/lib/assistant";
import { DEMO_DESTINATION } from "@/lib/data/businesses";
import { queryBusinesses } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Server-side assistant endpoint.
 *
 * Security: any LLM key stays on the server. The browser only ever sees the
 * answer. If no key is configured we fall back to the deterministic retrieval
 * engine — which is the same data and the same rules, just without prose.
 */
export async function POST(request: Request) {
  let body: { question?: unknown; latitude?: unknown; longitude?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
  if (question.length < 3) {
    return NextResponse.json({ error: "Ask a slightly longer question." }, { status: 400 });
  }

  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  const origin =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { latitude: lat, longitude: lng }
      : { latitude: DEMO_DESTINATION.latitude, longitude: DEMO_DESTINATION.longitude };

  const now = new Date();
  const rows = queryBusinesses({}, origin, now);
  const parsed = parseQuestion(question);
  // A meal question needs the whole food list, not just the top-ranked places.
  const candidates = assistantCandidates(rows, origin, parsed.meal ? 30 : 16, parsed.meal ? "eat" : undefined);

  const fallback = answerFromCatalogue(question, candidates, { originLabel: "Riverstone" });

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ...fallback, mode: "retrieval" });
  }

  try {
    const candidateText = candidates
      .map(
        (c) =>
          `- ${c.business.name} (slug: ${c.business.slug}) | category: ${c.business.categorySlug} | ${
            c.distanceKm < 1 ? `${Math.round(c.distanceKm * 1000)}m` : `${c.distanceKm.toFixed(1)}km`
          } away | ${c.business.priceRange} | rating ${c.business.rating} (${c.business.reviewCount}) | ownership: ${
            c.business.ownershipType
          } | verification: ${c.business.verificationStatus} | open now: ${c.openNow ? "yes" : "no"} | hours ${
            c.business.hours.open
          }-${c.business.hours.close} | tags: ${c.business.tags.join(", ")} | what's local: ${c.business.whatsLocal}`,
      )
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `VISITOR QUESTION: ${question}\n\nCANDIDATES (the only businesses you may mention):\n${candidateText}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) throw new Error(`LLM HTTP ${response.status}`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty LLM response");

    return NextResponse.json({
      answer: text,
      matches: fallback.matches,
      mode: "llm",
      notes: ["Answer generated from the LocalLoop candidate list only.", ...fallback.notes],
    });
  } catch {
    // Never fail the visitor because a third-party API is down.
    return NextResponse.json({
      ...fallback,
      mode: "retrieval",
      notes: [...fallback.notes, "Language model unavailable — answered from the database directly."],
    });
  }
}