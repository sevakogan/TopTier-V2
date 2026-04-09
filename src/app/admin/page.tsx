"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Application, ApplicationStatus } from "@/types";

type TabKey = "new" | "pre-approved" | "rejected";

const TABS: { key: TabKey; label: string; status: ApplicationStatus }[] = [
  { key: "new", label: "New", status: "pending" },
  { key: "pre-approved", label: "Pre-Approved", status: "approved" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

type Stats = {
  pending: number;
  approvedThisWeek: number;
  rejected: number;
  total: number;
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <div className="text-[11px] tracking-[2px] text-[rgba(245,245,240,0.25)] uppercase mb-2">
        {label}
      </div>
      {loading ? (
        <div className="h-9 w-16 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold text-[#C9A84C]">{value}</div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  onPreApprove,
  onReject,
  updating,
}: {
  app: Application;
  onPreApprove: (id: string) => void;
  onReject: (id: string) => void;
  updating: string | null;
}) {
  const date = new Date(app.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/admin/applications/${app.id}`}
      className="block bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[#F5F5F0]">
            {app.name}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[rgba(245,245,240,0.45)]">
            <span>{app.email}</span>
            {app.car && <span>{app.car}</span>}
            {app.instagram && <span>@{app.instagram.replace("@", "")}</span>}
            {app.source && <span>{app.source}</span>}
          </div>
          <div className="text-[11px] text-[rgba(245,245,240,0.25)] mt-2">
            {date}
          </div>
        </div>
        {app.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPreApprove(app.id);
              }}
              disabled={updating === app.id}
              className="bg-[#22c55e] text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
              {updating === app.id ? "..." : "Pre-Approve"}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReject(app.id);
              }}
              disabled={updating === app.id}
              className="bg-transparent border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
        {app.status !== "pending" && (
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-[1px] ${
              app.status === "approved"
                ? "bg-[rgba(34,197,94,0.15)] text-[#22c55e]"
                : "bg-[rgba(239,68,68,0.15)] text-[#ef4444]"
            }`}
          >
            {app.status === "approved" ? "APPROVED" : "REJECTED"}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approvedThisWeek: 0,
    rejected: 0,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    const apps = (data ?? []) as Application[];
    setApplications(apps);

    const weekStart = getWeekStart();
    const pending = apps.filter((a) => a.status === "pending").length;
    const approvedThisWeek = apps.filter(
      (a) => a.status === "approved" && a.created_at >= weekStart
    ).length;
    const rejected = apps.filter((a) => a.status === "rejected").length;

    setStats({
      pending,
      approvedThisWeek,
      rejected,
      total: apps.length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handlePreApprove(id: string) {
    setUpdating(id);
    await supabase
      .from("applications")
      .update({ status: "approved" })
      .eq("id", id);

    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    );
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - 1,
      approvedThisWeek: prev.approvedThisWeek + 1,
    }));
    setUpdating(null);
  }

  async function handleReject(id: string) {
    setUpdating(id);
    await supabase
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", id);

    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
    );
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - 1,
      rejected: prev.rejected + 1,
    }));
    setUpdating(null);
  }

  const currentStatus = TABS.find((t) => t.key === activeTab)?.status ?? "pending";
  const filtered = applications.filter((a) => a.status === currentStatus);

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#F5F5F0]">Applications</h1>
        <p className="text-[13px] text-[rgba(245,245,240,0.45)] mt-1">
          Review and manage membership applications
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        <StatCard label="Pending" value={stats.pending} loading={loading} />
        <StatCard
          label="Approved this week"
          value={stats.approvedThisWeek}
          loading={loading}
        />
        <StatCard label="Rejected" value={stats.rejected} loading={loading} />
        <StatCard label="Total" value={stats.total} loading={loading} />
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

      {/* Application cards */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
          <p className="text-[rgba(245,245,240,0.45)] text-sm">
            No {currentStatus} applications found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onPreApprove={handlePreApprove}
              onReject={handleReject}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
