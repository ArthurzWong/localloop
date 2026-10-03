import { OWNERSHIP_LABELS, TRUST_LABELS } from "@/lib/score";
import type { Business, VerificationStatus } from "@/lib/types";

export function TrustBadge({
  status,
  size = "sm",
}: {
  status: VerificationStatus;
  size?: "sm" | "xs";
}) {
  const t = TRUST_LABELS[status];
  return (
    <span
      title={t.explain}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
        size === "xs" ? "text-[0.68rem]" : "text-[0.75rem]"
      } ${t.tone}`}
    >
      <span aria-hidden>{status === "UNVERIFIED" ? "?" : status === "COMMUNITY_SUBMITTED" ? "◔" : "✓"}</span>
      {t.short}
    </span>
  );
}

export function OwnershipBadge({ business }: { business: Business }) {
  const label = OWNERSHIP_LABELS[business.ownershipType] ?? "Ownership unknown";
  const positive = business.locallyOwned && business.ownershipType !== "chain";
  return (
    <span className={`ll-chip ${positive ? "border-moss/30 bg-moss-soft text-moss" : ""}`}>
      {positive ? "✓ " : ""}
      {label}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="ll-chip border-honey/40 bg-honey-soft text-[0.68rem] text-ink/70" title="Fictional listing created for this demo">
      DEMO
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-moss text-white"
      : score >= 55
        ? "bg-honey text-white"
        : "bg-parchment text-muted border border-line";
  return (
    <span className={`inline-flex items-baseline gap-1 rounded-full px-2.5 py-1 font-bold ${tone}`}>
      <span className="text-sm leading-none">{score}</span>
      <span className="text-[0.6rem] font-semibold uppercase leading-none tracking-wide opacity-80">
        local score
      </span>
    </span>
  );
}