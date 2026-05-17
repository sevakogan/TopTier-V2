"use client";

import { useState } from "react";
import type {
  BookingRequest,
  Booking,
} from "@/lib/backend/bookings-admin";
import {
  REQUEST_STATUSES,
  BOOKING_STATUSES,
} from "@/lib/backend/bookings-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

type Payload = { requests: BookingRequest[]; bookings: Booking[] };
const SC: Record<string, string> = {
  NEW: "#eab308",
  CONTACTED: "#3b82f6",
  CONFIRMED: "#22c55e",
  CLOSED: "#9aa0a6",
  REQUESTED: "#eab308",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#9aa0a6",
};
const money = (c: number | null) =>
  c == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(c / 100);
const day = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export default function BookingsPage() {
  const { data, loading, error, refetch } = useAdminResource<Payload>(
    "/api/admin/bookings",
    ""
  );
  const requests = data?.requests ?? [];
  const bookings = data?.bookings ?? [];

  const [tab, setTab] = useState<"requests" | "bookings">("requests");
  const [sel, setSel] = useState<
    | { kind: "request"; row: BookingRequest }
    | { kind: "booking"; row: Booking }
    | null
  >(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function setStatus(status: string) {
    if (!sel) return;
    const r = await adminMutate("/api/admin/bookings", "PATCH", {
      kind: sel.kind,
      id: sel.row.id,
      status,
    });
    if (!r.ok) setBanner(r.error ?? "Failed.");
    await refetch();
    setSel({ ...sel, row: { ...sel.row, status } } as typeof sel);
  }
  async function saveNotes(notes: string) {
    if (!sel) return;
    await adminMutate("/api/admin/bookings", "PATCH", {
      kind: sel.kind,
      id: sel.row.id,
      internal_notes: notes,
    });
    await refetch();
  }

  const statuses =
    sel?.kind === "request" ? REQUEST_STATUSES : BOOKING_STATUSES;

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Bookings
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Inbound booking requests and confirmed member bookings.
      </p>

      <div className="mb-5 inline-flex rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
        {(
          [
            ["requests", `Requests (${requests.length})`],
            ["bookings", `Bookings (${bookings.length})`],
          ] as [typeof tab, string][]
        ).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-[12px] font-semibold ${
              tab === k
                ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C]"
                : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : (tab === "requests" ? requests : bookings).length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          Nothing here yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {(tab === "requests"
                  ? ["Who", "Vehicle", "Dates", "Status", ""]
                  : ["Member", "Listing", "Dates", "Status", ""]
                ).map((h) => (
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
              {tab === "requests"
                ? requests.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() =>
                        setSel({ kind: "request", row: r })
                      }
                      className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                    >
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                        {r.full_name}
                        <div className="text-[11px] font-normal text-[rgba(245,245,240,0.45)]">
                          {r.email}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                        {r.car_title || "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                        {day(r.start_date)} – {day(r.end_date)}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                        <span
                          className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                          style={{ color: SC[r.status] ?? "#9aa0a6" }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right text-[11px] font-semibold text-[rgba(245,245,240,0.45)]">
                        Open →
                      </td>
                    </tr>
                  ))
                : bookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() =>
                        setSel({ kind: "booking", row: b })
                      }
                      className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                    >
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                        {b.member_name || "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                        {b.listing_title || "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                        {day(b.start_date)} – {day(b.end_date)}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                        <span
                          className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                          style={{ color: SC[b.status] ?? "#9aa0a6" }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right text-[11px] font-semibold text-[rgba(245,245,240,0.45)]">
                        Open →
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {sel && (
        <>
          <div
            onClick={() => setSel(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] max-w-[95vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto p-7">
            <button
              type="button"
              onClick={() => setSel(null)}
              className="float-right text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            >
              ✕
            </button>
            <div className="text-[19px] font-bold text-[#F5F5F0]">
              {sel.kind === "request"
                ? (sel.row as BookingRequest).full_name
                : (sel.row as Booking).member_name || "Booking"}
            </div>
            <div className="text-[12px] text-[rgba(245,245,240,0.45)] mt-1 mb-4">
              {sel.kind === "request"
                ? `${(sel.row as BookingRequest).email} · ${
                    (sel.row as BookingRequest).source
                  }`
                : (sel.row as Booking).listing_title || ""}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                    sel.row.status === s
                      ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C] border-[rgba(201,168,76,0.35)]"
                      : "border-[rgba(255,255,255,0.1)] text-[rgba(245,245,240,0.6)] hover:text-[#F5F5F0]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4 space-y-1.5 text-[13px]">
              {(sel.kind === "request"
                ? ([
                    [
                      "Vehicle",
                      (sel.row as BookingRequest).car_title,
                    ],
                    [
                      "Start",
                      day((sel.row as BookingRequest).start_date),
                    ],
                    ["End", day((sel.row as BookingRequest).end_date)],
                    ["Phone", (sel.row as BookingRequest).phone],
                    [
                      "Reference",
                      (sel.row as BookingRequest).reference_number,
                    ],
                    [
                      "Message",
                      (sel.row as BookingRequest).message,
                    ],
                  ] as [string, unknown][])
                : ([
                    ["Listing", (sel.row as Booking).listing_title],
                    ["Start", day((sel.row as Booking).start_date)],
                    ["End", day((sel.row as Booking).end_date)],
                    [
                      "Estimate",
                      money(
                        (sel.row as Booking)
                          .total_price_estimate_cents
                      ),
                    ],
                    [
                      "Member note",
                      (sel.row as Booking).notes_from_member,
                    ],
                  ] as [string, unknown][])
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-[rgba(245,245,240,0.45)]">
                    {k}
                  </span>
                  <span className="text-[#F5F5F0] text-right break-words">
                    {v == null || v === "" ? "—" : String(v)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
              <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                Internal note
              </h4>
              <textarea
                defaultValue={sel.row.internal_notes ?? ""}
                onBlur={(e) => saveNotes(e.target.value)}
                rows={3}
                placeholder="Saved on blur — staff only."
                className="w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] p-3 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)] resize-y"
              />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
