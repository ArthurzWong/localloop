// LocalLoop — core domain types.
// Keep this file free of framework code so the data layer can be swapped
// (SQLite / Supabase / Postgres) without touching the UI.

export type OwnershipType =
  | "locally_owned"
  | "locally_operated"
  | "family_owned"
  | "cooperative"
  | "independent"
  | "chain"
  | "unknown";

export type VerificationStatus =
  | "UNVERIFIED"
  | "COMMUNITY_SUBMITTED"
  | "OWNER_VERIFIED"
  | "ADMIN_VERIFIED"
  | "COMMUNITY_VERIFIED";

export type IntentKey = "eat" | "shop" | "stay" | "experience" | "explore" | "buy";

export type BusinessStatus = "published" | "pending" | "rejected";

export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  intent: IntentKey;
  blurb: string;
}

export interface ScoreInputs {
  /** Local ownership — max 30 */
  localOwnership: number;
  /** Community presence — max 20 */
  communityPresence: number;
  /** Local products / services — max 20 */
  localProducts: number;
  /** Independent business — max 15 */
  independent: number;
  /** Sustainability & community practices — max 10 */
  sustainability: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  /** Short one-liner used on cards. */
  description: string;
  /** Longer "Why visit?" copy for the detail page. */
  whyVisit: string;
  /** "What's local here?" — the local-value explanation. */
  whatsLocal: string;
  /** Human story: "Why this place matters". */
  story: string;
  ownerName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string;
  website?: string;
  /** 1 = cheap … 4 = expensive */
  priceLevel: 1 | 2 | 3 | 4;
  priceRange: string;
  ownershipType: OwnershipType;
  locallyOwned: boolean;
  locallyOperated: boolean;
  verificationStatus: VerificationStatus;
  scoreInputs: ScoreInputs;
  rating: number;
  reviewCount: number;
  popularity: number;
  yearsOperating: number;
  localEmployeeCount: number;
  localSupplierCount: number;
  products: string[];
  /** Free-form discovery tags: "breakfast", "vegetarian", "nature", "handicraft"… */
  tags: string[];
  hours: BusinessHours;
  photo?: string;
  emoji: string;
  ecoPractices: string[];
  status: BusinessStatus;
  /** Demo businesses are explicitly labelled so nobody mistakes them for real. */
  isDemo: boolean;
  createdAt: string;
}

export interface BusinessHours {
  /** "HH:MM" 24h, local time. */
  open: string;
  close: string;
  /** 0 = Sunday … 6 = Saturday */
  closedDays: number[];
}

export interface Review {
  id: string;
  businessSlug: string;
  author: string;
  rating: number;
  text: string;
  visitedDate: string;
  verifiedVisit: boolean;
  createdAt: string;
}

export interface RouteStop {
  businessSlug: string;
  note: string;
}

export interface WalkRoute {
  id: string;
  slug: string;
  name: string;
  destination: string;
  summary: string;
  stops: RouteStop[];
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  latitude: number;
  longitude: number;
}

export type SortKey = "recommended" | "distance" | "score" | "rating" | "open";

export interface BusinessFilters {
  intent?: IntentKey;
  category?: string;
  q?: string;
  openNow?: boolean;
  under20?: boolean;
  walking?: boolean;
  locallyOwned?: boolean;
  familyOwned?: boolean;
  eco?: boolean;
  highlyRated?: boolean;
  maxKm?: number;
  sort?: SortKey;
  includePending?: boolean;
}

export interface RankedBusiness {
  business: Business;
  distanceKm: number;
  score: number;
  openNow: boolean;
  /** 0–100 breakdown of the ranking formula, for transparency. */
  rankParts: { label: string; points: number; max: number }[];
  rankScore: number;
}