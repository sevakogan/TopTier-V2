"use client";

import { useState } from "react";
import type { InviteRequest } from "@/lib/backend/invitations";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

type Plan = { id: string; name: string; price_cents: number };

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#eab308",
  APPROVED: "#3b82f6",
  CONVERTED: "#22c55e",
  REJECTED: "#ef4444",
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "CONVERTED", "REJECTED"];

export default function InvitesPage() {
  const { data, loading, error, refetch } = useAdminResource<
    InviteRequest[]
  >("/api/admin/invites", "requests");
  const { data: plans } = useAdminResource<Plan[]>(
    "/api/admin/plans",
    "plans"
  );
  const requests = data ?? [];

  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState<InviteRequest | null>(null);
  const [planId, setPlanId] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const visible =
    filter === "ALL"
      ? requests
      : requests.filter((r) => r.status === filter);

  function openDetail(r: InviteRequest) {
    setSel(r);
    setPlanId(r.membership_plan_id ?? "");
    setBanner(null);
    setOkMsg(null);
    setConfirmConvert(false);
  }

  async function act(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string
  ) {
    setBusy(true);
    setBanner(null);
    setOkMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setOkMsg(successMsg);
      await refetch();
      // keep drawer open, refresh selected row
    } else setBanner(r.error ?? "That action failed.");
  }

  const setStatus = (status: string) =>
    act(
      () =>
        adminMutate("/api/admin/invites", "PATCH", {
          id: sel!.id,
          status,
        }),
      `Marked ${status}.`
    );

  const send = (resend: boolean) =>
    act(
      () =>
        adminMutate("/api/admin/invites", "POST", {
          action: resend ? "resend" : "send",
          inviteRequestId: sel!.id,
          membershipPlanId: planId || undefined,
        }),
      resend ? "Invitation re-sent." : "Invitation sent."
    );

  const convert = () =>
    act(
      () =>
        adminMutate("/api/admin/invites", "POST", {
          action: "convert",
          inviteRequestId: sel!.id,
          email: sel!.email,
          firstName: sel!.first_name,
          lastName: sel!.last_name,
          membershipPlanId: planId,
        }),
      "Member created."
    );

  const del = () =>
    act(
      () =>
        adminMutate("/api/admin/invites", "DELETE", { id: sel!.id }),
      "Request deleted."
    ).then(() => setSel(null));

  const fullName = (r: InviteRequest) =>
    `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email;

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Invitations
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Review applicants, send the membership invitation, or create the
        member directly.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.5px] transition-colors ${
              filter === f
                ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C] border-[rgba(201,168,76,0.35)]"
                : "border-[rgba(255,255,255,0.07)] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            }`}
          >
            {f === "ALL" ? "All" : f}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {error}
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No requests in this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Car", "Invitation", "Status", ""].map(
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
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className="cursor-pointer hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                    {fullName(r)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {r.email}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                    {r.car_driving || "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px]">
                    {r.invitation_sent_at ? (
                      <span
                        style={{
                          color: r.invitation_expired
                            ? "#ef4444"
                            : "#22c55e",
                        }}
                      >
                        {r.invitation_expired ? "Expired" : "Sent"}
                      </span>
                    ) : (
                      <span className="text-[rgba(245,245,240,0.25)]">
                        Not sent
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <span
                      className="inline-block rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                      style={{ color: STATUS_COLOR[r.status] }}
                    >
                      {r.status}
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
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] max-w-[94vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto p-7">
            <button
              type="button"
              onClick={() => setSel(null)}
              className="float-right text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            >
              ✕
            </button>
            <div className="text-[22px] font-bold text-[#F5F5F0]">
              {fullName(sel)}
            </div>
            <div className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1 mb-4">
              Applicant · {sel.status}
            </div>

            {banner && (
              <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
                {banner}
              </div>
            )}
            {okMsg && (
              <div className="mb-4 rounded-lg border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-3.5 py-2.5 text-[12px] text-[#7ee2a8]">
                {okMsg}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5">
                Membership plan
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]"
              >
                <option value="">Select a plan…</option>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${(p.price_cents / 100).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <button
                type="button"
                disabled={busy || !planId}
                onClick={() => send(false)}
                className="rounded-lg bg-[#C9A84C] px-3.5 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
              >
                Send invitation
              </button>
              {sel.invitation_sent_at && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send(true)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3.5 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.7)] hover:text-[#F5F5F0] disabled:opacity-40"
                >
                  Resend
                </button>
              )}
              <button
                type="button"
                disabled={busy || sel.status === "PENDING"}
                onClick={() => setStatus("PENDING")}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3.5 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.7)] hover:text-[#F5F5F0] disabled:opacity-40"
              >
                Mark New
              </button>
              <button
                type="button"
                disabled={busy || sel.status === "APPROVED"}
                onClick={() => setStatus("APPROVED")}
                className="rounded-lg border border-[rgba(59,130,246,0.4)] px-3.5 py-2.5 text-[12px] font-semibold text-[#7fb0f5] hover:bg-[rgba(59,130,246,0.1)] disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy || sel.status === "REJECTED"}
                onClick={() => setStatus("REJECTED")}
                className="rounded-lg border border-[rgba(239,68,68,0.35)] px-3.5 py-2.5 text-[12px] font-semibold text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
              >
                Reject
              </button>
            </div>

            {/* Make member — destructive (creates an auth user) */}
            <div className="rounded-lg border border-dashed border-[rgba(201,168,76,0.3)] p-3.5 mb-5">
              <div className="text-[12px] text-[rgba(245,245,240,0.7)] mb-2">
                Create the member account directly (skips the signup
                link). Requires a plan.
              </div>
              {confirmConvert ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !planId}
                    onClick={convert}
                    className="rounded-lg bg-[#22c55e] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#16a34a] disabled:opacity-40"
                  >
                    {busy ? "Creating…" : "Confirm — create member"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmConvert(false)}
                    className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3.5 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!planId}
                  onClick={() => setConfirmConvert(true)}
                  className="rounded-lg border border-[rgba(201,168,76,0.4)] px-3.5 py-2 text-[12px] font-semibold text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)] disabled:opacity-40"
                >
                  Make member now
                </button>
              )}
            </div>

            {/* Details */}
            <div className="border-t border-[rgba(255,255,255,0.07)] py-4 space-y-1.5 text-[13px]">
              {(
                [
                  ["Email", sel.email],
                  ["Phone", sel.phone],
                  ["Age", sel.age],
                  ["Instagram", sel.instagram_handle],
                  ["Car", sel.car_driving],
                  ["Plate", sel.license_plate],
                  ["Work", sel.type_of_work],
                  ["Referred by", sel.referred_by],
                  ["Tier requested", sel.selected_tier],
                  [
                    "Invitation sent",
                    sel.invitation_sent_at
                      ? new Date(
                          sel.invitation_sent_at
                        ).toLocaleString()
                      : "—",
                  ],
                  [
                    "Expires",
                    sel.invitation_expires_at
                      ? new Date(
                          sel.invitation_expires_at
                        ).toLocaleDateString()
                      : "—",
                  ],
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
            </div>

            <button
              type="button"
              onClick={del}
              disabled={busy}
              className="mt-2 text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#ef4444] disabled:opacity-40"
            >
              Delete request
            </button>
          </aside>
        </>
      )}
    </div>
  );
}
