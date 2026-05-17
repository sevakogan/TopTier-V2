"use client";

import { useState } from "react";
import type { InviteCode } from "@/lib/backend/invite-codes";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

type Plan = { id: string; name: string; price_cents: number };

const STATUS_COLOR: Record<InviteCode["computed_status"], string> = {
  ACTIVE: "#22c55e",
  INACTIVE: "#9aa0a6",
  EXPIRED: "#ef4444",
  EXHAUSTED: "#eab308",
};

const EMPTY = {
  code: "",
  description: "",
  membership_plan_id: "",
  max_uses: "",
  auto_approve: false,
  skip_payment: false,
  discount_type: "" as "" | "percentage" | "fixed",
  discount_value: "",
  expires_at: "",
  is_active: true,
};

function genCode(): string {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = () =>
    Array.from(
      { length: 4 },
      () => cs[Math.floor(Math.random() * cs.length)]
    ).join("");
  return `TTMC-${b()}-${b()}`;
}

export default function InviteCodesPage() {
  const { data, loading, error, refetch } = useAdminResource<InviteCode[]>(
    "/api/admin/invite-codes",
    "codes"
  );
  const { data: plans } = useAdminResource<Plan[]>(
    "/api/admin/plans",
    "plans"
  );
  const codes = data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY, code: genCode() });
    setBanner(null);
    setOpen(true);
  }

  function startEdit(c: InviteCode) {
    setEditing(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      membership_plan_id: c.membership_plan_id ?? "",
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      auto_approve: c.auto_approve,
      skip_payment: c.skip_payment,
      discount_type: c.discount_type ?? "",
      discount_value:
        c.discount_value != null ? String(c.discount_value) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      is_active: c.is_active,
    });
    setBanner(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setBanner(null);
    const payload = {
      code: form.code,
      description: form.description || null,
      membership_plan_id: form.membership_plan_id || null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      auto_approve: form.auto_approve,
      skip_payment: form.skip_payment,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value
        ? Number(form.discount_value)
        : null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      is_active: form.is_active,
    };
    const r = editing
      ? await adminMutate("/api/admin/invite-codes", "PATCH", {
          id: editing,
          ...payload,
        })
      : await adminMutate("/api/admin/invite-codes", "POST", payload);
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      await refetch();
    } else {
      setBanner(r.error ?? "Could not save.");
    }
  }

  async function toggle(c: InviteCode) {
    await adminMutate("/api/admin/invite-codes", "PATCH", {
      id: c.id,
      is_active: !c.is_active,
    });
    await refetch();
  }

  async function remove(c: InviteCode) {
    const r = await adminMutate("/api/admin/invite-codes", "DELETE", {
      id: c.id,
    });
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  const field =
    "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
  const label =
    "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Invite Codes
        </h1>
        <button
          type="button"
          onClick={startNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] transition-colors"
        >
          + New Code
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Reusable codes for onboarding — tie to a plan, auto-approve, skip
        payment, add a discount, cap uses.
      </p>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && codes.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : codes.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No invite codes yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Code",
                  "Plan",
                  "Uses",
                  "Perks",
                  "Expires",
                  "Status",
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
              {codes.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0] font-mono">
                    {c.code}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                    {c.membership_plan_name ?? "Any tier"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                    {c.current_uses}
                    {c.max_uses != null ? ` / ${c.max_uses}` : " / ∞"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.45)]">
                    {[
                      c.auto_approve ? "Auto-approve" : null,
                      c.skip_payment ? "Skip pay" : null,
                      c.discount_type
                        ? `${c.discount_value}${
                            c.discount_type === "percentage" ? "%" : "$"
                          } off`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.45)]">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <span
                      className="inline-block rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold tracking-[0.5px]"
                      style={{ color: STATUS_COLOR[c.computed_status] }}
                    >
                      {c.computed_status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] mr-3"
                    >
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
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

      {/* Editor modal */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[94vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#F5F5F0]">
                {editing ? "Edit code" : "New invite code"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
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

            <div className="space-y-4">
              <div>
                <label className={label}>Code</label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className={`${field} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, code: genCode() })
                    }
                    className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C]"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className={label}>Description</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Internal note"
                  className={field}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Plan / tier</label>
                  <select
                    value={form.membership_plan_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        membership_plan_id: e.target.value,
                      })
                    }
                    className={field}
                  >
                    <option value="">Any tier</option>
                    {(plans ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Max uses</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses}
                    onChange={(e) =>
                      setForm({ ...form, max_uses: e.target.value })
                    }
                    placeholder="Unlimited"
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Discount type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_type: e.target
                          .value as typeof form.discount_type,
                      })
                    }
                    className={field}
                  >
                    <option value="">None</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Discount value</label>
                  <input
                    type="number"
                    min={0}
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_value: e.target.value,
                      })
                    }
                    disabled={!form.discount_type}
                    className={`${field} disabled:opacity-40`}
                  />
                </div>
              </div>

              <div>
                <label className={label}>Expires</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                  className={field}
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                {(
                  [
                    ["auto_approve", "Auto-approve"],
                    ["skip_payment", "Skip payment"],
                    ["is_active", "Active"],
                  ] as const
                ).map(([k, lbl]) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form[k]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: e.target.checked })
                      }
                      className="accent-[#C9A84C]"
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                {busy ? "Saving…" : editing ? "Save changes" : "Create code"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
