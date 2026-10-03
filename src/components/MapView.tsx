"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { Business } from "@/lib/types";

export interface MapPoint {
  business: Business;
  distanceKm: number;
  score: number;
}

/**
 * Leaflet is loaded lazily inside an effect: it touches `window` at import time,
 * so it must never be pulled into the server render.
 */
export default function MapView({
  points,
  origin,
  originLabel,
  height = 380,
}: {
  points: MapPoint[];
  origin: { latitude: number; longitude: number };
  originLabel?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [origin.latitude, origin.longitude],
          zoom: 14,
          scrollWheelZoom: false,
          attributionControl: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      if (originLabel) {
        L.marker([origin.latitude, origin.longitude], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:#241c15;color:#fff;border-radius:999px;padding:4px 10px;font:600 11px system-ui;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">${originLabel}</div>`,
            iconSize: [80, 24],
            iconAnchor: [40, 12],
          }),
        }).addTo(layer);
      }

      for (const p of points) {
        const b = p.business;
        const marker = L.marker([b.latitude, b.longitude], {
          icon: L.divIcon({
            className: "",
            html: `<div style="display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:#fff;border:2px solid #c4552b;font-size:17px;box-shadow:0 2px 6px rgba(36,28,21,.25)">${b.emoji}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
          title: b.name,
        });
        marker.bindPopup(
          `<div style="min-width:190px">
             <strong style="display:block;font-size:14px">${escapeHtml(b.name)}</strong>
             <span style="color:#6f6255;font-size:12px">${p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`} away · Local Score ${p.score}</span>
             <span style="display:block;color:#6f6255;font-size:12px;margin-top:2px">${escapeHtml(b.priceRange)}</span>
             <a href="/places/${b.slug}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#c4552b">View Place →</a>
           </div>`,
        );
        marker.addTo(layer);
      }

      map.setView([origin.latitude, origin.longitude], points.length > 0 ? 14 : 13);
    })();

    return () => {
      cancelled = true;
    };
  }, [points, origin, originLabel]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`Map showing ${points.length} local businesses`}
      className="w-full overflow-hidden rounded-2xl border border-line"
      style={{ height }}
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}