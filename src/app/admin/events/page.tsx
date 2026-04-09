"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Event, EventType } from "@/types";

type TabKey = "upcoming" | "past" | "drafts";

const TABS: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "drafts", label: "Drafts" },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  "Venue Activation": "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]",
  "Night Run": "bg-[rgba(168,85,247,0.15)] text-[#a855f7]",
  "Private Dinner": "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]",
  Collaboration: "bg-[rgba(34,197,94,0.15)] text-[#22c55e]",
  "Special Event": "bg-[rgba(234,179,8,0.15)] text-[#eab308]",
  "Inner Circle": "bg-[rgba(239,68,68,0.15)] text-[#ef4444]",
};

const EVENT_TYPES: EventType[] = [
  "Venue Activation",
  "Night Run",
  "Private Dinner",
  "Collaboration",
  "Special Event",
  "Inner Circle",
];

const INITIAL_FORM = {
  name: "",
  date: "",
  time: "",
  location: "",
  type: "Venue Activation" as EventType,
  capacity: "",
  description: "",
  visibility: "public" as "public" | "members_only",
};

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4 border-b border-[rgba(255,255,255,0.03)]">
          <div className="h-4 w-24 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false });

    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowModal(false);
    }
    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showModal]);

  const today = new Date().toISOString().split("T")[0];
  const pendingReviewCount = events.filter((e) => !e.is_public).length;

  const filtered = events.filter((e) => {
    const eventDate = e.date.split("T")[0];
    switch (activeTab) {
      case "upcoming":
        return eventDate >= today && e.is_public;
      case "past":
        return eventDate < today;
      case "drafts":
        return !e.is_public;
      default:
        return true;
    }
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name || !form.date || !form.location) return;
    setSubmitting(true);

    await supabase.from("events").insert({
      name: form.name,
      date: form.date,
      time: form.time || null,
      location: form.location,
      type: form.type,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      description: form.description || null,
      is_public: form.visibility === "public",
      visibility: form.visibility,
      rsvp_count: 0,
    });

    setForm(INITIAL_FORM);
    setShowModal(false);
    setSubmitting(false);
    setLoading(true);
    fetchEvents();
  }

  function getStatusLabel(event: Event): { label: string; className: string } {
    if (!event.is_public) {
      return {
        label: "DRAFT",
        className: "bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,240,0.45)]",
      };
    }
    const eventDate = event.date.split("T")[0];
    if (eventDate >= today) {
      return {
        label: "CONFIRMED",
        className: "bg-[rgba(34,197,94,0.15)] text-[#22c55e]",
      };
    }
    return {
      label: "COMPLETED",
      className: "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]",
    };
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Events</h1>
          <p className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1">
            Manage exclusive events and activations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#C9A84C] text-[#0A0A0A] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#E8D48B] transition-colors"
        >
          + Create Event
        </button>
      </div>

      {/* Approval banner */}
      {pendingReviewCount > 0 && (
        <div className="bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
          <span className="text-[#eab308] text-sm font-semibold">
            {pendingReviewCount} event{pendingReviewCount > 1 ? "s" : ""} pending
            review
          </span>
          <span className="text-[rgba(234,179,8,0.6)] text-[12px]">
            Draft events are not visible to members until published.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-1 inline-flex gap-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
              activeTab === tab.key
                ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]"
                : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Event
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Date
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Location
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Type
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                RSVP
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-[rgba(245,245,240,0.45)] text-sm"
                >
                  No events in this category.
                </td>
              </tr>
            ) : (
              filtered.map((event) => {
                const status = getStatusLabel(event);
                return (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="contents"
                  >
                    <tr className="cursor-pointer hover:bg-[rgba(201,168,76,0.03)]">
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] font-semibold text-[#F5F5F0]">
                        {event.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                        {event.location}
                      </td>
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-[1px] ${
                            EVENT_TYPE_COLORS[event.type] ??
                            "bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,240,0.45)]"
                          }`}
                        >
                          {event.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                        {event.rsvp_count}
                        {event.capacity ? ` / ${event.capacity}` : ""}
                      </td>
                      <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-[1px] ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  </Link>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 w-[480px] max-w-[90vw]">
            <h2 className="text-lg font-bold text-[#F5F5F0] mb-6">
              Create Event
            </h2>

            {/* Event Name */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Event Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="e.g. Midnight Run: Brickell"
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                  Time
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="e.g. Miami, FL"
              />
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="Leave blank for unlimited"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C] resize-none"
                placeholder="Event description..."
              />
            </div>

            {/* Visibility toggle */}
            <div className="mb-6">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("visibility", "public")}
                  className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                    form.visibility === "public"
                      ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]"
                      : "bg-[rgba(255,255,255,0.04)] text-[rgba(245,245,240,0.45)]"
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => updateField("visibility", "members_only")}
                  className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                    form.visibility === "members_only"
                      ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]"
                      : "bg-[rgba(255,255,255,0.04)] text-[rgba(245,245,240,0.45)]"
                  }`}
                >
                  Members Only
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-lg text-[12px] font-medium text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.name || !form.date || !form.location}
                className="bg-[#C9A84C] text-[#0A0A0A] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#E8D48B] transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
