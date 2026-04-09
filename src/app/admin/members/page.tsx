"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Member, MemberTier, MemberStatus } from "@/types";

const TIER_CLASSES: Record<MemberTier, string> = {
  Core: "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]",
  VIP: "bg-[rgba(168,85,247,0.15)] text-[#a855f7]",
  Strategic: "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]",
};

const STATUS_CLASSES: Record<MemberStatus, string> = {
  Active: "bg-[rgba(34,197,94,0.15)] text-[#22c55e]",
  Expired: "bg-[rgba(234,179,8,0.15)] text-[#eab308]",
  Suspended: "bg-[rgba(239,68,68,0.15)] text-[#ef4444]",
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

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("joined_at", { ascending: false });

    setMembers((data ?? []) as Member[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const query = search.toLowerCase();
  const filtered = members.filter((m) => {
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      (m.car?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Members</h1>
          <p className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1">
            {members.length} members in the network
          </p>
        </div>
        <button className="bg-[#C9A84C] text-[#0A0A0A] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#E8D48B] transition-colors">
          + Add Member
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name, email, or car..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.25)] focus:border-[#C9A84C] outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Name
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Email
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Car
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Tier
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Status
              </th>
              <th className="text-left px-5 py-3 text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase font-semibold">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
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
                  {search
                    ? "No members match your search."
                    : "No members yet. Approve applications to add members."}
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <Link
                  key={member.id}
                  href={`/admin/members/${member.id}`}
                  className="contents"
                >
                  <tr className="cursor-pointer hover:bg-[rgba(201,168,76,0.03)]">
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] font-semibold text-[#F5F5F0]">
                      {member.name}
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                      {member.email}
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                      {member.car ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-[1px] ${TIER_CLASSES[member.tier]}`}
                      >
                        {member.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)]">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-[1px] ${STATUS_CLASSES[member.status]}`}
                      >
                        {member.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] border-b border-[rgba(255,255,255,0.03)] text-[rgba(245,245,240,0.45)]">
                      {new Date(member.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                </Link>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
