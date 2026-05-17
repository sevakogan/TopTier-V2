// SERVER-ONLY. Full type-aware record for the pipeline drawer + the safe
// stage transitions. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";
import type { PersonType } from "./pipeline";

/** A labelled section of key/value rows for the drawer. */
export interface RecordSection {
  title: string;
  rows: { label: string; value: string }[];
}

export interface PersonRecord {
  type: PersonType;
  name: string;
  headline: string;
  sections: RecordSection[];
  /** car photos / partner media URLs to render as a gallery. */
  media: string[];
  notes: string | null;
  /** Internal-only open tracking (admin_person_meta). */
  openCount: number;
  lastOpenedAt: string | null;
}

interface PersonMeta {
  note: string | null;
  open_count: number;
  last_opened_at: string | null;
}

/** Admin-only metadata, decoupled from V1 domain tables. Best-effort:
 *  returns null if the migration hasn't run yet. */
async function getPersonMeta(
  type: PersonType,
  recordId: string
): Promise<PersonMeta | null> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("admin_person_meta")
      .select("note, open_count, last_opened_at")
      .eq("person_type", type)
      .eq("record_id", recordId)
      .maybeSingle();
    if (error) return null;
    return (data as PersonMeta | null) ?? null;
  } catch {
    return null;
  }
}

/** Count a real drawer open (not prefetch/hover/revalidate). */
export async function trackPersonOpen(
  type: PersonType,
  recordId: string
): Promise<boolean> {
  try {
    const db = createServiceClient();
    const now = new Date().toISOString();
    const { data } = await db
      .from("admin_person_meta")
      .select("id, open_count")
      .eq("person_type", type)
      .eq("record_id", recordId)
      .maybeSingle();
    if (data) {
      const { error } = await db
        .from("admin_person_meta")
        .update({
          open_count: ((data.open_count as number) ?? 0) + 1,
          last_opened_at: now,
          updated_at: now,
        })
        .eq("id", data.id as string);
      return !error;
    }
    const { error } = await db.from("admin_person_meta").insert({
      person_type: type,
      record_id: recordId,
      open_count: 1,
      last_opened_at: now,
    });
    return !error;
  } catch {
    return false;
  }
}

function v(x: unknown): string {
  if (x === null || x === undefined || x === "") return "—";
  if (typeof x === "boolean") return x ? "Yes" : "No";
  return String(x);
}

