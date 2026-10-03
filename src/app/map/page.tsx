import type { Metadata } from "next";
import MapExplorer from "@/components/MapExplorer";

export const metadata: Metadata = {
  title: "Map",
  description: "Every listed local business on one map, filtered by what matters to you.",
};

export default function MapPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <p className="ll-label">Map</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Local places, on one map</h1>
        <p className="text-sm text-muted">
          Filters only ever narrow the list — they never promote a business for money.
        </p>
      </header>
      <MapExplorer />
    </div>
  );
}