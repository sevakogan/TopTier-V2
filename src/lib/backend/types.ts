// V1 backend schema — single source of truth for the real Supabase shape.
// V2 frontend talks to V1's production tables through this layer ONLY.
// Tables: profiles, member_profiles, invite_requests, trusted_partners,
//          events, garages. (Confirmed via PostgREST OpenAPI introspection.)

/** member_profiles.tier — V1 DatabaseTier (src/constants/lanes.ts). */
export type V1Tier =
  | "ACCESS" // "Non-Member" sentinel (also the column DEFAULT)
  | "CORE" // Core — $700/yr
  | "EXECUTIVE" // VIP — $3,000/yr
  | "EXECUTIVE_ELITE" // VIP — $3,000/yr
  | "STRATEGIC"; // Strategic Circle — $6,000/yr

/** member_profiles.membership_status / .status enum. */
export type V1MembershipStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "REJECTED"
  | "PAST_DUE"
  | "SUSPENDED"
  | "TERMINATED";

/** invite_requests.status — the inbound applicant queue lifecycle. */
export type V1InviteStatus =
  | "PENDING"
  | "APPROVED"
  | "CONVERTED"
  | "REJECTED";

/** invite_requests.selected_tier — V1 stores lowercase. */
export type V1SelectedTier = "core" | "vip" | "strategic";

/**
 * Where a signed-in user sits relative to membership.
 * - "garage_pass": authenticated, profiles row, no member_profiles, no live application
 * - "applied": has a PENDING/APPROVED invite_request (under review), still not a member
 * - "member": member_profiles row that is ACTIVE
 */
export type AccountStage = "garage_pass" | "applied" | "member";

export interface MemberSnapshot {
  stage: AccountStage;
  /** Display tier: "Garage Pass" | "Core" | "VIP" | "Strategic Circle". */
  tierDisplay: string;
  /** Raw V1 tier when a member_profiles row exists. */
  rawTier: V1Tier | null;
  membershipStatus: V1MembershipStatus | null;
  /** When stage === "applied": the tier they applied for + when. */
  appliedTier: V1SelectedTier | null;
  appliedAt: string | null;
}

export interface PartnerCard {
  id: string;
  name: string;
  category: string; // raw trusted_partners.category
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  /** Members-only fields — gate in the UI for Garage Pass users. */
  benefitDetails: string | null;
  discountCode: string | null;
  visibilityTier: string | null;
  isActive: boolean;
}

export interface AdminApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  car: string | null;
  selectedTier: V1SelectedTier | null;
  status: V1InviteStatus;
  referredBy: string | null;
  createdAt: string;
}

export interface AdminMember {
  memberProfileId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  tier: V1Tier | null;
  tierDisplay: string;
  membershipStatus: V1MembershipStatus | null;
  startedAt: string | null;
  expiresAt: string | null;
}

export interface GarageCar {
  id: string;
  carName: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  horsepower: number | null;
  mods: string | null;
  photos: string[] | null;
  featuredPhotoIndex: number | null;
}

/** UI tier label (what /garage/membership shows) → V1 invite_requests.selected_tier. */
export const UI_TIER_TO_V1: Record<string, V1SelectedTier> = {
  Core: "core",
  VIP: "vip",
  Strategic: "strategic",
  "Strategic Circle": "strategic",
};

/** V1 member_profiles.tier → human display. */
export function tierToDisplay(tier: V1Tier | null): string {
  switch (tier) {
    case "CORE":
      return "Core";
    case "EXECUTIVE":
    case "EXECUTIVE_ELITE":
      return "VIP";
    case "STRATEGIC":
      return "Strategic Circle";
    case "ACCESS":
    case null:
    default:
      return "Garage Pass";
  }
}
