"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data/catalog";
import { DEMO_DESTINATION } from "@/lib/data/businesses";
import { submitBusiness, useLocalState } from "@/lib/store";
import type { Business, OwnershipType } from "@/lib/types";

const EMOJI_BY_CATEGORY: Record<string, string> = {
  eat: "🍽️",
  shop: "🧺",
  stay: "🏡",
  experience: "🧑‍🌾",
  explore: "🚶",
  buy: "🎁",
};

const OWNERSHIP_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: "locally_owned", label: "Locally owned — the owner lives in this area" },
  { value: "family_owned", label: "Family owned" },
  { value: "locally_operated", label: "Locally operated — run here, owned elsewhere" },
  { value: "cooperative", label: "Cooperative / member owned" },
  { value: "independent", label: "Independent (single location)" },
  { value: "chain", label: "Part of a chain or franchise" },
  { value: "unknown", label: "Not sure" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export default function RegisterPage() {
  const state = useLocalState();
  const [mode, setMode] = useState<"owner" | "community">("owner");
  const [submitted, setSubmitted] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    category: "eat",
    address: "",
    latitude: String(DEMO_DESTINATION.latitude),
    longitude: String(DEMO_DESTINATION.longitude),
    description: "",
    yearsOperating: "1",
    localEmployeeCount: "1",
    localSupplierCount: "0",
    ownership: "locally_owned" as OwnershipType,
    localSourcing: "most",
    priceMin: "10",
    priceMax: "25",
    open: "09:00",
    close: "18:00",
    products: "",
    website: "",
    eco: [] as string[],
    claimedLocallyOwned: true,
    claimedLocallyOperated: true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 3) return setError("Please give the business name.");
    if (form.description.trim().length < 20)
      return setError("Please write at least a sentence describing the business.");
    if (mode === "owner" && !/^[\d+\s()-]{7,}$/.test(form.phone))
      return setError("Please add a contact phone number.");

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) return setError("Latitude looks invalid.");
    if (!Number.isFinite(lng) || Math.abs(lng) > 180) return setError("Longitude looks invalid.");

    const slug = slugify(form.name);
    if (!slug) return setError("Please give the business name.");

    const localSourcingPoints = { all: 20, most: 15, some: 8, little: 2 }[form.localSourcing] ?? 8;
    const employees = Math.max(0, Number(form.localEmployeeCount) || 0);
    const isLocalClaim =
      form.ownership === "locally_owned" || form.ownership === "family_owned" || form.ownership === "cooperative";

    const business: Business = {
      id: `local-${slug}`,
      slug,
      name: form.name.trim().slice(0, 80),
      categorySlug: form.category,
      description: form.description.trim().slice(0, 240),
      whyVisit: form.description.trim().slice(0, 500),
      whatsLocal:
        form.localSourcing === "all"
          ? "Owner states that all products and services are locally sourced or made."
          : form.localSourcing === "most"
            ? "Owner states that most products and services are locally sourced or made."
            : form.localSourcing === "some"
              ? "Owner states that some products and services are locally sourced."
              : "Owner states that little of what is sold is locally sourced.",
      story: "Submitted through LocalLoop. Not yet reviewed by an admin, so nothing here is presented as verified.",
      ownerName: form.ownerName.trim().slice(0, 60) || "Not disclosed",
      address: form.address.trim().slice(0, 120),
      latitude: lat,
      longitude: lng,
      phone: form.phone.trim() || "+60 0-000 0000",
      whatsapp: form.whatsapp.trim() || form.phone.trim() || "+60120000000",
      website: form.website.trim() || undefined,
      priceLevel: Number(form.priceMax) <= 15 ? 1 : Number(form.priceMax) <= 40 ? 2 : Number(form.priceMax) <= 90 ? 3 : 4,
      priceRange: `RM${form.priceMin}–${form.priceMax}`,
      ownershipType: form.ownership,
      // Claims are recorded, but points are withheld until an admin verifies.
      locallyOwned: isLocalClaim,
      locallyOperated: form.ownership !== "chain",
      verificationStatus: mode === "owner" ? "OWNER_VERIFIED" : "COMMUNITY_SUBMITTED",
      scoreInputs: {
        localOwnership: isLocalClaim ? 15 : 0,
        communityPresence: Math.min(20, employees * 2),
        localProducts: localSourcingPoints,
        independent: form.ownership === "chain" ? 0 : 15,
        sustainability: Math.min(10, form.eco.length * 2.5),
      },
      rating: 0,
      reviewCount: 0,
      popularity: 5,
      yearsOperating: Math.max(0, Number(form.yearsOperating) || 0),
      localEmployeeCount: employees,
      localSupplierCount: Math.max(0, Number(form.localSupplierCount) || 0),
      products: form.products
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 8),
      tags: [form.category],
      hours: {
        open: form.open,
        close: form.close,
        closedDays: [],
      },
      emoji: EMOJI_BY_CATEGORY[form.category] ?? "📍",
      ecoPractices: form.eco,
      status: "pending",
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    submitBusiness(business);
    setSubmitted(business);
  }

  if (submitted) {
    return (
      <div className="ll-card space-y-3 p-6">
        <p className="text-3xl" aria-hidden>
          ✅
        </p>
        <h1 className="font-display text-2xl font-semibold">Thanks — submission received</h1>
        <p className="text-sm text-muted">
          <strong className="text-ink">{submitted.name}</strong> has been submitted for verification. Until an admin
          checks it, the listing shows as{" "}
          <strong className="text-ink">
            {submitted.verificationStatus === "OWNER_VERIFIED" ? "owner verified" : "community submitted"}
          </strong>{" "}
          — never as &ldquo;verified local&rdquo;.
        </p>
        <ul className="space-y-1 rounded-xl border border-line bg-parchment/60 p-3 text-xs text-muted">
          <li>· Local ownership points are withheld until verification (currently {submitted.scoreInputs.localOwnership} / 30).</li>
          <li>· Everything you submitted is stored on this device in this MVP; production writes to Postgres with RLS.</li>
          <li>· You can review the queue in the admin dashboard.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="ll-btn ll-btn-primary">
            Open admin verification
          </Link>
          <Link href="/business" className="ll-btn ll-btn-ghost">
            Business dashboard
          </Link>
          <Link href={`/places/${submitted.slug}`} className="ll-btn ll-btn-ghost">
            View listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ll-label">{mode === "owner" ? "Business onboarding" : "Community submission"}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          {mode === "owner" ? "Get your business listed" : "Recommend a local business"}
        </h1>
        <p className="text-sm text-muted">
          No website, no SEO knowledge and no marketing budget needed. You do need to tell us who owns the business —
          that is the whole point of the listing.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("owner")}
            className={`ll-chip ${mode === "owner" ? "ll-chip-active" : ""}`}
          >
            I own the business
          </button>
          <button
            type="button"
            onClick={() => setMode("community")}
            className={`ll-chip ${mode === "community" ? "ll-chip-active" : ""}`}
          >
            I&apos;m recommending it
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Fieldset legend="The basics">
          <Field label="Business name *">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="ll-input" maxLength={80} />
          </Field>
          <Field label="Category *">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="ll-input">
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Products / services (comma separated)">
            <input
              value={form.products}
              onChange={(e) => set("products", e.target.value)}
              className="ll-input"
              placeholder="Hand-pulled noodles, wonton soup"
            />
          </Field>
          <Field label="Description *" wide>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={240}
              className="ll-input"
              placeholder="What do you sell, and what makes it local?"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Who owns it">
          <Field label="Ownership type *" wide>
            <select
              value={form.ownership}
              onChange={(e) => set("ownership", e.target.value as OwnershipType)}
              className="ll-input"
            >
              {OWNERSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How much is locally sourced or made?">
            <select value={form.localSourcing} onChange={(e) => set("localSourcing", e.target.value)} className="ll-input">
              <option value="all">All of it</option>
              <option value="most">Most of it</option>
              <option value="some">Some of it</option>
              <option value="little">Very little</option>
            </select>
          </Field>
          <Field label="Years operating">
            <input
              type="number"
              min={0}
              value={form.yearsOperating}
              onChange={(e) => set("yearsOperating", e.target.value)}
              className="ll-input"
            />
          </Field>
          <Field label="Local employees">
            <input
              type="number"
              min={0}
              value={form.localEmployeeCount}
              onChange={(e) => set("localEmployeeCount", e.target.value)}
              className="ll-input"
            />
          </Field>
          <Field label="Local suppliers">
            <input
              type="number"
              min={0}
              value={form.localSupplierCount}
              onChange={(e) => set("localSupplierCount", e.target.value)}
              className="ll-input"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Contact & hours">
          <Field label={mode === "owner" ? "Owner name" : "Who should we credit?"}>
            <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} className="ll-input" />
          </Field>
          <Field label={mode === "owner" ? "Phone *" : "Phone (optional)"}>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="ll-input" />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Opening time">
            <input type="time" value={form.open} onChange={(e) => set("open", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Closing time">
            <input type="time" value={form.close} onChange={(e) => set("close", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Price range from (RM)">
            <input type="number" min={0} value={form.priceMin} onChange={(e) => set("priceMin", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Price range to (RM)">
            <input type="number" min={0} value={form.priceMax} onChange={(e) => set("priceMax", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Website / social (optional)">
            <input value={form.website} onChange={(e) => set("website", e.target.value)} className="ll-input" />
          </Field>
        </Fieldset>

        <Fieldset legend="Location">
          <Field label="Latitude *">
            <input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} className="ll-input" />
          </Field>
          <Field label="Longitude *">
            <input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} className="ll-input" />
          </Field>
          <p className="text-[0.7rem] text-muted sm:col-span-2">
            In production this is captured by dropping a pin. Here you can paste coordinates — the demo defaults to
            Riverstone town centre.
          </p>
        </Fieldset>

        <Fieldset legend="Sustainability & community practices">
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            {[
              "Local sourcing",
              "Reusable / low-plastic packaging",
              "Composting or waste reduction",
              "Heritage building reuse",
              "Trains or hires local apprentices",
              "Cooperative or profit-sharing",
            ].map((practice) => {
              const on = form.eco.includes(practice);
              return (
                <button
                  key={practice}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set("eco", on ? form.eco.filter((x) => x !== practice) : [...form.eco, practice])
                  }
                  className={`ll-chip justify-start ${on ? "ll-chip-active" : ""}`}
                >
                  {on ? "✓ " : ""}
                  {practice}
                </button>
              );
            })}
          </div>
        </Fieldset>

        {error && (
          <p className="ll-card border-clay/40 bg-clay-soft p-4 text-sm text-clay-dark" role="alert">
            {error}
          </p>
        )}

        <div className="ll-card space-y-2 p-4">
          <p className="text-xs leading-relaxed text-muted">
            By submitting you agree that an admin may verify your ownership claim. Unverified submissions are labelled
            as such and never described as &ldquo;verified local&rdquo;. Submissions are rate-limited in production.
          </p>
          <button type="submit" className="ll-btn ll-btn-primary">
            Submit for verification
          </button>
        </div>
      </form>

      {state.submissions.length > 0 && (
        <p className="text-xs text-muted">
          You have {state.submissions.length} submission(s) on this device.{" "}
          <Link href="/business" className="font-semibold text-clay underline underline-offset-4">
            Open the business dashboard
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="ll-card space-y-3 p-4">
      <legend className="ll-label px-1">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="ll-label mb-1 block">{label}</span>
      {children}
    </label>
  );
}