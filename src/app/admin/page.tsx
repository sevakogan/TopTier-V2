"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  PipelineItem,
  PipelineStage,
  PipelineGroup,
} from "@/lib/backend/pipeline";
import {
  PersonDrawer,
  type DrawerTarget,
} from "@/components/admin/person-drawer";
import { useAdminPipeline } from "@/components/admin/admin-data";
import { useAdminResource } from "@/lib/admin/use-admin-api";

type ViewMode = "board" | "table";
type Plan = { id: string; name: string; price_cents: number };

const COLUMNS: Record<
  PipelineGroup,
  { stage: PipelineStage; label: string; color: string }[]
> = {
  lead: [
    { stage: "New", label: "New", color: "#eab308" },
    { stage: "InReview", label: "In Review", color: "#3b82f6" },
    {
      stage: "PaymentRequested",
      label: "Payment Requested",
      color: "#C9A84C",
    },
    { stage: "Declined", label: "Declined", color: "#ef4444" },
  ],
  client: [
    { stage: "Garage", label: "Garage", color: "#9aa0a6" },
    { stage: "Core", label: "Core", color: "#C9A84C" },
    { stage: "VIP", label: "VIP", color: "#a855f7" },
    { stage: "Strategic", label: "Strategic Circle", color: "#22c55e" },
    { stage: "Partners", label: "Partners", color: "#06b6d4" },
  ],
};

const CLIENT_TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "member", label: "Members" },
  { key: "garage", label: "Garage" },
  { key: "partner", label: "Partners" },
] as const;

