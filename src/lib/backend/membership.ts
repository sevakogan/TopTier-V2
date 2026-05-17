// Read a signed-in user's membership stage from V1's real tables.
// Client-side, uses the browser anon key + the user's session (V1's own
// useMemberTier.ts proves member_profiles allows user_id = auth.uid() reads).

import { supabase } from "@/lib/supabase";
import {
  type MemberSnapshot,
  type V1Tier,
  type V1MembershipStatus,
  type V1InviteStatus,
  type V1SelectedTier,
  tierToDisplay,
} from "./types";

const ACTIVE_MEMBER_STATUSES: V1MembershipStatus[] = ["ACTIVE", "PAST_DUE"];
const OPEN_APPLICATION_STATUSES: V1InviteStatus[] = ["PENDING", "APPROVED"];

/**
 * Resolve where the current user sits:
 *   member_profiles ACTIVE        -> "member"
 *   open invite_request           -> "applied"
 *   otherwise (profiles-only)     -> "garage_pass"  (V1 == "Non-Member"/ACCESS)
 */
export async function getMemberSnapshot(
  userId: string,
  email: string
): Promise<MemberSnapshot> {
  const fallback: MemberSnapshot = {
    stage: "garage_pass",
    tierDisplay: "Garage Pass",
    rawTier: null,
    membershipStatus: null,
    appliedTier: null,
    appliedAt: null,
  };

  try {
    const { data: mp } = await supabase
      .from("member_profiles")
      .select("tier, membership_status, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (mp) {
      const tier = (mp.tier as V1Tier | null) ?? null;
      const mStatus = (mp.membership_status as V1MembershipStatus | null) ?? null;
      // V1 footgun: `status` and `membership_status` both exist; treat ACTIVE
      // in EITHER as a live member (matches has_tier_access + admin code).
      const liveStatus =
        (mp.status as V1MembershipStatus | null) ?? mStatus ?? null;
      const isActiveMember =
        tier != null &&
        tier !== "ACCESS" &&
        (ACTIVE_MEMBER_STATUSES.includes(liveStatus as V1MembershipStatus) ||
          ACTIVE_MEMBER_STATUSES.includes(mStatus as V1MembershipStatus));

      if (isActiveMember) {
        return {
          stage: "member",
          tierDisplay: tierToDisplay(tier),
          rawTier: tier,
          membershipStatus: mStatus,
          appliedTier: null,
          appliedAt: null,
        };
      }
    }

    // Not a live member — is there an open application in the queue?
    const { data: inv } = await supabase
      .from("invite_requests")
      .select("selected_tier, status, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      inv &&
      OPEN_APPLICATION_STATUSES.includes(inv.status as V1InviteStatus)
    ) {
      return {
        stage: "applied",
        tierDisplay: "Garage Pass",
        rawTier: null,
        membershipStatus: null,
        appliedTier: (inv.selected_tier as V1SelectedTier | null) ?? null,
        appliedAt: (inv.created_at as string | null) ?? null,
      };
    }

    return fallback;
  } catch {
    return fallback;
  }
}
