"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PersonRecord } from "@/lib/backend/person";
import type { PersonType, PipelineStage } from "@/lib/backend/pipeline";
import { useAdminPipeline } from "@/components/admin/admin-data";
import { useAdminResource } from "@/lib/admin/use-admin-api";
import { ImageLightbox } from "@/components/admin/image-lightbox";

type Plan = { id: string; name: string; price_cents: number };

type DrawerLayout = "side" | "popup";
const LAYOUT_KEY = "ttmc.drawerLayout";

function readLayout(): DrawerLayout {
  if (typeof window === "undefined") return "side";
  return window.localStorage.getItem(LAYOUT_KEY) === "popup"
    ? "popup"
    : "side";
}

type DrawerTarget = {
  type: PersonType;
  recordId: string;
  name: string;
  subtitle: string;
};

async function authToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function ActionButton({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: "default" | "go" | "gold" | "no";
  disabled: boolean;
  onClick: () => void;
}) {
  const styles: Record<typeof variant, string> = {
    default:
      "border border-[rgba(255,255,255,0.07)] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] hover:border-[rgba(255,255,255,0.2)]",
    go: "bg-[#22c55e] text-white border border-transparent hover:bg-[#16a34a]",
    gold: "bg-[#C9A84C] text-[#0A0A0A] border border-transparent hover:bg-[#d8b965]",
    no: "border border-[rgba(239,68,68,0.35)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2.5 text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

export function PersonDrawer({
  target,
  onClose,
  onChanged,
}: {
  target: DrawerTarget | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { getPerson, loadPerson } = useAdminPipeline();
  const { data: plans } = useAdminResource<Plan[]>(
    "/api/admin/plans",
    "plans"
  );
  const open = target !== null;
  const [record, setRecord] = useState<PersonRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);
  const [layout, setLayout] = useState<DrawerLayout>("side");
  const [planId, setPlanId] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    setLayout(readLayout());
  }, []);

  function toggleLayout() {
    setLayout((prev) => {
      const next: DrawerLayout = prev === "side" ? "popup" : "side";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAYOUT_KEY, next);
      }
      return next;
    });
  }

  const applyRecord = useCallback(
    (rec: PersonRecord | null) => {
      setRecord(rec);
      setNotes(rec?.notes ?? "");
    },
    []
  );

  const loadRecord = useCallback(
    async (force = false) => {
      if (!target) return;
      setError(null);
      setBanner(null);
      const rec = await loadPerson(target.type, target.recordId, force);
      if (rec) applyRecord(rec);
      else setError("Could not load this record.");
      setLoading(false);
    },
    [target, loadPerson, applyRecord]
  );

  useEffect(() => {
    if (!target) return;
    // Instant: paint cached record immediately, no skeleton.
    const cached = getPerson(target.type, target.recordId);
    if (cached) {
      applyRecord(cached);
      setLoading(false);
      void loadRecord(true); // silent background refresh
    } else {
      setRecord(null);
      setLoading(true);
      void loadRecord(false);
    }
    // Count this as a real open (one per drawer-open — NOT prefetch /
    // hover / background revalidate, which never change `target`).
    void (async () => {
      const t = await authToken();
      if (!t) return;
      void fetch("/api/admin/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          type: target.type,
          recordId: target.recordId,
          action: "open",
        }),
      });
    })();
  }, [target, getPerson, applyRecord, loadRecord]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function move(to: PipelineStage) {
    if (!target) return;
    setBusy(true);
    setBanner(null);
    try {
      const token = await authToken();
      if (!token) {
        setBanner("Session expired. Please sign in again.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: target.type,
          recordId: target.recordId,
          to,
        }),
      });
      if (res.ok) {
        onChanged();
        await loadRecord(true);
      } else {
        let msg = "That move isn’t allowed.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // keep default message
        }
        setBanner(msg);
      }
    } catch {
      setBanner("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function memberOp(
    op: "reactivate" | "suspend" | "terminate" | "reset_password"
  ) {
    if (!target) return;
    setBusy(true);
    setBanner(null);
    try {
      const token = await authToken();
      if (!token) {
        setBanner("Session expired. Please sign in again.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: target.type,
          recordId: target.recordId,
          action: "member-op",
          op,
        }),
      });
      const body = (await res
        .json()
        .catch(() => ({}))) as { error?: string; message?: string };
      if (res.ok) {
        if (body.message) setBanner(body.message);
        onChanged();
        await loadRecord(true);
      } else {
        setBanner(body.error ?? "That action failed.");
      }
    } catch {
      setBanner("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    if (!target) return;
    setBusy(true);
    setBanner(null);
    try {
      const token = await authToken();
      if (!token) {
        setBanner("Session expired. Please sign in again.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/person", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: target.type,
          recordId: target.recordId,
          notes,
        }),
      });
      if (res.ok) {
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 1800);
        // Keep the cache fresh so reopening shows the saved notes.
        void loadPerson(target.type, target.recordId, true);
      } else if (res.status === 422) {
        setBanner(
          "Notes for leads/garage need the one-line internal-meta migration — run it in Supabase, then this saves."
        );
      } else {
        setBanner("Could not save notes.");
      }
    } catch {
      setBanner("Could not save notes.");
    } finally {
      setBusy(false);
    }
  }

  // Lead → Payment Requested: approve + email the signup/payment link.
  async function requestPayment() {
    if (!target || !planId) return;
    setBusy(true);
    setBanner(null);
    try {
      const token = await authToken();
      if (!token) {
        setBanner("Session expired. Please sign in again.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "send",
          inviteRequestId: target.recordId,
          membershipPlanId: planId,
        }),
      });
      if (res.ok) {
        setPlanId("");
        onChanged();
        await loadRecord(true);
      } else {
        let msg = "Could not send the payment link.";
        try {
          const b = (await res.json()) as { error?: string };
          if (b.error) msg = b.error;
        } catch {
          // keep default
        }
        setBanner(msg);
      }
    } catch {
      setBanner("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          open
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel — side drawer or centered popup (user preference) */}
      <aside
        className={
          layout === "popup"
            ? `fixed left-1/2 top-1/2 z-50 w-[1040px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#0d0d0d] border border-[rgba(255,255,255,0.07)] overflow-y-auto shadow-2xl transition-all duration-200 ${
                open
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`
            : `fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-[92vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto transition-transform duration-300 ${
                open ? "translate-x-0" : "translate-x-full"
              }`
        }
      >
        {target && (
          <div className="p-7">
            <div className="float-right flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLayout}
                aria-label="Toggle view"
                title={
                  layout === "side"
                    ? "Switch to popup view"
                    : "Switch to side panel"
                }
                className="rounded-md border border-[rgba(255,255,255,0.1)] px-2 py-1 text-[10px] font-semibold tracking-[1px] uppercase text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] hover:border-[rgba(201,168,76,0.35)] transition-colors"
              >
                {layout === "side" ? "⤢ Popup" : "⤡ Side"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[20px] leading-none text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                ✕
              </button>
            </div>

            <div className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
              {record?.name ?? target.name}
            </div>
            <div className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1 mb-4">
              {record?.headline ?? target.subtitle}
            </div>

            {banner && (
              <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#ef8c8c]">
                {banner}
              </div>
            )}

            {/* Action buttons */}
            {target.type === "applicant" && (
              <>
                <div className="mb-2 text-[10px] tracking-[2px] uppercase text-[#C9A84C]">
                  Lead status
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <ActionButton
                    label="New"
                    variant="default"
                    disabled={busy || loading}
                    onClick={() => move("New")}
                  />
                  <ActionButton
                    label="In Review"
                    variant="go"
                    disabled={busy || loading}
                    onClick={() => move("InReview")}
                  />
                  <ActionButton
                    label="Decline"
                    variant="no"
                    disabled={busy || loading}
                    onClick={() => move("Declined")}
                  />
                </div>
                <div className="mb-4 rounded-lg border border-[rgba(201,168,76,0.3)] px-3.5 py-3">
                  <div className="text-[12px] text-[rgba(245,245,240,0.7)] mb-2">
                    Move to <b>Payment Requested</b> — approves them and
                    emails the signup + payment link.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className="flex-1 min-w-[150px] rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2 text-[12px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]"
                    >
                      <option value="">Select a plan…</option>
                      {(plans ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — $
                          {(p.price_cents / 100).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={requestPayment}
                      disabled={busy || loading || !planId}
                      className="rounded-lg bg-[#C9A84C] px-3.5 py-2 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] disabled:opacity-40"
                    >
                      Approve &amp; send link
                    </button>
                  </div>
                </div>
              </>
            )}

            {(target.type === "member" || target.type === "garage") && (
              <div className="flex flex-wrap gap-2 mb-3">
                <ActionButton
                  label="Set Core"
                  variant="gold"
                  disabled={busy || loading}
                  onClick={() => move("Core")}
                />
                <ActionButton
                  label="Set VIP"
                  variant="default"
                  disabled={busy || loading}
                  onClick={() => move("VIP")}
                />
                <ActionButton
                  label="Set Strategic"
                  variant="default"
                  disabled={busy || loading}
                  onClick={() => move("Strategic")}
                />
                <ActionButton
                  label="Decline"
                  variant="no"
                  disabled={busy || loading}
                  onClick={() => move("Declined")}
                />
              </div>
            )}
            {(target.type === "member" || target.type === "garage") && (
              <div className="flex flex-wrap gap-2 mb-3">
                <ActionButton
                  label="Reactivate"
                  variant="go"
                  disabled={busy || loading}
                  onClick={() => memberOp("reactivate")}
                />
                <ActionButton
                  label="Suspend"
                  variant="default"
                  disabled={busy || loading}
                  onClick={() => memberOp("suspend")}
                />
                <ActionButton
                  label="Terminate"
                  variant="no"
                  disabled={busy || loading}
                  onClick={() => memberOp("terminate")}
                />
                <ActionButton
                  label="Send password reset"
                  variant="default"
                  disabled={busy || loading}
                  onClick={() => memberOp("reset_password")}
                />
              </div>
            )}

            {/* Body */}
            {loading ? (
              <div className="mt-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-[rgba(255,255,255,0.04)] animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="mt-6 rounded-lg border border-[rgba(255,255,255,0.07)] p-5 text-center">
                <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-3">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => loadRecord(false)}
                  className="rounded-lg border border-[rgba(255,255,255,0.07)] px-4 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
                >
                  Retry
                </button>
              </div>
            ) : record ? (
              <>
                <div
                  className={
                    layout === "popup"
                      ? "grid grid-cols-2 gap-x-10"
                      : ""
                  }
                >
                {record.sections.map((section) => (
                  <div
                    key={section.title}
                    className="border-t border-[rgba(255,255,255,0.07)] py-4"
                  >
                    <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                      {section.title}
                    </h4>
                    {section.rows.length === 0 ? (
                      <div className="text-[12px] italic text-[rgba(245,245,240,0.25)]">
                        None
                      </div>
                    ) : (
                      section.rows.map((row, idx) => (
                        <div
                          key={`${section.title}-${idx}`}
                          className="flex justify-between gap-4 py-1.5 text-[13px]"
                        >
                          <span className="text-[rgba(245,245,240,0.45)] shrink-0">
                            {row.label}
                          </span>
                          <span className="text-[#F5F5F0] text-right break-words">
                            {row.value}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
                </div>

                {record.media.length > 0 && (
                  <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
                    <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                      Media
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {record.media.map((url, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${url}-${idx}`}
                          src={url}
                          alt="Uploaded media"
                          onClick={() => setLightbox(url)}
                          className="h-24 w-full rounded-lg object-cover border border-[rgba(255,255,255,0.07)] cursor-zoom-in"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal — staff only (note + open tracking) */}
                <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C]">
                      Internal · staff only
                    </h4>
                    {record && record.openCount > 0 && (
                      <span className="text-[10px] text-[rgba(245,245,240,0.45)]">
                        Opened {record.openCount}×
                        {record.lastOpenedAt
                          ? ` · last ${new Date(
                              record.lastOpenedAt
                            ).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}`
                          : ""}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Private internal note — staff only."
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] p-3 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)] resize-y"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveNotes}
                      disabled={busy}
                      className="rounded-lg bg-[#C9A84C] px-3.5 py-2 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] transition-colors disabled:opacity-40"
                    >
                      Save note
                    </button>
                    {savedTick && (
                      <span className="text-[12px] text-[#22c55e]">
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
                No record found.
              </div>
            )}
          </div>
        )}
      </aside>
      <ImageLightbox
        src={lightbox}
        onClose={() => setLightbox(null)}
      />
    </>
  );
}

export type { DrawerTarget };
