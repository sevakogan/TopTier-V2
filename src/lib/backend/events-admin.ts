// SERVER-ONLY. Events admin over the REAL data model: events are
// `listings` with type='EXPERIENCE'; attendees live in
// `event_registrations` (keyed by listing_id). Waitlist promote +
// reindex runs server-side (fixes V1's race-prone client loop).
// Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_end_date: string | null;
  location_city: string | null;
  location_country: string | null;
  category: string | null;
  max_capacity: number | null;
  current_bookings: number;
  is_active: boolean;
  is_featured: boolean;
  rsvp_enabled: boolean;
  allowed_tiers: string[] | null;
  images: string[] | null;
  confirmedCount: number;
  waitlistCount: number;
  checkedInCount: number;
}

export interface Attendee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  instagram: string | null;
  status: string;
  waitlist_position: number | null;
  check_in_status: string | null;
  checked_in_at: string | null;
  registration_date: string | null;
}

const LIST_COLS =
  "id, title, description, event_date, event_end_date, location_city, location_country, category, max_capacity, current_bookings, is_active, is_featured, rsvp_enabled, allowed_tiers, images";

export async function listEvents(): Promise<EventRow[]> {
  const db = createServiceClient();
  const { data: rows } = await db
    .from("listings")
    .select(LIST_COLS)
    .eq("type", "EXPERIENCE")
    .order("event_date", { ascending: false });

  const list = rows ?? [];
  const ids = list.map((r) => r.id as string);

  const confirmed = new Map<string, number>();
  const waitlist = new Map<string, number>();
  const checkedIn = new Map<string, number>();
  if (ids.length > 0) {
    const { data: regs } = await db
      .from("event_registrations")
      .select("listing_id, status, check_in_status")
      .in("listing_id", ids);
    for (const r of regs ?? []) {
      const lid = r.listing_id as string;
      if (r.status === "REGISTERED")
        confirmed.set(lid, (confirmed.get(lid) ?? 0) + 1);
      else if (r.status === "WAITLISTED")
        waitlist.set(lid, (waitlist.get(lid) ?? 0) + 1);
      if (r.check_in_status === "CHECKED_IN")
        checkedIn.set(lid, (checkedIn.get(lid) ?? 0) + 1);
    }
  }

  return list.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    event_date: (r.event_date as string | null) ?? null,
    event_end_date: (r.event_end_date as string | null) ?? null,
    location_city: (r.location_city as string | null) ?? null,
    location_country: (r.location_country as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    max_capacity: (r.max_capacity as number | null) ?? null,
    current_bookings: (r.current_bookings as number) ?? 0,
    is_active: Boolean(r.is_active),
    is_featured: Boolean(r.is_featured),
    rsvp_enabled: Boolean(r.rsvp_enabled),
    allowed_tiers: (r.allowed_tiers as string[] | null) ?? null,
    images: (r.images as string[] | null) ?? null,
    confirmedCount: confirmed.get(r.id as string) ?? 0,
    waitlistCount: waitlist.get(r.id as string) ?? 0,
    checkedInCount: checkedIn.get(r.id as string) ?? 0,
  }));
}

export async function getAttendees(listingId: string): Promise<Attendee[]> {
  const db = createServiceClient();
  // No FK event_registrations.user_id → profiles, so merge manually.
  const { data: regs } = await db
    .from("event_registrations")
    .select(
      "id, user_id, status, waitlist_position, check_in_status, checked_in_at, registration_date"
    )
    .eq("listing_id", listingId)
    .order("registration_date", { ascending: true });

  const list = regs ?? [];
  const userIds = Array.from(
    new Set(list.map((r) => r.user_id as string).filter(Boolean))
  );
  const profileMap = new Map<
    string,
    { name: string; email: string; instagram: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, name, email, instagram_handle")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, {
        name: (p.name as string | null) ?? "",
        email: (p.email as string | null) ?? "",
        instagram: (p.instagram_handle as string | null) ?? null,
      });
    }
  }

  return list.map((r) => {
    const p = profileMap.get(r.user_id as string);
    return {
      id: r.id as string,
      user_id: r.user_id as string,
      name: p?.name || p?.email || "Member",
      email: p?.email || "",
      instagram: p?.instagram ?? null,
      status: (r.status as string) ?? "REGISTERED",
      waitlist_position: (r.waitlist_position as number | null) ?? null,
      check_in_status: (r.check_in_status as string | null) ?? null,
      checked_in_at: (r.checked_in_at as string | null) ?? null,
      registration_date: (r.registration_date as string | null) ?? null,
    };
  });
}

// --- mutations ---------------------------------------------------------

const EDITABLE = [
  "title",
  "description",
  "event_date",
  "event_end_date",
  "location_city",
  "location_country",
  "category",
  "rsvp_enabled",
] as const;

