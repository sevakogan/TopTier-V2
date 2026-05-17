"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PersonRecord } from "@/lib/backend/person";
import type { PersonType, PipelineStage } from "@/lib/backend/pipeline";

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
  const open = target !== null;
  const [record, setRecord] = useState<PersonRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesEditable, setNotesEditable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setBanner(null);
    try {
      const token = await authToken();
      if (!token) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch(
        `/api/admin/person?type=${encodeURIComponent(
          target.type
        )}&id=${encodeURIComponent(target.recordId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        setError("Could not load this record.");
        setLoading(false);
        return;
      }
      const payload = (await res.json()) as { record?: PersonRecord };
      const rec = payload.record ?? null;
      setRecord(rec);
      setNotes(rec?.notes ?? "");
      setNotesEditable(target.type === "member" || target.type === "partner");
    } catch {
      setError("Could not load this record.");
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    if (target) {
      setRecord(null);
      loadRecord();
    }
  }, [target, loadRecord]);

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
        await loadRecord();
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
      } else if (res.status === 422) {
        setNotesEditable(false);
      } else {
        setBanner("Could not save notes.");
      }
    } catch {
      setBanner("Could not save notes.");
    } finally {
      setBusy(false);
    }
  }

  const rejected =
    record?.headline?.toUpperCase().includes("REJECTED") ?? false;

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

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-[92vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {target && (
          <div className="p-7">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="float-right text-[20px] leading-none text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            >
              ✕
            </button>

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
                <div className="flex flex-wrap gap-2 mb-3">
                  <ActionButton
                    label="Move to In Review"
                    variant="go"
                    disabled={busy || loading}
                    onClick={() => move("Review")}
                  />
                  <ActionButton
                    label="Decline"
                    variant="no"
                    disabled={busy || loading}
                    onClick={() => move("Declined")}
                  />
                  {rejected && (
                    <ActionButton
                      label="Reopen"
                      variant="default"
                      disabled={busy || loading}
                      onClick={() => move("New")}
                    />
                  )}
                </div>
                <div className="mb-2 rounded-lg border border-dashed border-[rgba(201,168,76,0.3)] px-3.5 py-3 text-[12px] leading-relaxed text-[rgba(245,245,240,0.45)]">
                  Turning an applicant into a member uses the invite + signup
                  flow — approve here, then send the invitation.
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
                  label="Decline / Suspend"
                  variant="no"
                  disabled={busy || loading}
                  onClick={() => move("Declined")}
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
                  onClick={loadRecord}
                  className="rounded-lg border border-[rgba(255,255,255,0.07)] px-4 py-2 text-[12px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
                >
                  Retry
                </button>
              </div>
            ) : record ? (
              <>
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
                          className="h-24 w-full rounded-lg object-cover border border-[rgba(255,255,255,0.07)]"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin notes */}
                <div className="border-t border-[rgba(255,255,255,0.07)] py-4">
                  <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2.5">
                    Admin notes
                  </h4>
                  {notesEditable ? (
                    <>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Private — staff only."
                        className="w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] p-3 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)] resize-y"
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={saveNotes}
                          disabled={busy}
                          className="rounded-lg bg-[#C9A84C] px-3.5 py-2 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965] transition-colors disabled:opacity-40"
                        >
                          Save notes
                        </button>
                        {savedTick && (
                          <span className="text-[12px] text-[#22c55e]">
                            Saved
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.07)] px-3.5 py-3 text-[12px] text-[rgba(245,245,240,0.45)]">
                      Notes available once they’re a member / partner.
                    </div>
                  )}
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
    </>
  );
}

export type { DrawerTarget };
