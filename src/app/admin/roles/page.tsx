"use client";

import { useState } from "react";
import type { UserRoles } from "@/lib/backend/roles-admin";
import { ASSIGNABLE_ROLES } from "@/lib/backend/roles-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

const ROLE_COLOR: Record<string, string> = {
  founder: "#C9A84C",
  admin: "#22c55e",
  moderator: "#3b82f6",
  staff: "#a855f7",
};

export default function RolesPage() {
  const { data, loading, error, refetch } = useAdminResource<
    UserRoles[]
  >("/api/admin/roles", "users");
  const users = data ?? [];

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const visible = users.filter((u) => {
    const s = `${u.name} ${u.email}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  async function grant(u: UserRoles, role: string) {
    if (!role) return;
    setBusy(u.userId);
    setBanner(null);
    const r = await adminMutate("/api/admin/roles", "POST", {
      userId: u.userId,
      role,
    });
    setBusy(null);
    if (!r.ok) setBanner(r.error ?? "Could not grant role.");
    await refetch();
  }

  async function revoke(u: UserRoles, role: string) {
    setBusy(u.userId);
    setBanner(null);
    const r = await adminMutate("/api/admin/roles", "DELETE", {
      userId: u.userId,
      role,
    });
    setBusy(null);
    if (!r.ok) setBanner(r.error ?? "Could not revoke role.");
    await refetch();
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Team &amp; Roles
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Grant or revoke roles. Anyone with <b>admin</b> or <b>founder</b>{" "}
        can sign into this panel — that&apos;s how you add another admin.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email…"
        className="w-full max-w-sm mb-5 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]"
      />

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No users match.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["User", "Roles", "Add role"].map((h) => (
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
              {visible.map((u) => (
                <tr
                  key={u.userId}
                  className="hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px]">
                    <div className="font-semibold text-[#F5F5F0]">
                      {u.name || "—"}
                    </div>
                    <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 && (
                        <span className="text-[12px] text-[rgba(245,245,240,0.25)]">
                          none
                        </span>
                      )}
                      {u.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[10px] font-semibold"
                          style={{
                            color: ROLE_COLOR[role] ?? "#9aa0a6",
                          }}
                        >
                          {role}
                          {role !== "founder" && (
                            <button
                              type="button"
                              disabled={busy === u.userId}
                              onClick={() => revoke(u, role)}
                              className="text-[rgba(245,245,240,0.45)] hover:text-[#ef4444] disabled:opacity-40"
                              aria-label={`Revoke ${role}`}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <select
                      value=""
                      disabled={busy === u.userId}
                      onChange={(e) => grant(u, e.target.value)}
                      className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-2.5 py-1.5 text-[12px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)] disabled:opacity-40"
                    >
                      <option value="">+ add…</option>
                      {ASSIGNABLE_ROLES.filter(
                        (r) => !u.roles.includes(r)
                      ).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