function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function ago(value: string | null): string {
  if (!value) return "";
  const ms = Date.now() - new Date(value).getTime();
  if (isNaN(ms)) return "";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function toTarget(item: PipelineItem): DrawerTarget {
  return {
    type: item.type,
    recordId: item.recordId,
    name: item.name,
    subtitle: item.subtitle,
  };
}

export default function PipelinePage() {
  const { items, loading, error, refetch, loadPerson } =
    useAdminPipeline();
  const { data: plans } = useAdminResource<Plan[]>(
    "/api/admin/plans",
    "plans"
  );

  const [group, setGroup] = useState<PipelineGroup>("lead");
  const [view, setView] = useState<ViewMode>("board");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<PipelineItem | null>(null);
  const [planId, setPlanId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    setIsMobile(mobile);
    setView(mobile ? "table" : "board");
  }, []);

  async function authedJSON(
    path: string,
    body: unknown
  ): Promise<{ ok: boolean; error?: string }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, error: "Session expired." };
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    try {
      const j = (await res.json()) as { error?: string };
      return { ok: false, error: j.error ?? "Action failed." };
    } catch {
      return { ok: false, error: "Action failed." };
    }
  }

  async function moveItem(item: PipelineItem, to: PipelineStage) {
    setMoveError(null);
    const r = await authedJSON("/api/admin/person", {
      type: item.type,
      recordId: item.recordId,
      to,
    });
    if (!r.ok) setMoveError(r.error ?? "That move isn’t allowed.");
    await refetch();
  }

  async function sendInvite() {
    if (!planModal || !planId) return;
    setBusy(true);
    setMoveError(null);
    const r = await authedJSON("/api/admin/invites", {
      action: "send",
      inviteRequestId: planModal.recordId,
      membershipPlanId: planId,
    });
    setBusy(false);
    if (r.ok) {
      setPlanModal(null);
      setPlanId("");
      await refetch();
    } else {
      setMoveError(r.error ?? "Could not send the invitation.");
    }
  }

  function onDrop(stage: PipelineStage) {
    if (!dragId) return;
    const item = items.find((i) => i.id === dragId) ?? null;
    setDragId(null);
    if (!item || item.stage === stage) return;
    if (item.group !== group) return;
    if (item.type === "partner") {
      setMoveError("Partners aren’t moved via the pipeline.");
      return;
    }
    // Automation: requesting payment = approve + email the link. Always
    // confirm the plan first.
    if (item.group === "lead" && stage === "PaymentRequested") {
      setPlanId("");
      setMoveError(null);
      setPlanModal(item);
      return;
    }
    moveItem(item, stage);
  }

  const columns = COLUMNS[group];
  const groupItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.group === group &&
          (group === "lead" ||
            typeFilter === "all" ||
            i.type === typeFilter ||
            (typeFilter === "member" && i.type === "member"))
      ),
    [items, group, typeFilter]
  );
  const draggable = !isMobile;

  function Card({ item }: { item: PipelineItem }) {
    const canDrag = draggable && item.type !== "partner";
    return (
      <div
        draggable={canDrag}
        onDragStart={() => setDragId(item.id)}
        onDragEnd={() => setDragId(null)}
        onMouseEnter={() => loadPerson(item.type, item.recordId)}
        onPointerDown={() => loadPerson(item.type, item.recordId)}
        onClick={() => setDrawer(toTarget(item))}
        className={`mb-2 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#171717] p-3 transition-all hover:border-[rgba(201,168,76,0.35)] hover:-translate-y-px ${
          canDrag ? "cursor-grab" : "cursor-pointer"
        }`}
      >
        <div className="text-[13px] font-semibold text-[#F5F5F0] mb-0.5">
          {item.name}
        </div>
        <div className="text-[11px] text-[rgba(245,245,240,0.45)] truncate">
          {item.email || item.subtitle}
        </div>
        {item.claimedByEmail && (
          <div className="mt-1.5 text-[10px] text-[#7fb0f5]">
            🧑 {item.claimedByEmail}
            {item.claimedAt ? ` · ${ago(item.claimedAt)}` : ""}
          </div>
        )}
        <span className="inline-block mt-1.5 rounded bg-[rgba(201,168,76,0.14)] px-1.5 py-1 text-[9px] font-semibold tracking-[1px] text-[#C9A84C]">
          {item.subtitle.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Pipeline
        </h1>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Leads move through the funnel; the moment they become an active
        member they cross over to Clients on their own.
      </p>

      {/* One inline toolbar: who (Leads/Clients) · how (Board/Table) ·
          which (type filter), grouped with dividers + breathing room. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
        {/* Primary axis — Leads / Clients (pill) */}
        <div className="inline-flex rounded-full border border-[rgba(255,255,255,0.1)] p-0.5">
          {(
            [
              ["lead", "Leads"],
              ["client", "Clients"],
            ] as [PipelineGroup, string][]
          ).map(([g, lbl]) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`rounded-full px-5 py-2 text-[12px] font-semibold transition-colors ${
                group === g
                  ? "bg-[#C9A84C] text-[#0A0A0A]"
                  : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <span className="hidden sm:block h-6 w-px bg-[rgba(255,255,255,0.1)]" />

        {/* View — Board / Table (segmented) */}
        <div className="inline-flex rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
          {(["board", "table"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-2 text-[12px] font-semibold capitalize transition-colors ${
                view === v
                  ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C]"
                  : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {group === "client" && (
          <>
            <span className="hidden sm:block h-6 w-px bg-[rgba(255,255,255,0.1)]" />
            <div className="flex flex-wrap items-center gap-2">
              {CLIENT_TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTypeFilter(f.key)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.5px] transition-colors ${
                    typeFilter === f.key
                      ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C] border-[rgba(201,168,76,0.35)]"
                      : "border-[rgba(255,255,255,0.07)] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {moveError && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#ef8c8c]">
          {moveError}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[230px] h-[440px] rounded-2xl bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center">
          <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-4">
            {error}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
          >
            Retry
          </button>
        </div>
      ) : view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2.5">
          {columns.map((col) => {
            const colItems = groupItems.filter(
              (i) => i.stage === col.stage
            );
            return (
              <div
                key={col.stage}
                onDragOver={(e) => {
                  if (draggable) e.preventDefault();
                }}
                onDrop={() => onDrop(col.stage)}
                className="w-[250px] flex-none min-h-[440px] rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111111] p-3.5"
              >
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[rgba(255,255,255,0.07)]">
                  <span
                    className="text-[11px] font-semibold tracking-[1.2px] uppercase"
                    style={{ color: col.color }}
                  >
                    ● {col.label}
                  </span>
                  <span className="text-[11px] font-bold text-[rgba(245,245,240,0.25)]">
                    {colItems.length}
                  </span>
                </div>
                {colItems.length === 0 ? (
                  <div className="py-7 text-center text-[11px] italic text-[rgba(245,245,240,0.25)]">
                    Nothing here yet
                  </div>
                ) : (
                  colItems.map((item) => (
                    <Card key={item.id} item={item} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Name",
                  "Stage",
                  "Detail",
                  "Email",
                  "Phone",
                  "Since",
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
              {groupItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3.5 py-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]"
                  >
                    Nobody here yet.
                  </td>
                </tr>
              ) : (
                groupItems.map((item) => {
                  const col = columns.find(
                    (c) => c.stage === item.stage
                  );
                  return (
                    <tr
                      key={item.id}
                      onMouseEnter={() =>
                        loadPerson(item.type, item.recordId)
                      }
                      onPointerDown={() =>
                        loadPerson(item.type, item.recordId)
                      }
                      onClick={() => setDrawer(toTarget(item))}
                      className="cursor-pointer hover:bg-[rgba(201,168,76,0.05)]"
                    >
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                        {item.name}
                        {item.claimedByEmail && (
                          <span className="ml-2 text-[10px] text-[#7fb0f5]">
                            🧑 {item.claimedByEmail}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px]">
                        <span
                          className="inline-block rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold tracking-[0.5px]"
                          style={{ color: col?.color ?? "#9aa0a6" }}
                        >
                          {col?.label ?? item.stage}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                        {item.subtitle}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                        {item.email || "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.7)]">
                        {item.phone || "—"}
                      </td>
                      <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.45)]">
                        {shortDate(item.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Plan-confirm modal (Payment Requested automation) */}
      {planModal && (
        <>
          <div
            onClick={() => setPlanModal(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
            <h2 className="text-[18px] font-bold text-[#F5F5F0] mb-1">
              Request payment
            </h2>
            <p className="text-[12px] text-[rgba(245,245,240,0.45)] mb-5">
              Approves <b>{planModal.name}</b> and emails them the signup
              + payment link for the plan you pick.
            </p>
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
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanModal(null)}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendInvite}
                disabled={busy || !planId}
                className="rounded-lg bg-[#C9A84C] px-5 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
              >
                {busy ? "Sending…" : "Approve & send link"}
              </button>
            </div>
          </div>
        </>
      )}

      <PersonDrawer
        target={drawer}
        onClose={() => setDrawer(null)}
        onChanged={refetch}
      />
    </div>
  );
}