export async function saveEvent(
  id: string | null,
  input: Record<string, unknown>
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const row: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (input[k] !== undefined) row[k] = input[k] === "" ? null : input[k];
  }
  if (input.max_capacity !== undefined)
    row.max_capacity =
      input.max_capacity === "" || input.max_capacity == null
        ? null
        : Math.floor(Number(input.max_capacity));
  if (input.is_active !== undefined) row.is_active = Boolean(input.is_active);
  if (input.is_featured !== undefined)
    row.is_featured = Boolean(input.is_featured);
  if (Array.isArray(input.allowed_tiers))
    row.allowed_tiers = input.allowed_tiers;

  if (id) {
    const { error } = await db
      .from("listings")
      .update(row)
      .eq("id", id);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  if (!row.title)
    return { ok: false, message: "A title is required." };
  const { data: top } = await db
    .from("listings")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("listings").insert({
    ...row,
    type: "EXPERIENCE",
    is_active: row.is_active ?? true,
    is_featured: row.is_featured ?? false,
    rsvp_enabled: row.rsvp_enabled ?? true,
    current_bookings: 0,
    display_order: ((top?.display_order as number | undefined) ?? 0) + 1,
  });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteEvent(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  await db.from("event_registrations").delete().eq("listing_id", id);
  await db.from("event_checkins").delete().eq("event_id", id);
  const { error } = await db.from("listings").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Renumber a listing's WAITLISTED rows to a clean 1..n (server-side,
 *  avoids V1's race-prone client loop). */
async function reindexWaitlist(
  db: ReturnType<typeof createServiceClient>,
  listingId: string
) {
  const { data } = await db
    .from("event_registrations")
    .select("id, waitlist_position, registration_date")
    .eq("listing_id", listingId)
    .eq("status", "WAITLISTED")
    .order("waitlist_position", { ascending: true, nullsFirst: false })
    .order("registration_date", { ascending: true });
  let pos = 1;
  for (const r of data ?? []) {
    await db
      .from("event_registrations")
      .update({ waitlist_position: pos })
      .eq("id", r.id as string);
    pos += 1;
  }
}

async function adjustBookings(
  db: ReturnType<typeof createServiceClient>,
  listingId: string,
  delta: number
) {
  const { data } = await db
    .from("listings")
    .select("current_bookings")
    .eq("id", listingId)
    .maybeSingle();
  const next = Math.max(0, ((data?.current_bookings as number) ?? 0) + delta);
  await db
    .from("listings")
    .update({ current_bookings: next })
    .eq("id", listingId);
}

export async function cancelAttendee(
  regId: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: reg } = await db
    .from("event_registrations")
    .select("id, listing_id, status")
    .eq("id", regId)
    .maybeSingle();
  if (!reg) return { ok: false, message: "Registration not found." };
  const listingId = reg.listing_id as string;
  const wasConfirmed = reg.status === "REGISTERED";

  const { error } = await db
    .from("event_registrations")
    .update({ status: "CANCELLED", waitlist_position: null })
    .eq("id", regId);
  if (error) return { ok: false, message: error.message };

  if (wasConfirmed) {
    await adjustBookings(db, listingId, -1);
    // Promote the head of the waitlist into the freed seat.
    const { data: head } = await db
      .from("event_registrations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("status", "WAITLISTED")
      .order("waitlist_position", { ascending: true, nullsFirst: false })
      .order("registration_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (head) {
      await db
        .from("event_registrations")
        .update({ status: "REGISTERED", waitlist_position: null })
        .eq("id", head.id as string);
      await adjustBookings(db, listingId, 1);
    }
  }
  await reindexWaitlist(db, listingId);
  return { ok: true };
}

export async function promoteAttendee(
  regId: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: reg } = await db
    .from("event_registrations")
    .select("id, listing_id, status")
    .eq("id", regId)
    .maybeSingle();
  if (!reg) return { ok: false, message: "Registration not found." };
  if (reg.status !== "WAITLISTED")
    return { ok: false, message: "Only waitlisted guests can be promoted." };
  const listingId = reg.listing_id as string;

  const { error } = await db
    .from("event_registrations")
    .update({ status: "REGISTERED", waitlist_position: null })
    .eq("id", regId);
  if (error) return { ok: false, message: error.message };
  await adjustBookings(db, listingId, 1);
  await reindexWaitlist(db, listingId);
  return { ok: true };
}

export async function setCheckIn(
  regId: string,
  checked: boolean
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("event_registrations")
    .update({
      check_in_status: checked ? "CHECKED_IN" : null,
      checked_in_at: checked ? new Date().toISOString() : null,
    })
    .eq("id", regId);
  return error ? { ok: false, message: error.message } : { ok: true };
}
