// A user's own cars from V1's real `garages` table.
// Client-side: RLS scopes garages to user_id = auth.uid().

import { supabase } from "@/lib/supabase";
import { type GarageCar } from "./types";

export async function listMyGarage(userId: string): Promise<GarageCar[]> {
  try {
    const { data, error } = await supabase
      .from("garages")
      .select(
        "id, car_name, brand, model, year, horsepower, mods, photos, featured_photo_index"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id as string,
      carName: (r.car_name as string | null) ?? null,
      brand: (r.brand as string | null) ?? null,
      model: (r.model as string | null) ?? null,
      year: (r.year as number | null) ?? null,
      horsepower: (r.horsepower as number | null) ?? null,
      mods: (r.mods as string | null) ?? null,
      photos: (r.photos as string[] | null) ?? null,
      featuredPhotoIndex: (r.featured_photo_index as number | null) ?? null,
    }));
  } catch {
    return [];
  }
}
