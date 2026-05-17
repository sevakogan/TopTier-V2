"use client";

import { useState } from "react";
import type {
  PartnerRow,
  PartnerOffer,
} from "@/lib/backend/partners-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

const EMPTY_PARTNER = {
  name: "",
  category: "",
  description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  logo_url: "",
  hero_image_url: "",
  benefit_details: "",
  discount_code: "",
  visibility_tier: "ALL",
  package: "SUPPORTER",
  paid_status: "pending",
  pay_link: "",
  internal_notes: "",
  is_active: true,
  is_featured: false,
  featured_until: "",
  display_order: 0,
};

const EMPTY_OFFER = {
  title: "",
  access_level: "ALL",
  redemption_type: "code",
  code_value: "",
  redemption_instructions: "",
  status: "ACTIVE",
  expires_at: "",
};

const field =
  "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
const label =
  "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

export default function PartnersPage() {
  const { data, loading, error, refetch } = useAdminResource<
    PartnerRow[]
  >("/api/admin/partners", "partners");
  const partners = data ?? [];

  const [edit, setEdit] = useState<{
    id: string | null;
    form: typeof EMPTY_PARTNER;
  } | null>(null);
  const [offersFor, setOffersFor] = useState<PartnerRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function openNew() {
    setBanner(null);
    setEdit({ id: null, form: { ...EMPTY_PARTNER } });
  }
  function openEdit(p: PartnerRow) {
    setBanner(null);
    setEdit({
      id: p.id,
      form: {
        ...EMPTY_PARTNER,
        ...Object.fromEntries(
          Object.keys(EMPTY_PARTNER).map((k) => {
            const v = (p as unknown as Record<string, unknown>)[k];
            return [k, v ?? (typeof EMPTY_PARTNER[k as keyof typeof EMPTY_PARTNER] === "boolean" ? false : "")];
          })
        ),
        featured_until: p.featured_until
          ? p.featured_until.slice(0, 10)
          : "",
      } as typeof EMPTY_PARTNER,
    });
  }

  async function savePartner() {
    if (!edit) return;
    setBusy(true);
    setBanner(null);
    const payload = {
      ...edit.form,
      featured_until: edit.form.featured_until
        ? new Date(edit.form.featured_until).toISOString()
        : null,
      display_order: Number(edit.form.display_order) || 0,
    };
    const r = edit.id
      ? await adminMutate("/api/admin/partners", "PATCH", {
          id: edit.id,
          ...payload,
        })
      : await adminMutate("/api/admin/partners", "POST", payload);
    setBusy(false);
    if (r.ok) {
      setEdit(null);
      await refetch();
    } else setBanner(r.error ?? "Could not save.");
  }

  async function removePartner(p: PartnerRow) {
    const r = await adminMutate("/api/admin/partners", "DELETE", {
      id: p.id,
    });
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Partners
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965]"
        >
          + New Partner
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Trusted partners, their benefits, billing status, and member
        offers / discount codes.
      </p>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && partners.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No partners yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Partner",
                  "Category",
                  "Tier / Status",
                  "Billing",
                  "Offers",
                  "Live",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.25)] px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <div className="text-[13px] font-semibold text-[#F5F5F0]">
                      {p.name}{" "}
                      {p.featured && (
                        <span className="text-[#C9A84C]">★</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                      {p.contact_email || p.website || "—"}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {p.category}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {p.package || p.partner_tier} · {p.partner_status}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {p.paid_status || "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px]">
                    <button
                      type="button"
                      onClick={() => setOffersFor(p)}
                      className="text-[#C9A84C] hover:underline font-semibold"
                    >
                      {p.offers.length} offer
                      {p.offers.length === 1 ? "" : "s"}
                    </button>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px]">
                    <span
                      style={{
                        color: p.is_active ? "#22c55e" : "#9aa0a6",
                      }}
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removePartner(p)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <PartnerModal
          state={edit}
          setState={setEdit}
          onSave={savePartner}
          busy={busy}
          banner={banner}
        />
      )}
      {offersFor && (
        <OffersModal
          partner={offersFor}
          onClose={() => setOffersFor(null)}
          onChanged={refetch}
        />
      )}
    </div>
  );
}

