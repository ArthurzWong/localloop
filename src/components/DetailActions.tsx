"use client";

import { useState } from "react";
import { directionsUrl, formatDistance, walkingMinutes, whatsappUrl } from "@/lib/geo";
import { toggleSaved, useLocalState } from "@/lib/store";
import type { Business } from "@/lib/types";

export default function DetailActions({ business }: { business: Business }) {
  const state = useLocalState();
  const saved = state.saved.includes(business.slug);
  const [copied, setCopied] = useState(false);

  const shareText = `${business.name} — Local Score ${
    business.verificationStatus === "ADMIN_VERIFIED" ? "verified local" : business.verificationStatus.toLowerCase()
  }. ${business.whatsLocal}`;

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: business.name, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={directionsUrl(business)}
          target="_blank"
          rel="noopener noreferrer"
          className="ll-btn ll-btn-primary flex-1"
        >
          Get Directions
        </a>
        <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="ll-btn ll-btn-ghost">
          Call
        </a>
        <a
          href={whatsappUrl(business.whatsapp, `Hi ${business.name}, I found you on LocalLoop and would like to visit.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="ll-btn ll-btn-ghost"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => toggleSaved(business.slug)}
          aria-pressed={saved}
          className={`ll-btn ${saved ? "ll-btn-moss" : "ll-btn-ghost"}`}
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        <button type="button" onClick={share} className="ll-btn ll-btn-ghost">
          {copied ? "Link copied" : "Share"}
        </button>
      </div>
      <p className="text-[0.7rem] text-muted">
        Contact details are demo values for this fictional listing. Directions open in your map app and default to
        walking.
      </p>
    </div>
  );
}

export function DistanceLine({ business }: { business: Business }) {
  const state = useLocalState();
  const origin = state.origin;

  if (!origin) {
    return (
      <p className="text-sm text-muted">
        Share your location on the{" "}
        <a href="/places" className="font-semibold text-clay underline underline-offset-4">
          discover page
        </a>{" "}
        to see how far this is from you.
      </p>
    );
  }

  const km = haversine(
    origin.latitude,
    origin.longitude,
    business.latitude,
    business.longitude,
  );
  return (
    <p className="text-sm text-muted">
      {formatDistance(km)} from your location · about {walkingMinutes(km)} minutes on foot (straight-line estimate).
    </p>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}