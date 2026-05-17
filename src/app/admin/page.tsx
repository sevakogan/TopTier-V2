"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PipelineItem, PipelineStage } from "@/lib/backend/pipeline";
import {
  PersonDrawer,
  type DrawerTarget,
} from "@/components/admin/person-drawer";

type ViewMode = "board" | "table";

type FilterKey = PipelineStage | "all";

const COLUMNS: { stage: PipelineStage; label: string; color: string }[] = [
  { stage: "New", label: "New", color: "#eab308" },
  { stage: "Review", label: "In Review", color: "#3b82f6" },
  { stage: "Garage", label: "Garage Membership", color: "#9aa0a6" },
  { stage: "Core", label: "Core", color: "#C9A84C" },
  { stage: "VIP", label: "VIP", color: "#a855f7" },
  { stage: "Strategic", label: "Strategic Circle", color: "#22c55e" },
  { stage: "Partners", label: "Partners", color: "#06b6d4" },
  { stage: "Declined", label: "Declined", color: "#ef4444" },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "New", label: "New" },
  { key: "Review", label: "In Review" },
  { key: "Garage", label: "Garage" },
  { key: "Core", label: "Core" },
  { key: "VIP", label: "VIP" },
  { key: "Strategic", label: "Strategic" },
  { key: "Partners", label: "Partners" },
  { key: "Declined", label: "Declined" },
];

const STAGE_COLOR: Record<PipelineStage, string> = {
  New: "#eab308",
  Review: "#3b82f6",
  Garage: "#9aa0a6",
  Core: "#C9A84C",
  VIP: "#a855f7",
  Strategic: "#22c55e",
  Partners: "#06b6d4",
  Declined: "#ef4444",
};

const STAGE_LABEL: Record<PipelineStage, string> = {
  New: "New",
  Review: "In Review",
  Garage: "Garage",
  Core: "Core",
  VIP: "VIP",
  Strategic: "Strategic",
  Partners: "Partners",
  Declined: "Declined",
};

function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("board");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/pipeline", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Could not load the pipeline.");
        setLoading(false);
        return;
      }
      const payload = (await res.json()) as { items?: PipelineItem[] };
      setItems(payload.items ?? []);
    } catch {
      setError("Could not load the pipeline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    setIsMobile(mobile);
    setView(mobile ? "table" : "board");
    fetchPipeline();
  }, [fetchPipeline]);

  async function moveItem(item: PipelineItem, to: PipelineStage) {
    setMoveError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setMoveError("Session expired. Please sign in again.");
        return;
      }
      const res = await fetch("/api/admin/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: item.type,
          recordId: item.recordId,
          to,
        }),
      });
      if (!res.ok) {
        let msg = "That move isn’t allowed.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // keep default
        }
        setMoveError(msg);
      }
    } catch {
      setMoveError("Something went wrong. Please try again.");
    } finally {
      await fetchPipeline();
    }
  }

  function onDrop(stage: PipelineStage) {
    if (!dragId) return;
    const item = items.find((i) => i.id === dragId) ?? null;
    setDragId(null);
    if (!item || item.stage === stage) return;
    if (item.type === "partner") {
      setMoveError("Partners are not moved via the pipeline.");
      return;
    }
    moveItem(item, stage);
  }

  const draggable = !isMobile;
  const visibleColumns =
    filter === "all"
      ? COLUMNS
      : COLUMNS.filter((c) => c.stage === filter);
  const visibleItems =
    filter === "all" ? items : items.filter((i) => i.stage === filter);

  return (
    <div>
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Pipeline
        </h1>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Every person in one place — applicants, garage pass, each membership
        tier, partners.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3.5 mb-5">
        <div className="inline-flex rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
          {(["board", "table"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors ${
                view === v
                  ? "bg-[rgba(201,168,76,0.14)] text-[#C9A84C]"
                  : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] tracking-[1px] uppercase text-[rgba(245,245,240,0.25)] mr-0.5">
            Type
          </span>
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
      </div>

      {moveError && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#ef8c8c]">
          {moveError}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[230px] h-[440px] rounded-2xl bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center">
          <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-4">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPipeline}
            className="rounded-lg border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
          >
            Retry
          </button>
        </div>
      ) : view === "board" ? (
        /* BOARD */
        <div className="flex gap-3 overflow-x-auto pb-2.5">
          {visibleColumns.map((col) => {
            const colItems = items.filter((i) => i.stage === col.stage);
            return (
              <div
                key={col.stage}
                onDragOver={(e) => {
                  if (draggable) e.preventDefault();
                }}
                onDrop={() => onDrop(col.stage)}
                className="w-[230px] flex-none min-h-[440px] rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111111] p-3.5"
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
                  colItems.map((item) => {
                    const canDrag = draggable && item.type !== "partner";
                    return (
                      <div
                        key={item.id}
                        draggable={canDrag}
                        onDragStart={() => setDragId(item.id)}
                        onDragEnd={() => setDragId(null)}
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
                        <span className="inline-block mt-1.5 rounded bg-[rgba(201,168,76,0.14)] px-1.5 py-1 text-[9px] font-semibold tracking-[1px] text-[#C9A84C]">
                          {item.subtitle.toUpperCase()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE */
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Type", "Tier / Status", "Email", "Phone", "Since"].map(
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
              {visibleItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3.5 py-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]"
                  >
                    No matching people.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setDrawer(toTarget(item))}
                    className="cursor-pointer hover:bg-[rgba(201,168,76,0.05)]"
                  >
                    <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                      {item.name}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px]">
                      <span
                        className="inline-block rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold tracking-[0.5px]"
                        style={{ color: STAGE_COLOR[item.stage] }}
                      >
                        {STAGE_LABEL[item.stage]}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <PersonDrawer
        target={drawer}
        onClose={() => setDrawer(null)}
        onChanged={fetchPipeline}
      />
    </div>
  );
}
