"use client";

import { useState } from "react";
import type { IntakeQuestion } from "@/lib/backend/intake-admin";
import { QUESTION_TYPES } from "@/lib/backend/intake-admin";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

const EMPTY = {
  question_key: "",
  question_text: "",
  question_type: "text",
  options: "",
  placeholder: "",
  help_text: "",
  is_required: false,
  is_active: true,
};

const field =
  "w-full rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#171717] px-3 py-2.5 text-[13px] text-[#F5F5F0] outline-none focus:border-[rgba(201,168,76,0.35)]";
const label =
  "block text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-1.5";

export default function IntakePage() {
  const { data, loading, error, refetch } = useAdminResource<
    IntakeQuestion[]
  >("/api/admin/intake", "questions");
  const questions = data ?? [];

  const [edit, setEdit] = useState<{
    id: string | null;
    form: typeof EMPTY;
  } | null>(null);
  const [confirmDel, setConfirmDel] = useState<IntakeQuestion | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function openNew() {
    setBanner(null);
    setEdit({ id: null, form: { ...EMPTY } });
  }
  function openEdit(q: IntakeQuestion) {
    setBanner(null);
    setEdit({
      id: q.id,
      form: {
        question_key: q.question_key,
        question_text: q.question_text,
        question_type: q.question_type,
        options: (q.options ?? []).join("\n"),
        placeholder: q.placeholder ?? "",
        help_text: q.help_text ?? "",
        is_required: q.is_required,
        is_active: q.is_active,
      },
    });
  }

  async function save() {
    if (!edit) return;
    setBusy(true);
    setBanner(null);
    const f = edit.form;
    const payload = {
      question_key: f.question_key,
      question_text: f.question_text,
      question_type: f.question_type,
      options: f.options
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      placeholder: f.placeholder,
      help_text: f.help_text,
      is_required: f.is_required,
      is_active: f.is_active,
    };
    const r = edit.id
      ? await adminMutate("/api/admin/intake", "PATCH", {
          id: edit.id,
          ...payload,
        })
      : await adminMutate("/api/admin/intake", "POST", payload);
    setBusy(false);
    if (r.ok) {
      setEdit(null);
      await refetch();
    } else setBanner(r.error ?? "Could not save.");
  }

  async function toggle(q: IntakeQuestion) {
    await adminMutate("/api/admin/intake", "PATCH", {
      id: q.id,
      is_active: !q.is_active,
    });
    await refetch();
  }
  async function reorder(q: IntakeQuestion, dir: "up" | "down") {
    await adminMutate("/api/admin/intake", "PATCH", {
      id: q.id,
      action: "reorder",
      dir,
    });
    await refetch();
  }
  async function doDelete() {
    if (!confirmDel) return;
    setBusy(true);
    const r = await adminMutate("/api/admin/intake", "DELETE", {
      id: confirmDel.id,
    });
    setBusy(false);
    setConfirmDel(null);
    if (!r.ok) setBanner(r.error ?? "Could not delete.");
    await refetch();
  }

  const needsOptions =
    edit?.form.question_type === "select" ||
    edit?.form.question_type === "checkbox";

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0]">
          Intake Questions
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[12px] font-semibold text-[#0A0A0A] hover:bg-[#d8b965]"
        >
          + New Question
        </button>
      </div>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        The application form that feeds the Leads pipeline. Edit wording,
        reorder, toggle, or add questions.
      </p>

      {(banner || error) && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {banner || error}
        </div>
      )}

      {loading && questions.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No questions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111] px-4 py-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => reorder(q, "up")}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === questions.length - 1}
                  onClick={() => reorder(q, "down")}
                  className="text-[rgba(245,245,240,0.45)] hover:text-[#C9A84C] disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#F5F5F0]">
                  {q.question_text}
                </div>
                <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                  {q.question_key} · {q.question_type}
                  {q.is_required ? " · required" : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(q)}
                className="text-[11px] font-semibold mr-1"
                style={{
                  color: q.is_active ? "#22c55e" : "#9aa0a6",
                }}
              >
                {q.is_active ? "Active" : "Hidden"}
              </button>
              <button
                type="button"
                onClick={() => openEdit(q)}
                className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(q)}
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
          <div className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[94vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#F5F5F0]">
                {edit.id ? "Edit question" : "New question"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Key</label>
                  <input
                    value={edit.form.question_key}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          question_key: e.target.value,
                        },
                      })
                    }
                    placeholder="snake_case_key"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Type</label>
                  <select
                    value={edit.form.question_type}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          question_type: e.target.value,
                        },
                      })
                    }
                    className={field}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>Question text</label>
                <textarea
                  value={edit.form.question_text}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      form: {
                        ...edit.form,
                        question_text: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  className={`${field} resize-y`}
                />
              </div>
              {needsOptions && (
                <div>
                  <label className={label}>
                    Options — one per line
                  </label>
                  <textarea
                    value={edit.form.options}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          options: e.target.value,
                        },
                      })
                    }
                    rows={4}
                    className={`${field} resize-y`}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Placeholder</label>
                  <input
                    value={edit.form.placeholder}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          placeholder: e.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Help text</label>
                  <input
                    value={edit.form.help_text}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        form: {
                          ...edit.form,
                          help_text: e.target.value,
                        },
                      })
                    }
                    className={field}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                {(
                  [
                    ["is_required", "Required"],
                    ["is_active", "Active"],
                  ] as const
                ).map(([k, lbl]) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-[12px] text-[rgba(245,245,240,0.7)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={edit.form[k]}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          form: {
                            ...edit.form,
                            [k]: e.target.checked,
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

      {confirmDel && (
        <>
          <div
            onClick={() => setConfirmDel(null)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[#0d0d0d] p-7 shadow-2xl">
            <h2 className="text-[17px] font-bold text-[#F5F5F0] mb-2">
              Delete this question?
            </h2>
            <p className="text-[12px] text-[#ef8c8c] mb-5">
              “{confirmDel.question_text}” — removed from the application
              form. This cannot be undone.
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
