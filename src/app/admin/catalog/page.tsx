"use client";

import { useState } from "react";
import type { CatalogItem } from "@/lib/backend/catalog-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";
import { ImageLightbox } from "@/components/admin/image-lightbox";

const TYPE_LABEL: Record<string, string> = {
  CAR_RENTAL: "Car",
  BOAT_RENTAL: "Boat",
  SERVICE: "Service",
};
const FILTERS = [
  { key: "all", label: "All" },
  { key: "CAR_RENTAL", label: "Cars" },
  { key: "BOAT_RENTAL", label: "Boats" },
  { key: "SERVICE", label: "Services" },
];

const EMPTY = {
  type: "CAR_RENTAL",
  title: "",
  description: "",
  vehicle_brand: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_color: "",
  daily_price: "",
  hourly_price: "",
  currency: "usd",
  location_city: "",
  location_country: "",
  category: "",
  images: "",
  is_active: true,
  is_featured: false,
};

const field =
  "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
const label =
  "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

const money = (c: number | null, ccy = "usd") =>
  c == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: (ccy || "usd").toUpperCase(),
      }).format(c / 100);

export default function CatalogPage() {
  const { data, loading, error, refetch } = useAdminResource<
    CatalogItem[]
  >("/api/admin/catalog", "items");
  const items = data ?? [];

  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<{
    id: string | null;
    form: typeof EMPTY;
  } | null>(null);
  const [confirmDel, setConfirmDel] = useState<CatalogItem | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const visible =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  function openNew() {
    setBanner(null);
    setEdit({ id: null, form: { ...EMPTY } });
  }
  function openEdit(i: CatalogItem) {
    setBanner(null);
    setEdit({
      id: i.id,
      form: {
        type: i.type,
        title: i.title ?? "",
        description: i.description ?? "",
        vehicle_brand: i.vehicle_brand ?? "",
        vehicle_model: i.vehicle_model ?? "",
        vehicle_year: i.vehicle_year != null ? String(i.vehicle_year) : "",
        vehicle_color: i.vehicle_color ?? "",
        daily_price:
          i.daily_price_cents != null
            ? String(i.daily_price_cents / 100)
            : "",
        hourly_price:
          i.hourly_price_cents != null
            ? String(i.hourly_price_cents / 100)
            : "",
        currency: i.currency ?? "usd",
        location_city: i.location_city ?? "",
        location_country: i.location_country ?? "",
        category: i.category ?? "",
        images: (i.images ?? []).join("\n"),
        is_active: i.is_active,
        is_featured: i.is_featured,
      },
    });
  }

  async function save() {
    if (!edit) return;
    setBusy(true);
    setBanner(null);
    const f = edit.form;
    const payload = {
      type: f.type,
      title: f.title,
      description: f.description,
      vehicle_brand: f.vehicle_brand,
      vehicle_model: f.vehicle_model,
      vehicle_year: f.vehicle_year ? Number(f.vehicle_year) : null,
      vehicle_color: f.vehicle_color,
      daily_price_cents: f.daily_price
        ? Math.round(Number(f.daily_price) * 100)
        : null,
      hourly_price_cents: f.hourly_price
        ? Math.round(Number(f.hourly_price) * 100)
        : null,
      currency: f.currency,
      location_city: f.location_city,
      location_country: f.location_country,
      category: f.category,
      images: f.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      is_active: f.is_active,
      is_featured: f.is_featured,
    };
    const r = edit.id
      ? await adminMutate("/api/admin/catalog", "PATCH", {
          id: edit.id,
          ...payload,
        })
      : await adminMutate("/api/admin/catalog", "POST", payload);
    setBusy(false);
    if (r.ok) {
      setEdit(null);
      await refetch();
    } else setBanner(r.error ?? "Could not save.");
  }

  async function doDelete() {
    if (!confirmDel) return;
    setBusy(true);
    const r = await adminMutate("/api/admin/catalog", "DELETE", {
      id: confirmDel.id,
    });
    setBusy(false);
    setConfirmDel(null);
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Catalog
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965]"
        >
          + New Listing
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Cars, boats and services inventory. (Experiences live under
        Events.)
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.5px] transition-colors ${
              filter === f.key
                ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C] border-[rgba(201,168,76,0.35)]"
                : "border-[rgba(255,255,255,0.07)] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          Nothing in this view yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["", "Title", "Type", "Daily", "Location", "Live", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.25)] px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] font-semibold"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr key={i.id} className="hover:bg-[rgba(201,168,76,0.04)]">
                  <td className="px-3.5 py-2 border-b border-[rgba(255,255,255,0.07)]">
                    {i.images && i.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.images[0]}
                        alt={i.title}
                        onClick={() => setLightbox(i.images![0])}
                        className="h-11 w-11 rounded-lg object-cover border border-[rgba(255,255,255,0.07)] cursor-zoom-in"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-[linear-gradient(135deg,#1f1f1f,#0d0d0d)] border border-[rgba(255,255,255,0.07)]" />
                    )}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                    {i.title}
                    {i.is_featured && (
                      <span className="text-[#C9A84C]"> ★</span>
                    )}
                    <div className="text-[11px] font-normal text-[rgba(245,245,240,0.45)]">
                      {[i.vehicle_brand, i.vehicle_model, i.vehicle_year]
                        .filter(Boolean)
                        .join(" ") || i.category || ""}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {TYPE_LABEL[i.type] ?? i.type}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                    {money(i.daily_price_cents, i.currency ?? "usd")}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                    {[i.location_city, i.location_country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px]">
                    <span
                      style={{
                        color: i.is_active ? "#22c55e" : "#9aa0a6",
                      }}
                    >
                      {i.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(i)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDel(i)}
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
        <>
          <div
            onClick={() => setEdit(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[620px] max-w-[95vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#F5F5F0]">
                {edit.id ? "Edit listing" : "New listing"}
              </h2>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Type</label>
                <select
                  value={edit.form.type}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, type: e.target.value },
                    })
                  }
                  className={field}
                >
                  <option value="CAR_RENTAL">Car</option>
                  <option value="BOAT_RENTAL">Boat</option>
                  <option value="SERVICE">Service</option>
                </select>
              </div>
              <div>
                <label className={label}>Category</label>
                <input
                  value={edit.form.category}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, category: e.target.value },
                    })
                  }
                  className={field}
                />
              </div>
              <div className="col-span-2">
                <label className={label}>Title *</label>
                <input
                  value={edit.form.title}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, title: e.target.value },
                    })
                  }
                  className={field}
                />
              </div>
              {(
                [
                  ["vehicle_brand", "Brand"],
                  ["vehicle_model", "Model"],
                  ["vehicle_year", "Year"],
                  ["vehicle_color", "Color"],
                  ["daily_price", "Daily price ($)"],
                  ["hourly_price", "Hourly price ($)"],
                  ["location_city", "City"],
                  ["location_country", "Country"],
                ] as [keyof typeof EMPTY, string][]
              ).map(([k, lbl]) => (
                <div key={k}>
                  <label className={label}>{lbl}</label>
                  <input
                    value={String(edit.form[k])}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: { ...edit.form, [k]: e.target.value },
                      })
                    }
                    className={field}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className={label}>Description</label>
                <textarea
                  value={edit.form.description}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: {
                        ...edit.form,
                        description: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  className={`${field} resize-y`}
                />
              </div>
              <div className="col-span-2">
                <label className={label}>
                  Images — one URL per line (first = cover)
                </label>
                <textarea
                  value={edit.form.images}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, images: e.target.value },
                    })
                  }
                  rows={2}
                  className={`${field} resize-y`}
                />
                {edit.form.images.trim() && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={edit.form.images.split("\n")[0].trim()}
                    alt="cover"
                    onClick={() =>
                      setLightbox(edit.form.images.split("\n")[0].trim())
                    }
                    className="mt-2 h-28 w-full rounded-lg object-cover border border-[rgba(255,255,255,0.07)] cursor-zoom-in"
                  />
                )}
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
                    checked={edit.form[k]}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: { ...edit.form, [k]: e.target.checked },
                      })
                    }
                    className="accent-[#C9A84C]"
                  />
                  {lbl}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-[#C9A84C] px-5 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
              >
                {busy ? "Saving…" : edit.id ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      {confirmDel && (
        <>
          <div
            onClick={() => setConfirmDel(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[#0d0d0d] p-7 shadow-2xl">
            <h2 className="text-[17px] font-bold text-[#F5F5F0] mb-2">
              Delete “{confirmDel.title}”?
            </h2>
            <p className="text-[12px] text-[#ef8c8c] mb-5">
              This permanently removes the listing. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.7)] hover:text-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={busy}
                className="rounded-lg bg-[#ef4444] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#dc2626] disabled:opacity-40"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}

      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
