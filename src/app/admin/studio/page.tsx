"use client";

import { useState } from "react";
import type {
  StudioInquiry,
  StudioPackage,
} from "@/lib/backend/studio-admin";
import { STUDIO_STATUSES } from "@/lib/backend/studio-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

type Payload = {
  inquiries: StudioInquiry[];
  packages: StudioPackage[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "#eab308",
  CONTACTED: "#3b82f6",
  QUOTED: "#C9A84C",
  WON: "#22c55e",
  LOST: "#ef4444",
};

const money = (c: number | null) =>
  c == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(c / 100);

export default function StudioPage() {
  const { data, loading, error, refetch } = useAdminResource<Payload>(
    "/api/admin/studio",
    ""
  );
  const inquiries = data?.inquiries ?? [];
  const packages = data?.packages ?? [];

  const [sel, setSel] = useState<StudioInquiry | null>(null);
  const [tab, setTab] = useState<"inquiries" | "packages">("inquiries");
  const [pkgId, setPkgId] = useState("");
  const [depositPct, setDepositPct] = useState("30");
  const [adjust, setAdjust] = useState("");
  const [qnote, setQnote] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function open(i: StudioInquiry) {
    setSel(i);
    setPkgId(i.package_id ?? "");
    setDepositPct("30");
    setAdjust("");
    setQnote("");
    setBanner(null);
  }

  async function setStatus(status: string) {
    if (!sel) return;
    await adminMutate("/api/admin/studio", "PATCH", {
      id: sel.id,
      status,
    });
    await refetch();
    setSel({ ...sel, status });
  }

  async function saveNotes(notes: string) {
    if (!sel) return;
    await adminMutate("/api/admin/studio", "PATCH", {
      id: sel.id,
      internal_notes: notes,
    });
    await refetch();
  }

  async function makeQuote() {
    if (!sel || !pkgId) return;
    setBusy(true);
    setBanner(null);
    const r = await adminMutate("/api/admin/studio", "POST", {
      inquiryId: sel.id,
      packageId: pkgId,
      depositPercentage: Number(depositPct) || 0,
      adjustmentCents: adjust
        ? Math.round(Number(adjust) * 100)
        : 0,
      notes: qnote || undefined,
    });
    setBusy(false);
    if (r.ok) {
      await refetch();
      setSel(null);
    } else setBanner(r.error ?? "Could not create the quote.");
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Studio
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Content-studio inquiries, the quote builder, and packages.
      </p>

      <div className="mb-5 inline-flex rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
        {(
          [
            ["inquiries", `Inquiries (${inquiries.length})`],
            ["packages", `Packages (${packages.length})`],
          ] as [typeof tab, string][]
        ).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-[12px] font-semibold transition-colors ${
              tab === k
                ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C]"
                : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {error}
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
      ) : tab === "packages" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {packages.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111] p-4"
            >
              <div className="flex justify-between">
                <div className="text-[14px] font-semibold text-[#F5F5F0]">
                  {p.name}
                </div>
                <div className="text-[13px] font-semibold text-[#C9A84C]">
                  {money(p.base_price_cents)}
                </div>
              </div>
              <div className="text-[11px] text-[rgba(245,245,240,0.45)] mt-0.5">
                {p.category}
                {p.duration_minutes
                  ? ` · ${p.duration_minutes} min`
                  : ""}
                {p.is_active ? "" : " · inactive"}
              </div>
              {p.deliverables && (
                <div className="text-[12px] text-[rgba(245,245,240,0.7)] mt-2">
                  {p.deliverables}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No studio inquiries yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Service", "Goal", "Quotes", "Status", ""].map(
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
              {inquiries.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => open(i)}
                  className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                    {i.full_name}
                    <div className="text-[11px] font-normal text-[rgba(245,245,240,0.45)]">
                      {i.email}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {i.service_category}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                    {i.primary_goal || "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {i.quotes.length}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <span
                      className="inline-block rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                      style={{
                        color: STATUS_COLOR[i.status] ?? "#9aa0a6",
                      }}
                    >
                      {i.status}
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
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] max-w-[95vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto p-7">
            <button
              type="button"
              onClick={() => setSel(null)}
              className="float-right text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            >
              ✕
            </button>
            <div className="text-[20px] font-bold text-[#F5F5F0]">
              {sel.full_name}
            </div>
            <div className="text-[12px] text-[rgba(245,245,240,0.45)] mt-1 mb-4">
              {sel.email}
              {sel.phone ? ` · ${sel.phone}` : ""}
              {sel.reference_number ? ` · ${sel.reference_number}` : ""}
            </div>

            {banner && (
              <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
                {banner}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              {STUDIO_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                    sel.status === s
                      ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C] border-[rgba(201,168,76,0.35)]"
                      : "border-[rgba(255,255,255,0.1)] text-[rgba(245,245,240,0.6)] hover:text-[#F5F5F0]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4 space-y-1.5 text-[13px]">
              {(
                [
                  ["Service", sel.service_category],
                  ["Package", sel.package_name],
                  ["Goal", sel.primary_goal],
                  ["Preferred date", sel.preferred_date],
                  ["Est. cars", sel.estimated_cars],
                  ["Est. people", sel.estimated_people],
                ] as [string, unknown][]
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
              <div className="pt-2 text-[rgba(245,245,240,0.7)] whitespace-pre-wrap">
                {sel.project_description}
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
              <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                Quotes ({sel.quotes.length})
              </h4>
              {sel.quotes.length === 0 ? (
                <div className="text-[12px] italic text-[rgba(245,245,240,0.25)] mb-3">
                  None yet.
                </div>
              ) : (
                sel.quotes.map((q) => (
                  <div
                    key={q.id}
                    className="mb-2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px]"
                  >
                    <div className="flex justify-between text-[#F5F5F0]">
                      <span>{money(q.quote_total_cents)}</span>
                      <span className="text-[rgba(245,245,240,0.45)]">
                        {q.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                      Deposit {money(q.deposit_cents)} (
                      {q.deposit_percentage}%)
                    </div>
                  </div>
                ))
              )}

              <div className="mt-3 rounded-lg border border-[rgba(201,168,76,0.3)] p-3.5">
                <div className="text-[12px] font-semibold text-[#C9A84C] mb-2">
                  Build a quote
                </div>
                <select
                  value={pkgId}
                  onChange={(e) => setPkgId(e.target.value)}
                  className="w-full mb-2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px] text-[#F5F5F0] outline-none"
                >
                  <option value="">Select a package…</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {money(p.base_price_cents)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={depositPct}
                    onChange={(e) => setDepositPct(e.target.value)}
                    placeholder="Deposit %"
                    className="w-1/2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px] text-[#F5F5F0] outline-none"
                  />
                  <input
                    type="number"
                    value={adjust}
                    onChange={(e) => setAdjust(e.target.value)}
                    placeholder="Adjustment $"
                    className="w-1/2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px] text-[#F5F5F0] outline-none"
                  />
                </div>
                <textarea
                  value={qnote}
                  onChange={(e) => setQnote(e.target.value)}
                  rows={2}
                  placeholder="Quote note (optional)"
                  className="w-full mb-2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px] text-[#F5F5F0] outline-none resize-y"
                />
                <button
                  type="button"
                  onClick={makeQuote}
                  disabled={busy || !pkgId}
                  className="w-full rounded-lg bg-[#C9A84C] px-4 py-2 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
                >
                  {busy ? "Creating…" : "Create quote"}
                </button>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
              <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                Internal note
              </h4>
              <textarea
                defaultValue={sel.internal_notes ?? ""}
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
