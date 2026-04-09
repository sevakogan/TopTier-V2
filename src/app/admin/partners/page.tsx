"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Perk, PerkCategory } from "@/types";

type TabKey = "all" | "automotive" | "dining" | "lifestyle";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Partners" },
  { key: "automotive", label: "Automotive" },
  { key: "dining", label: "Dining" },
  { key: "lifestyle", label: "Lifestyle" },
];

const CATEGORIES: PerkCategory[] = ["automotive", "dining", "lifestyle"];

const CATEGORY_COLORS: Record<PerkCategory, string> = {
  automotive: "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]",
  dining: "bg-[rgba(168,85,247,0.15)] text-[#a855f7]",
  lifestyle: "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]",
};

const INITIAL_FORM = {
  business_name: "",
  category: "automotive" as PerkCategory,
  discount: "",
  description: "",
  discount_code: "",
  website_url: "",
};

function SkeletonRow() {
  return (
    <tr>
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-5 py-4 border-b border-[rgba(255,255,255,0.03)]">
          <div className="h-4 w-24 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function ActiveToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
        active ? "bg-[rgba(34,197,94,0.4)]" : "bg-[rgba(255,255,255,0.1)]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AdminPartnersPage() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchPerks = useCallback(async () => {
    const { data } = await supabase
      .from("perks")
      .select("*")
      .order("sort_order");

    setPerks((data ?? []) as Perk[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPerks();
  }, [fetchPerks]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowModal(false);
    }
    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showModal]);

  const filtered =
    activeTab === "all"
      ? perks
      : perks.filter((p) => p.category === activeTab);

  async function handleToggleActive(id: string, currentActive: boolean) {
    const newActive = !currentActive;
    setPerks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: newActive } : p))
    );
    await supabase.from("perks").update({ is_active: newActive }).eq("id", id);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.business_name || !form.discount) return;
    setSubmitting(true);

    const maxSort = perks.reduce(
      (max, p) => Math.max(max, p.sort_order),
      0
    );

    await supabase.from("perks").insert({
      business_name: form.business_name,
      category: form.category,
      discount: form.discount,
      description: form.description || null,
      discount_code: form.discount_code || null,
      website_url: form.website_url || null,
      is_active: true,
      sort_order: maxSort + 1,
    });

    setForm(INITIAL_FORM);
    setShowModal(false);
    setSubmitting(false);
    setLoading(true);
    fetchPerks();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Partners</h1>
          <p className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1">
            Manage exclusive perks and partner discounts
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#C9A84C] text-[#0A0A0A] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#E8D48B] transition-colors"
        >
          + Add Partner
        </button>
      </div>

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
                Partner
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Category
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Discount
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Active
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
                  colSpan={4}
                  className="px-5 py-12 text-center text-[rgba(245,245,240,0.45)] text-sm"
                >
                  No partners in this category.
                </td>
              </tr>
            ) : (
              filtered.map((perk) => (
                <Link
                  key={perk.id}
                  href={`/admin/partners/${perk.id}`}
                  className="contents"
                >
                  <tr className="cursor-pointer hover:bg-[rgba(201,168,76,0.03)]">
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] font-semibold text-[#F5F5F0]">
                      {perk.business_name}
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-[1px] ${CATEGORY_COLORS[perk.category]}`}
                      >
                        {perk.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                      {perk.discount}
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                      <ActiveToggle
                        active={perk.is_active}
                        onToggle={() =>
                          handleToggleActive(perk.id, perk.is_active)
                        }
                      />
                    </td>
                  </tr>
                </Link>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Partner Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 w-[480px] max-w-[90vw]">
            <h2 className="text-lg font-bold text-[#F5F5F0] mb-6">
              Add Partner
            </h2>

            {/* Business Name */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Business Name
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="e.g. Miami Auto Detailing"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Discount
              </label>
              <input
                type="text"
                value={form.discount}
                onChange={(e) => updateField("discount", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="e.g. 25% OFF"
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
                placeholder="Partner description..."
              />
            </div>

            {/* Discount Code */}
            <div className="mb-4">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Discount Code
              </label>
              <input
                type="text"
                value={form.discount_code}
                onChange={(e) => updateField("discount_code", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="e.g. TTMC25"
              />
            </div>

            {/* Website URL */}
            <div className="mb-6">
              <label className="text-[11px] tracking-[2px] text-[#C9A84C] uppercase mb-1.5 block">
                Website URL
              </label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[#C9A84C]"
                placeholder="https://example.com"
              />
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
                disabled={submitting || !form.business_name || !form.discount}
                className="bg-[#C9A84C] text-[#0A0A0A] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#E8D48B] transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
