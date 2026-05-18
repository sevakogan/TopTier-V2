"use client";

import { useState } from "react";
import type { NavItem } from "@/lib/backend/navigation-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

const EMPTY = {
  label: "",
  route: "",
  icon_name: "circle",
  is_active: true,
};
const field =
  "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
const label =
  "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

export default function NavigationPage() {
  const { data, loading, error, refetch } = useAdminResource<NavItem[]>(
    "/api/admin/navigation",
    "items"
  );
  const items = data ?? [];

  const [edit, setEdit] = useState<{
    id: string | null;
    form: typeof EMPTY;
  } | null>(null);
  const [confirmDel, setConfirmDel] = useState<NavItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function openNew() {
    setBanner(null);
    setEdit({ id: null, form: { ...EMPTY } });
  }
  function openEdit(n: NavItem) {
    setBanner(null);
    setEdit({
      id: n.id,
      form: {
        label: n.label,
        route: n.route,
        icon_name: n.icon_name,
        is_active: n.is_active,
      },
    });
  }
  async function save() {
    if (!edit) return;
    setBusy(true);
    setBanner(null);
    const r = edit.id
      ? await adminMutate("/api/admin/navigation", "PATCH", {
          id: edit.id,
          ...edit.form,
        })
      : await adminMutate("/api/admin/navigation", "POST", edit.form);
    setBusy(false);
    if (r.ok) {
      setEdit(null);
      await refetch();
    } else setBanner(r.error ?? "Could not save.");
  }
  async function toggle(n: NavItem) {
    await adminMutate("/api/admin/navigation", "PATCH", {
      id: n.id,
      is_active: !n.is_active,
    });
    await refetch();
  }
  async function reorder(n: NavItem, dir: "up" | "down") {
    await adminMutate("/api/admin/navigation", "PATCH", {
      id: n.id,
      action: "reorder",
      dir,
    });
    await refetch();
  }
  async function doDelete() {
    if (!confirmDel) return;
    setBusy(true);
    const r = await adminMutate("/api/admin/navigation", "DELETE", {
      id: confirmDel.id,
    });
    setBusy(false);
    setConfirmDel(null);
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Navigation
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965]"
        >
          + New Item
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        The site&apos;s navigation menu — reorder, toggle, edit, or add
        links.
      </p>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No navigation items yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111] px-4 py-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => reorder(n, "up")}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1}
                  onClick={() => reorder(n, "down")}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#F5F5F0]">
                  {n.label}
                </div>
                <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                  {n.route} · {n.icon_name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(n)}
                className="text-[11px] font-semibold mr-1"
                style={{ color: n.is_active ? "#22c55e" : "#9aa0a6" }}
              >
                {n.is_active ? "Visible" : "Hidden"}
              </button>
              <button
                type="button"
                onClick={() => openEdit(n)}
                className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(n)}
                className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
              >
                Delete
              </button>
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
          <div className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#F5F5F0]">
                {edit.id ? "Edit item" : "New item"}
              </h2>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="text-[20px] text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={label}>Label</label>
                <input
                  value={edit.form.label}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, label: e.target.value },
                    })
                  }
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Route</label>
                <input
                  value={edit.form.route}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: { ...edit.form, route: e.target.value },
                    })
                  }
                  placeholder="/path"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Icon name</label>
                <input
                  value={edit.form.icon_name}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: {
                        ...edit.form,
                        icon_name: e.target.value,
                      },
                    })
                  }
                  className={field}
                />
              </div>
              <label className="flex items-center gap-2 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={edit.form.is_active}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: {
                        ...edit.form,
                        is_active: e.target.checked,
                      },
                    })
                  }
                  className="accent-[#C9A84C]"
                />
                Visible
              </label>
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

      {confirmDel && (
        <>
          <div
            onClick={() => setConfirmDel(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[#0d0d0d] p-7 shadow-2xl">
            <h2 className="text-[17px] font-bold text-[#F5F5F0] mb-2">
              Delete “{confirmDel.label}”?
            </h2>
            <p className="text-[12px] text-[#ef8c8c] mb-5">
              Removed from the site navigation. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-[12px] font-semibold text-[rgba(245,245,240,0.7)] hover:text-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={busy}
                className="rounded-lg bg-[#ef4444] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#dc2626] disabled:opacity-40"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
