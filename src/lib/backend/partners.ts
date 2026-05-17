// Partner / perks reads from V1's real `trusted_partners` table.
// Public list = active partners only. Garage Pass UI shows categories +
// counts but gates benefitDetails / discountCode (members-only).

import { supabase } from "@/lib/supabase";
import { type PartnerCard } from "./types";

interface TrustedPartnerRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  benefit_details: string | null;
  discount_code: string | null;
  visibility_tier: string | null;
  is_active: boolean;
}

export async function listActivePartners(): Promise<PartnerCard[]> {
  try {
    const { data, error } = await supabase
      .from("trusted_partners")
      .select(
        "id, name, category, description, website, logo_url, benefit_details, discount_code, visibility_tier, is_active, display_order"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [];

    return (data as (TrustedPartnerRow & { display_order: number })[]).map(
      (r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        website: r.website,
        logoUrl: r.logo_url,
        benefitDetails: r.benefit_details,
        discountCode: r.discount_code,
        visibilityTier: r.visibility_tier,
        isActive: r.is_active,
      })
    );
  } catch {
    return [];
  }
}

/** Category -> count, for the Garage Pass teaser (no brand names revealed). */
export function summarizeByCategory(
  partners: PartnerCard[]
): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of partners) {
    const key = (p.category || "Other").trim();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