function fmt(d: unknown): string {
  if (!d) return "—";
  const date = new Date(String(d));
  return isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

type BaseRecord = Omit<PersonRecord, "openCount" | "lastOpenedAt">;

/** Public: V1 record + admin-only meta (note override + open stats). */
export async function getPersonRecord(
  type: PersonType,
  recordId: string
): Promise<PersonRecord | null> {
  const base = await buildPersonRecord(type, recordId);
  if (!base) return null;
  const meta = await getPersonMeta(type, recordId);
  return {
    ...base,
    notes: meta?.note ?? base.notes,
    openCount: meta?.open_count ?? 0,
    lastOpenedAt: meta?.last_opened_at ?? null,
  };
}

async function buildPersonRecord(
  type: PersonType,
  recordId: string
): Promise<BaseRecord | null> {
  const db = createServiceClient();

  if (type === "applicant") {
    const { data: r } = await db
      .from("invite_requests")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();
    if (!r) return null;
    const name =
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email;
    return {
      type,
      name,
      headline: `Applicant · ${v(r.status)}`,
      media: [],
      notes: null,
      sections: [
        {
          title: "Contact",
          rows: [
            { label: "Full name", value: name },
            { label: "Email", value: v(r.email) },
            { label: "Phone", value: v(r.phone) },
            { label: "Instagram", value: v(r.instagram_handle) },
            { label: "Age", value: v(r.age) },
            { label: "Referred by", value: v(r.referred_by) },
          ],
        },
        {
          title: "Application",
          rows: [
            { label: "Tier requested", value: v(r.selected_tier) },
            { label: "Status", value: v(r.status) },
            { label: "Submitted", value: fmt(r.created_at) },
            { label: "Updated", value: fmt(r.updated_at) },
            { label: "Type of work", value: v(r.type_of_work) },
          ],
        },
        {
          title: "Vehicle",
          rows: [
            { label: "Car", value: v(r.car_driving) },
            { label: "License plate", value: v(r.license_plate) },
          ],
        },
        {
          title: "Invitation",
          rows: [
            { label: "Token", value: v(r.invitation_token) },
            { label: "Sent", value: fmt(r.invitation_sent_at) },
            { label: "Expires", value: fmt(r.invitation_expires_at) },
            { label: "Invite code id", value: v(r.invite_code_id) },
          ],
        },
      ],
    };
  }

  if (type === "partner") {
    const { data: p } = await db
      .from("trusted_partners")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();
    if (!p) return null;
    const { data: offers } = await db
      .from("partner_offers")
      .select("title, access_level, code_value, status, expires_at")
      .eq("partner_id", recordId);
    const media = [p.logo_url, p.hero_image_url].filter(
      (x): x is string => Boolean(x)
    );
    return {
      type,
      name: p.name as string,
      headline: `Partner · ${v(p.category)}`,
      media,
      notes: (p.internal_notes as string | null) ?? null,
      sections: [
        {
          title: "Contact",
          rows: [
            { label: "Business", value: v(p.name) },
            { label: "Contact name", value: v(p.contact_name) },
            { label: "Email", value: v(p.contact_email) },
            { label: "Phone", value: v(p.contact_phone) },
            { label: "Website", value: v(p.website) },
          ],
        },
        {
          title: "Deal",
          rows: [
            { label: "Category", value: v(p.category) },
            { label: "Discount code", value: v(p.discount_code) },
            { label: "Benefit", value: v(p.benefit_details) },
            { label: "Visibility tier", value: v(p.visibility_tier) },
            { label: "Partner tier", value: v(p.partner_tier) },
            { label: "Partner status", value: v(p.partner_status) },
            { label: "Paid status", value: v(p.paid_status) },
            { label: "Pay link", value: v(p.pay_link) },
            { label: "Active", value: v(p.is_active) },
            { label: "Featured", value: v(p.is_featured) },
          ],
        },
        {
          title: "Description",
          rows: [{ label: "About", value: v(p.description) }],
        },
        {
          title: `Offers (${offers?.length ?? 0})`,
          rows: (offers ?? []).map((o) => ({
            label: v(o.title),
            value: `${v(o.access_level)} · ${v(o.status)}`,
          })),
        },
      ],
    };
  }

  // member OR garage — both keyed by member_profiles.id OR a profiles.id
  // (Garage rows with no member_profiles come through as recordId = profile id)
  let mp: Record<string, unknown> | null = null;
  let profileId: string | null = null;

  const { data: mpRow } = await db
    .from("member_profiles")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();
  if (mpRow) {
    mp = mpRow;
    profileId = (mpRow.user_id as string | null) ?? null;
  } else {
    profileId = recordId; // pure Garage Pass (profiles-only)
  }

  const { data: prof } = profileId
    ? await db.from("profiles").select("*").eq("id", profileId).maybeSingle()
    : { data: null };

  const { data: cars } = profileId
    ? await db
        .from("garages")
        .select("car_name, brand, model, year, horsepower, mods, photos")
        .eq("user_id", profileId)
    : { data: null };

  const { data: vehicles } = profileId
    ? await db
        .from("vehicles")
        .select("make, model, year, plate, vin, verification_status")
        .eq("member_id", recordId)
    : { data: null };

  const media: string[] = [];
  for (const c of cars ?? []) {
    const photos = (c.photos as string[] | null) ?? [];
    media.push(...photos);
  }

  const isMember = Boolean(mp && mp.tier && mp.tier !== "ACCESS");
  const name =
    (prof?.name as string) || (prof?.email as string) || "Member";

  const sections: RecordSection[] = [
    {
      title: "Contact",
      rows: [
        { label: "Name", value: name },
        { label: "Email", value: v(prof?.email) },
        { label: "Phone", value: v(prof?.phone) },
        { label: "Instagram", value: v(prof?.instagram_handle) },
        { label: "City", value: v(prof?.city) },
        { label: "Country", value: v(prof?.country) },
        { label: "Last login", value: fmt(prof?.last_login_at) },
        { label: "Joined", value: fmt(prof?.created_at) },
      ],
    },
  ];

  if (mp) {
    sections.push({
      title: "Membership",
      rows: [
        { label: "Tier", value: v(mp.tier) },
        { label: "Membership status", value: v(mp.membership_status) },
        { label: "Status", value: v(mp.status) },
        { label: "Started", value: fmt(mp.membership_started_at) },
        { label: "Expires", value: fmt(mp.membership_expires_at) },
        { label: "Renewal", value: fmt(mp.renewal_date) },
        { label: "Waiver accepted", value: fmt(mp.waiver_accepted_at) },
        {
          label: "Concierge this month",
          value: v(mp.concierge_requests_this_month),
        },
        { label: "Member chat", value: v(mp.chat_member_access) },
        { label: "Inner circle chat", value: v(mp.chat_inner_circle_access) },
      ],
    });
    sections.push({
      title: "Billing",
      rows: [
        { label: "Stripe customer", value: v(mp.stripe_customer_id) },
        { label: "Subscription", value: v(mp.stripe_subscription_id) },
      ],
    });
  } else {
    sections.push({
      title: "Membership",
      rows: [{ label: "Status", value: "Garage Pass · free (no membership)" }],
    });
  }

  sections.push({
    title: `Garage (${cars?.length ?? 0})`,
    rows: (cars ?? []).map((c) => ({
      label:
        [c.year, c.brand, c.model].filter(Boolean).join(" ") ||
        v(c.car_name),
      value: [c.horsepower ? `${c.horsepower}hp` : null, c.mods]
        .filter(Boolean)
        .join(" · "),
    })),
  });

  if ((vehicles ?? []).length > 0) {
    sections.push({
      title: "Vehicle verification",
      rows: (vehicles ?? []).map((vh) => ({
        label:
          [vh.year, vh.make, vh.model].filter(Boolean).join(" ") || "Vehicle",
        value: `${v(vh.plate)} · ${v(vh.verification_status)}`,
      })),
    });
  }

  return {
    type: isMember ? "member" : "garage",
    name,
    headline: isMember
      ? `${v(mp?.tier)} member`
      : "Garage Pass · free",
    media,
    notes: (mp?.internal_notes as string | null) ?? null,
    sections,
  };
}

/** SAFE, reversible stage transitions only — mapped exactly to V1 columns.
 *  Does NOT fabricate auth users / member_profiles (that is V1's
 *  invitation+convert flow). Returns false on unsupported transitions. */
function isMissingColumn(err: { message?: string; code?: string }): boolean {
  return (
    err?.code === "42703" ||
    /claimed_by|claimed_at|column .* does not exist/i.test(
      err?.message ?? ""
    )
  );
}

export async function moveStage(input: {
  type: PersonType;
  recordId: string;
  to: string;
  /** Acting admin's auth user id — used to stamp lead claims. */
  actorId?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  if (input.type === "applicant") {
    // "Payment Requested" is the automation path (plan confirm + send
    // invite/payment link) — never a silent status flip here.
    if (input.to === "PaymentRequested") {
      return {
        ok: false,
        message:
          "Use “Send invitation” (pick a plan) — that approves them and emails the payment link.",
      };
    }

    // Claim / release: In Review = claimed by an admin (status stays
    // PENDING). New / Declined release the claim.
    if (input.to === "InReview") {
      const { error } = await db
        .from("invite_requests")
        .update({
          claimed_by: input.actorId ?? null,
          claimed_at: now,
          updated_at: now,
        })
        .eq("id", input.recordId);
      if (error) {
        return {
          ok: false,
          message: isMissingColumn(error)
            ? "In Review needs the one-line claim migration — run it in Supabase, then this works."
            : error.message,
        };
      }
      return { ok: true };
    }

    const status =
      input.to === "New"
        ? "PENDING"
        : input.to === "Declined"
          ? "REJECTED"
          : null;
    if (!status)
      return { ok: false, message: "Unsupported lead transition." };

    // Release the claim alongside the status change (best-effort: if the
    // claim columns aren't there yet, just move the status).
    const withClaim = await db
      .from("invite_requests")
      .update({
        status,
        claimed_by: null,
        claimed_at: null,
        updated_at: now,
      })
      .eq("id", input.recordId);
    if (withClaim.error) {
      if (!isMissingColumn(withClaim.error))
        return { ok: false, message: withClaim.error.message };
      const { error } = await db
        .from("invite_requests")
        .update({ status, updated_at: now })
        .eq("id", input.recordId);
      return error ? { ok: false, message: error.message } : { ok: true };
    }
    return { ok: true };
  }

  // member_profiles: tier change / decline / reactivate (recordId = mp.id)
  if (input.type === "member" || input.type === "garage") {
    const tierMap: Record<string, { tier: string; status: string }> = {
      Core: { tier: "CORE", status: "ACTIVE" },
      VIP: { tier: "EXECUTIVE", status: "ACTIVE" },
      Strategic: { tier: "STRATEGIC", status: "ACTIVE" },
      Declined: { tier: "ACCESS", status: "REJECTED" },
    };
    const t = tierMap[input.to];
    if (!t) return { ok: false, message: "Unsupported member transition." };
    const { error } = await db
      .from("member_profiles")
      .update({
        tier: t.tier,
        status: t.status,
        membership_status: t.status,
        updated_at: now,
      })
      .eq("id", input.recordId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  return { ok: false, message: "Partners are not moved via the pipeline." };
}

/** Internal note for ANY person type — canonical store is
 *  admin_person_meta; member/partner are mirrored to V1.internal_notes
 *  for back-compat. Returns false only if the meta table isn't there
 *  yet AND the type has no V1 column to fall back to. */
export async function saveNotes(
  type: PersonType,
  recordId: string,
  notes: string
): Promise<boolean> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  // Best-effort mirror to V1 (member/partner only have the column).
  if (type === "member" || type === "garage") {
    await db
      .from("member_profiles")
      .update({ internal_notes: notes })
      .eq("id", recordId);
  } else if (type === "partner") {
    await db
      .from("trusted_partners")
      .update({ internal_notes: notes })
      .eq("id", recordId);
  }

  // Canonical: admin_person_meta (covers applicant/garage too).
  try {
    const { data } = await db
      .from("admin_person_meta")
      .select("id")
      .eq("person_type", type)
      .eq("record_id", recordId)
      .maybeSingle();
    if (data) {
      const { error } = await db
        .from("admin_person_meta")
        .update({ note: notes, updated_at: now })
        .eq("id", data.id as string);
      return !error;
    }
    const { error } = await db.from("admin_person_meta").insert({
      person_type: type,
      record_id: recordId,
      note: notes,
    });
    if (!error) return true;
  } catch {
    // table missing — fall through
  }

  // Meta table absent: member/partner still persisted via V1 mirror.
  return type === "member" || type === "garage" || type === "partner";
}
