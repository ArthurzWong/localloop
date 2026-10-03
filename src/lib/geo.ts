import type { Business, BusinessHours } from "./types";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/** Walking time at 4.5 km/h plus a small fudge factor for town traffic. */
export function walkingMinutes(km: number): number {
  return Math.max(1, Math.round((km / 4.5) * 60 * 1.15));
}

export function formatWalkTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min walk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h walk` : `${h} h ${m} min walk`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * `now` must be supplied by the caller. Server and client can disagree about
 * the clock, so pages render open/closed status from a client-side effect.
 */
export function isOpenNow(hours: BusinessHours, now: Date): boolean {
  const day = now.getDay();
  if (hours.closedDays.includes(day)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  // Handles overnight windows such as 17:30 → 01:00.
  if (close <= open) return cur >= open || cur <= close;
  return cur >= open && cur < close;
}

export function hoursLabel(hours: BusinessHours): string {
  const closed = hours.closedDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(", ");
  const base = `${hours.open}–${hours.close}`;
  if (hours.open === "00:00" && hours.close === "23:59") {
    return closed ? `Open daily except ${closed}` : "Open daily, all hours";
  }
  return closed ? `${base}, closed ${closed}` : `${base} daily`;
}

export function todayHoursLabel(hours: BusinessHours, now: Date): string {
  if (hours.closedDays.includes(now.getDay())) return "Closed today";
  if (hours.open === "00:00" && hours.close === "23:59") return "Open all day";
  return `Today ${hours.open}–${hours.close}`;
}

export function directionsUrl(b: Pick<Business, "latitude" | "longitude" | "name">): string {
  // Google Maps deep link; swap for any provider without touching callers.
  const q = encodeURIComponent(`${b.latitude},${b.longitude}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&destination_place_id=&travelmode=walking`;
}

export function mapUrl(b: Pick<Business, "latitude" | "longitude">): string {
  return `https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=17/${b.latitude}/${b.longitude}`;
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}