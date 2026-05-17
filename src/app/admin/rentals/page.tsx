"use client";

import { useState } from "react";
import type {
  RentalSubmission,
  RentalProvider,
} from "@/lib/backend/rentals-admin";
import { RENTAL_STATUSES } from "@/lib/backend/rentals-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";
import { ImageLightbox } from "@/components/admin/image-lightbox";
import { AdminDrawer } from "@/components/admin/admin-drawer";

type Payload = {
  submissions: RentalSubmission[];
  providers: RentalProvider[];
};
const SC: Record<string, string> = {
  PENDING: "#eab308",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
};
const money = (c: number | null) =>
  c == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(c / 100);

export default function RentalsPage() {
  const { data, loading, error, refetch } = useAdminResource<Payload>(
    "/api/admin/rentals",
    ""
  );
  const subs = data?.submissions ?? [];
  const provs = data?.providers ?? [];

  const [tab, setTab] = useState<"submissions" | "providers">(
    "submissions"
  );
  const [sel, setSel] = useState<
    | { kind: "submission"; row: RentalSubmission }
    | { kind: "provider"; row: RentalProvider }
    | null
  >(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function setStatus(status: string) {
    if (!sel) return;
    const r = await adminMutate("/api/admin/rentals", "PATCH", {
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
    await adminMutate("/api/admin/rentals", "PATCH", {
      kind: sel.kind,
      id: sel.row.id,
      admin_notes: notes,
    });
    await refetch();
  }

  const rows: (RentalSubmission | RentalProvider)[] =
    tab === "submissions" ? subs : provs;

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Rentals
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Fleet supply — owner submissions and provider companies. Review,
        approve or reject.
      </p>

      <div className="mb-5 inline-flex rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
        {(
          [
            ["submissions", `Submissions (${subs.length})`],
            ["providers", `Providers (${provs.length})`],
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
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          Nothing here yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {(tab === "submissions"
                  ? ["Vehicle", "Owner", "Daily", "Status", ""]
                  : ["Company", "Contact", "Fleet", "Status", ""]
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
              {tab === "submissions"
                ? subs.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() =>
                        setSel({ kind: "submission", row: s })
                      }
                      className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                    >
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                        {[s.vehicle_year, s.vehicle_make, s.vehicle_model]
                          .filter(Boolean)
                          .join(" ")}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                        {s.contact_name}
                        <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                          {s.contact_email}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                        {money(s.daily_rate_cents)}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                        <span
                          className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                          style={{ color: SC[s.status] ?? "#9aa0a6" }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right text-[11px] font-semibold text-[rgba(245,245,240,0.45)]">
                        Review →
                      </td>
                    </tr>
                  ))
                : provs.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() =>
                        setSel({ kind: "provider", row: p })
                      }
                      className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                    >
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                        {p.company_name}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                        {p.contact_name}
                        <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                          {p.contact_email}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                        {p.fleet_size ?? "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                        <span
                          className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                          style={{ color: SC[p.status] ?? "#9aa0a6" }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right text-[11px] font-semibold text-[rgba(245,245,240,0.45)]">
                        Review →
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminDrawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={
          sel
            ? sel.kind === "submission"
              ? [
                  (sel.row as RentalSubmission).vehicle_year,
                  (sel.row as RentalSubmission).vehicle_make,
                  (sel.row as RentalSubmission).vehicle_model,
                ]
                  .filter(Boolean)
                  .join(" ")
              : (sel.row as RentalProvider).company_name
            : ""
        }
        subtitle={
          sel
            ? `${sel.row.contact_name} · ${sel.row.contact_email}${
                sel.row.contact_phone
                  ? ` · ${sel.row.contact_phone}`
                  : ""
              }`
            : undefined
        }
      >
        {sel && (
          <>

            <div className="flex flex-wrap gap-2 mb-5">
              {RENTAL_STATUSES.map((s) => (
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

            {sel.kind === "submission" &&
              (sel.row as RentalSubmission).photos &&
              (sel.row as RentalSubmission).photos!.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(sel.row as RentalSubmission).photos!.map((u, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={u}
                      alt="vehicle"
                      onClick={() => setLightbox(u)}
                      className="h-20 w-full rounded-lg object-cover border border-[rgba(255,255,255,0.07)] cursor-zoom-in"
                    />
                  ))}
                </div>
              )}

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4 space-y-1.5 text-[13px]">
              {sel.kind === "submission"
                ? (
                    [
                      ["Company", (sel.row as RentalSubmission).company_name],
                      ["Color", (sel.row as RentalSubmission).vehicle_color],
                      [
                        "Daily rate",
                        money(
                          (sel.row as RentalSubmission).daily_rate_cents
                        ),
                      ],
                      [
                        "Broker net",
                        money(
                          (sel.row as RentalSubmission)
                            .broker_net_rate_cents
                        ),
                      ],
                      ["City", (sel.row as RentalSubmission).location_city],
                      [
                        "Description",
                        (sel.row as RentalSubmission).description,
                      ],
                    ] as [string, unknown][]
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-[rgba(245,245,240,0.45)]">
                        {k}
                      </span>
                      <span className="text-[#F5F5F0] text-right break-words">
                        {v == null || v === "" ? "—" : String(v)}
                      </span>
                    </div>
                  ))
                : (
                    [
                      ["Website", (sel.row as RentalProvider).website],
                      [
                        "Fleet size",
                        (sel.row as RentalProvider).fleet_size,
                      ],
                      [
                        "Fleet",
                        (sel.row as RentalProvider).fleet_description,
                      ],
                      [
                        "Service areas",
                        (sel.row as RentalProvider).service_areas,
                      ],
                    ] as [string, unknown][]
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4"
                    >
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
                Admin notes
              </h4>
              <textarea
                defaultValue={sel.row.admin_notes ?? ""}
                onBlur={(e) => saveNotes(e.target.value)}
                rows={3}
                placeholder="Saved on blur — staff only."
                className="w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] p-3 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)] resize-y"
              />
            </div>
          </>
        )}
      </AdminDrawer>

      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
