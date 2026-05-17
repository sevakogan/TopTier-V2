// SERVER-ONLY. Two surfaces: public booking_requests (free-text status)
// and member bookings (enum status). Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const REQUEST_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "CLOSED",
] as const;
export const BOOKING_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export interface BookingRequest {
  id: string;
  reference_number: string | null;
  car_title: string | null;
  start_date: string | null;
  end_date: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  internal_notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  listing_id: string;
  listing_title: string | null;
  user_id: string;
  member_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  total_price_estimate_cents: number | null;
  notes_from_member: string | null;
  internal_notes: string | null;
  created_at: string;
}

export async function getBookings(): Promise<{
  requests: BookingRequest[];
  bookings: Booking[];
}> {
  const db = createServiceClient();

  const { data: reqs } = await db
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: bks } = await db
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const listingIds = Array.from(
    new Set((bks ?? []).map((b) => b.listing_id as string).filter(Boolean))
  );
  const userIds = Array.from(
    new Set((bks ?? []).map((b) => b.user_id as string).filter(Boolean))
  );
  const titleMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data: l } = await db
      .from("listings")
      .select("id, title")
      .in("id", listingIds);
    for (const x of l ?? [])
      titleMap.set(x.id as string, (x.title as string) ?? "");
  }
  if (userIds.length > 0) {
    const { data: p } = await db
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    for (const x of p ?? [])
      nameMap.set(
        x.id as string,
        (x.name as string) || (x.email as string) || ""
      );
  }

  return {
    requests: (reqs ?? []).map((r) => ({
      id: r.id as string,
      reference_number: (r.reference_number as string | null) ?? null,
      car_title: (r.car_title as string | null) ?? null,
      start_date: (r.start_date as string | null) ?? null,
      end_date: (r.end_date as string | null) ?? null,
      full_name: (r.full_name as string) ?? "",
      email: (r.email as string) ?? "",
      phone: (r.phone as string | null) ?? null,
      message: (r.message as string | null) ?? null,
      source: (r.source as string) ?? "web",
      status: (r.status as string) ?? "NEW",
      internal_notes: (r.internal_notes as string | null) ?? null,
      created_at: r.created_at as string,
    })),
    bookings: (bks ?? []).map((b) => ({
      id: b.id as string,
      listing_id: b.listing_id as string,
      listing_title: titleMap.get(b.listing_id as string) ?? null,
      user_id: b.user_id as string,
      member_name: nameMap.get(b.user_id as string) ?? null,
      start_date: b.start_date as string,
      end_date: b.end_date as string,
      status: (b.status as string) ?? "REQUESTED",
      total_price_estimate_cents:
        (b.total_price_estimate_cents as number | null) ?? null,
      notes_from_member: (b.notes_from_member as string | null) ?? null,
      internal_notes: (b.internal_notes as string | null) ?? null,
      created_at: b.created_at as string,
    })),
  };
}

export async function setRequest(
  id: string,
  patch: { status?: string; internal_notes?: string }
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("booking_requests")
    .update(patch)
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function setBooking(
  id: string,
  patch: { status?: string; internal_notes?: string }
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.internal_notes !== undefined)
    row.internal_notes = patch.internal_notes;
  const { error } = await db.from("bookings").update(row).eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
