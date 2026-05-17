"use client";

import { useState } from "react";
import type { EventRow, Attendee } from "@/lib/backend/events-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

const TIERS = ["CORE", "EXECUTIVE", "EXECUTIVE_ELITE", "STRATEGIC"];

const EMPTY = {
  title: "",
  description: "",
  event_date: "",
  event_end_date: "",
  location_city: "",
  location_country: "",
  category: "",
  max_capacity: "",
  allowed_tiers: [] as string[],
  is_active: true,
  is_featured: false,
  rsvp_enabled: true,
};

const field =
  "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
const label =
  "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

function fmt(d: string | null): string {
  if (!d) return "—";
  const x = new Date(d);
  return isNaN(x.getTime())
    ? "—"
    : x.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export default function EventsPage() {
  const { data, loading, error, refetch } = useAdminResource<EventRow[]>(
    "/api/admin/events",
    "events"
  );
  const events = data ?? [];

  const [edit, setEdit] = useState<{
    id: string | null;
    form: typeof EMPTY;
  } | null>(null);
  const [attFor, setAttFor] = useState<EventRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function openNew() {
    setBanner(null);
    setEdit({ id: null, form: { ...EMPTY } });
  }
  function openEdit(e: EventRow) {
    setBanner(null);
    setEdit({
      id: e.id,
      form: {
        title: e.title ?? "",
        description: e.description ?? "",
        event_date: e.event_date ? e.event_date.slice(0, 16) : "",
        event_end_date: e.event_end_date
          ? e.event_end_date.slice(0, 16)
          : "",
        location_city: e.location_city ?? "",
        location_country: e.location_country ?? "",
        category: e.category ?? "",
        max_capacity:
          e.max_capacity != null ? String(e.max_capacity) : "",
        allowed_tiers: e.allowed_tiers ?? [],
        is_active: e.is_active,
        is_featured: e.is_featured,
        rsvp_enabled: e.rsvp_enabled,
      },
    });
  }

  async function save() {
    if (!edit) return;
    setBusy(true);
    setBanner(null);
    const f = edit.form;
    const payload = {
      ...f,
      event_date: f.event_date
        ? new Date(f.event_date).toISOString()
        : null,
      event_end_date: f.event_end_date
        ? new Date(f.event_end_date).toISOString()
        : null,
      max_capacity: f.max_capacity ? Number(f.max_capacity) : null,
    };
    const r = edit.id
      ? await adminMutate("/api/admin/events", "PATCH", {
          id: edit.id,
          ...payload,
        })
      : await adminMutate("/api/admin/events", "POST", payload);
    setBusy(false);
    if (r.ok) {
      setEdit(null);
      await refetch();
    } else setBanner(r.error ?? "Could not save.");
  }

  async function remove(e: EventRow) {
    const r = await adminMutate("/api/admin/events", "DELETE", {
      id: e.id,
    });
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Events
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965]"
        >
          + New Event
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Experiences, RSVPs, waitlist and door check-in — live from the real
        listings.
      </p>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No events yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-[#F5F5F0]">
                    {e.title}{" "}
                    {e.is_featured && (
                      <span className="text-[#C9A84C]">★</span>
                    )}
                  </div>
                  <div className="text-[12px] text-[rgba(245,245,240,0.45)] mt-0.5">
                    {fmt(e.event_date)}
                    {e.location_city ? ` · ${e.location_city}` : ""}
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{
                    color: e.is_active ? "#22c55e" : "#9aa0a6",
                  }}
                >
                  {e.is_active ? "LIVE" : "HIDDEN"}
                </span>
              </div>

              <div className="mt-3 flex gap-4 text-[12px]">
                <span className="text-[rgba(245,245,240,0.7)]">
                  <span className="text-[#F5F5F0] font-semibold">
                    {e.confirmedCount}
                  </span>
                  {e.max_capacity != null ? `/${e.max_capacity}` : ""}{" "}
                  going
                </span>
                <span className="text-[rgba(245,245,240,0.7)]">
                  <span className="text-[#eab308] font-semibold">
                    {e.waitlistCount}
                  </span>{" "}
                  waitlist
                </span>
                <span className="text-[rgba(245,245,240,0.7)]">
                  <span className="text-[#22c55e] font-semibold">
                    {e.checkedInCount}
                  </span>{" "}
                  checked in
                </span>
              </div>

              <div className="mt-3 flex gap-3 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setAttFor(e)}
                  className="text-[#C9A84C] hover:underline"
                >
                  Attendees
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(e)}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(e)}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
                {edit.id ? "Edit event" : "New event"}
              </h2>
              <button
                type="button"
                onClick={() => setEdit(null)}
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
                <label className={label}>Title *</label>
                <input
                  value={edit.form.title}
                  onChange={(ev) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, title: ev.target.value },
                    })
                  }
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea
                  value={edit.form.description}
                  onChange={(ev) =>
                    setEdit({
                      ...edit,
                      form: {
                        ...edit.form,
                        description: ev.target.value,
                      },
                    })
                  }
                  rows={3}
                  className={`${field} resize-y`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Starts</label>
                  <input
                    type="datetime-local"
                    value={edit.form.event_date}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          event_date: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Ends</label>
                  <input
                    type="datetime-local"
                    value={edit.form.event_end_date}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          event_end_date: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>City</label>
                  <input
                    value={edit.form.location_city}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          location_city: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Country</label>
                  <input
                    value={edit.form.location_country}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          location_country: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Category</label>
                  <input
                    value={edit.form.category}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          category: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Capacity</label>
                  <input
                    type="number"
                    value={edit.form.max_capacity}
                    onChange={(ev) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          max_capacity: ev.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label className={label}>Allowed tiers</label>
                <div className="flex flex-wrap gap-3">
                  {TIERS.map((t) => (
                    <label
                      key={t}
                      className="flex items-center gap-1.5 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={edit.form.allowed_tiers.includes(t)}
                        onChange={(ev) =>
                          setEdit({
                            ...edit,
                            form: {
                              ...edit.form,
                              allowed_tiers: ev.target.checked
                                ? [...edit.form.allowed_tiers, t]
                                : edit.form.allowed_tiers.filter(
                                    (x) => x !== t
                                  ),
                            },
                          })
                        }
                        className="accent-[#C9A84C]"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                {(
                  [
                    ["is_active", "Live"],
                    ["is_featured", "Featured"],
                    ["rsvp_enabled", "RSVP enabled"],
                  ] as const
                ).map(([k, lbl]) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={edit.form[k]}
                      onChange={(ev) =>
                        setEdit({
                          ...edit,
                          form: {
                            ...edit.form,
                            [k]: ev.target.checked,
                          },
                        })
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

      {attFor && (
        <AttendeesDrawer
          event={attFor}
          onClose={() => setAttFor(null)}
          onChanged={refetch}
        />
      )}
    </div>
  );
}

function AttendeesDrawer({
  event,
  onClose,
  onChanged,
}: {
  event: EventRow;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { data, loading, refetch } = useAdminResource<Attendee[]>(
    `/api/admin/events/attendees?id=${event.id}`,
    "attendees"
  );
  const attendees = data ?? [];

  async function act(action: string, regId: string, checked?: boolean) {
    await adminMutate("/api/admin/events/attendees", "POST", {
      action,
      regId,
      checked,
    });
    await refetch();
    await onChanged();
  }

  const confirmed = attendees.filter((a) => a.status === "REGISTERED");
  const waitlisted = attendees
    .filter((a) => a.status === "WAITLISTED")
    .sort(
      (a, b) =>
        (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0)
    );
  const cancelled = attendees.filter((a) => a.status === "CANCELLED");

  function Row({ a }: { a: Attendee }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-[#F5F5F0]">
            {a.name}
            {a.waitlist_position != null && (
              <span className="text-[rgba(245,245,240,0.45)]">
                {" "}
                #{a.waitlist_position}
              </span>
            )}
            {a.check_in_status === "CHECKED_IN" && (
              <span className="text-[#22c55e]"> ✓ in</span>
            )}
          </div>
          <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
            {a.email}
            {a.instagram ? ` · ${a.instagram}` : ""}
          </div>
        </div>
        <div className="whitespace-nowrap text-[11px] font-semibold">
          {a.status === "WAITLISTED" && (
            <button
              type="button"
              onClick={() => act("promote", a.id)}
              className="text-[#C9A84C] hover:underline mr-3"
            >
              Promote
            </button>
          )}
          {a.status === "REGISTERED" && (
            <button
              type="button"
              onClick={() =>
                act(
                  "checkin",
                  a.id,
                  a.check_in_status !== "CHECKED_IN"
                )
              }
              className="text-[rgba(245,245,240,0.7)] hover:text-[#22c55e] mr-3"
            >
              {a.check_in_status === "CHECKED_IN"
                ? "Undo check-in"
                : "Check in"}
            </button>
          )}
          {a.status !== "CANCELLED" && (
            <button
              type="button"
              onClick={() => act("cancel", a.id)}
              className="text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] max-w-[95vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto p-7">
        <button
          type="button"
          onClick={onClose}
          className="float-right text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
        >
          ✕
        </button>
        <div className="text-[18px] font-bold text-[#F5F5F0]">
          {event.title}
        </div>
        <div className="text-[12px] text-[rgba(245,245,240,0.45)] mt-1 mb-5">
          {confirmed.length} going · {waitlisted.length} waitlist ·{" "}
          {confirmed.filter((a) => a.check_in_status === "CHECKED_IN").length}{" "}
          checked in
        </div>

        {loading && attendees.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-[rgba(255,255,255,0.04)] animate-pulse"
              />
            ))}
          </div>
        ) : attendees.length === 0 ? (
          <div className="text-[13px] text-[rgba(245,245,240,0.45)] text-center py-10">
            No RSVPs yet.
          </div>
        ) : (
          <div className="space-y-5">
            <Section title={`Going (${confirmed.length})`}>
              {confirmed.map((a) => (
                <Row key={a.id} a={a} />
              ))}
            </Section>
            {waitlisted.length > 0 && (
              <Section title={`Waitlist (${waitlisted.length})`}>
                {waitlisted.map((a) => (
                  <Row key={a.id} a={a} />
                ))}
              </Section>
            )}
            {cancelled.length > 0 && (
              <Section title={`Cancelled (${cancelled.length})`}>
                {cancelled.map((a) => (
                  <Row key={a.id} a={a} />
                ))}
              </Section>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[10px] tracking-[2px] uppercase text-[#C9A84C] mb-2">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
