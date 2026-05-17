// SERVER-ONLY. Rental supply pipeline: owner submissions + provider
// companies. Review workflow (status + admin_notes + reviewer stamp).
// Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const RENTAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export interface RentalSubmission {
  id: string;
  company_name: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_color: string | null;
  description: string | null;
  photos: string[] | null;
  daily_rate_cents: number;
  broker_net_rate_cents: number | null;
  location_city: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RentalProvider {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  fleet_size: number | null;
  fleet_description: string | null;
  service_areas: string | null;
  logo_url: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export async function getRentals(): Promise<{
  submissions: RentalSubmission[];
  providers: RentalProvider[];
}> {
  const db = createServiceClient();
  const [{ data: s }, { data: p }] = await Promise.all([
    db
      .from("rental_submissions")
      .select("*")
      .order("created_at", { ascending: false }),
    db
      .from("rental_providers")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  return {
    submissions: (s ?? []) as RentalSubmission[],
    providers: (p ?? []) as RentalProvider[],
  };
}

async function review(
  table: "rental_submissions" | "rental_providers",
  id: string,
  patch: { status?: string; admin_notes?: string },
  actorId: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) {
    row.status = patch.status;
    row.reviewed_at = new Date().toISOString();
    row.reviewed_by = actorId;
  }
  if (patch.admin_notes !== undefined) row.admin_notes = patch.admin_notes;
  const { error } = await db.from(table).update(row).eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export const reviewSubmission = (
  id: string,
  patch: { status?: string; admin_notes?: string },
  actorId: string
) => review("rental_submissions", id, patch, actorId);

export const reviewProvider = (
  id: string,
  patch: { status?: string; admin_notes?: string },
  actorId: string
) => review("rental_providers", id, patch, actorId);