function PartnerModal({
  state,
  setState,
  onSave,
  busy,
  banner,
}: {
  state: { id: string | null; form: typeof EMPTY_PARTNER };
  setState: (s: { id: string | null; form: typeof EMPTY_PARTNER } | null) => void;
  onSave: () => void;
  busy: boolean;
  banner: string | null;
}) {
  const f = state.form;
  const set = (k: keyof typeof EMPTY_PARTNER, v: unknown) =>
    setState({ ...state, form: { ...f, [k]: v } });

  const text: [keyof typeof EMPTY_PARTNER, string][] = [
    ["name", "Name *"],
    ["category", "Category *"],
    ["contact_name", "Contact name"],
    ["contact_email", "Contact email"],
    ["contact_phone", "Contact phone"],
    ["website", "Website"],
    ["logo_url", "Logo URL"],
    ["hero_image_url", "Hero image URL"],
    ["discount_code", "Discount code"],
    ["pay_link", "Pay link"],
  ];

  return (
    <>
      <div
        onClick={() => setState(null)}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[680px] max-w-[95vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-[#F5F5F0]">
            {state.id ? "Edit partner" : "New partner"}
          </h2>
          <button
            type="button"
            onClick={() => setState(null)}
            className="text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
          >
            ✕
          </button>
        </div>
        {banner && (
          <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
            {banner}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {text.map(([k, lbl]) => (
            <div key={k}>
              <label className={label}>{lbl}</label>
              <input
                value={String(f[k] ?? "")}
                onChange={(e) => set(k, e.target.value)}
                className={field}
              />
            </div>
          ))}
          <div>
            <label className={label}>Package</label>
            <select
              value={f.package}
              onChange={(e) => set("package", e.target.value)}
              className={field}
            >
              {["SUPPORTER", "PREMIUM", "PRESTIGE"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Paid status</label>
            <select
              value={f.paid_status}
              onChange={(e) => set("paid_status", e.target.value)}
              className={field}
            >
              {["pending", "active", "inactive", "expired", "comped"].map(
                (o) => (
                  <option key={o}>{o}</option>
                )
              )}
            </select>
          </div>
          <div>
            <label className={label}>Visibility tier</label>
            <select
              value={f.visibility_tier}
              onChange={(e) => set("visibility_tier", e.target.value)}
              className={field}
            >
              {["ALL", "CORE", "VIP"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Display order</label>
            <input
              type="number"
              value={f.display_order}
              onChange={(e) => set("display_order", e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>Featured until</label>
            <input
              type="date"
              value={f.featured_until}
              onChange={(e) => set("featured_until", e.target.value)}
              className={field}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Description</label>
            <textarea
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className={`${field} resize-y`}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Benefit details</label>
            <textarea
              value={f.benefit_details}
              onChange={(e) => set("benefit_details", e.target.value)}
              rows={2}
              className={`${field} resize-y`}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Internal notes</label>
            <textarea
              value={f.internal_notes}
              onChange={(e) => set("internal_notes", e.target.value)}
              rows={2}
              className={`${field} resize-y`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-5 mt-4">
          {(
            [
              ["is_active", "Active (visible)"],
              ["is_featured", "Featured"],
            ] as const
          ).map(([k, lbl]) => (
            <label
              key={k}
              className="flex items-center gap-2 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(f[k])}
                onChange={(e) => set(k, e.target.checked)}
                className="accent-[#C9A84C]"
              />
              {lbl}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setState(null)}
            className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="rounded-lg bg-[#C9A84C] px-5 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
          >
            {busy ? "Saving…" : state.id ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </>
  );
}

function OffersModal({
  partner,
  onClose,
  onChanged,
}: {
  partner: PartnerRow;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [offers, setOffers] = useState<PartnerOffer[]>(partner.offers);
  const [form, setForm] = useState({ ...EMPTY_OFFER });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const body = editing
      ? { id: editing, ...form }
      : { partner_id: partner.id, ...form };
    const r = editing
      ? await adminMutate("/api/admin/partner-offers", "PATCH", body)
      : await adminMutate("/api/admin/partner-offers", "POST", body);
    setBusy(false);
    if (r.ok) {
      setForm({ ...EMPTY_OFFER });
      setEditing(null);
      await onChanged();
      // Optimistic local refresh
      setOffers((prev) =>
        editing
          ? prev.map((o) =>
              o.id === editing ? ({ ...o, ...form } as PartnerOffer) : o
            )
          : [
              ...prev,
              {
                id: `tmp-${Date.now()}`,
                partner_id: partner.id,
                ...form,
              } as PartnerOffer,
            ]
      );
    }
  }

  async function del(id: string) {
    await adminMutate("/api/admin/partner-offers", "DELETE", { id });
    setOffers((prev) => prev.filter((o) => o.id !== id));
    await onChanged();
  }

  const field2 =
    "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[620px] max-w-[95vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-[#F5F5F0]">
            {partner.name} — Offers
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {offers.length === 0 ? (
            <div className="text-[12px] italic text-[rgba(245,245,240,0.25)]">
              No offers yet.
            </div>
          ) : (
            offers.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5"
              >
                <div>
                  <div className="text-[13px] font-semibold text-[#F5F5F0]">
                    {o.title}
                  </div>
                  <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                    {o.access_level} · {o.status}
                    {o.code_value ? ` · ${o.code_value}` : ""}
                  </div>
                </div>
                <div className="whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(o.id);
                      setForm({
                        title: o.title,
                        access_level: o.access_level,
                        redemption_type: o.redemption_type,
                        code_value: o.code_value ?? "",
                        redemption_instructions:
                          o.redemption_instructions ?? "",
                        status: o.status,
                        expires_at: o.expires_at
                          ? o.expires_at.slice(0, 10)
                          : "",
                      });
                    }}
                    className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] mr-3"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => del(o.id)}
                    className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.07)] pt-4">
          <div className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-3">
            {editing ? "Edit offer" : "Add offer"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Title *"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className={`${field2} col-span-2`}
            />
            <select
              value={form.access_level}
              onChange={(e) =>
                setForm({ ...form, access_level: e.target.value })
              }
              className={field2}
            >
              {["ALL", "CORE", "VIP", "STRATEGIC"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className={field2}
            >
              {["ACTIVE", "INACTIVE", "EXPIRED"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <input
              placeholder="Redemption type"
              value={form.redemption_type}
              onChange={(e) =>
                setForm({ ...form, redemption_type: e.target.value })
              }
              className={field2}
            />
            <input
              placeholder="Code value"
              value={form.code_value}
              onChange={(e) =>
                setForm({ ...form, code_value: e.target.value })
              }
              className={field2}
            />
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) =>
                setForm({ ...form, expires_at: e.target.value })
              }
              className={`${field2} col-span-2`}
            />
            <textarea
              placeholder="Redemption instructions"
              value={form.redemption_instructions}
              onChange={(e) =>
                setForm({
                  ...form,
                  redemption_instructions: e.target.value,
                })
              }
              rows={2}
              className={`${field2} col-span-2 resize-y`}
            />
          </div>
          <div className="mt-3 flex gap-2">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ ...EMPTY_OFFER });
                }}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                Cancel edit
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={busy || !form.title.trim()}
              className="rounded-lg bg-[#C9A84C] px-5 py-2 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
            >
              {busy
                ? "Saving…"
                : editing
                  ? "Save offer"
                  : "Add offer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
