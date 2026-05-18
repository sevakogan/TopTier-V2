// SERVER-ONLY. Intake questions = the application form that feeds the
// Leads pipeline. Full CRUD + reorder + toggle. Service-role.

import { createServiceClient } from "@/lib/supabase-server";

export const QUESTION_TYPES = [
  "text",
  "textarea",
  "select",
  "number",
  "date",
  "checkbox",
] as const;

export interface IntakeQuestion {
  id: string;
  question_key: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  placeholder: string | null;
  help_text: string | null;
}

export async function listIntake(): Promise<IntakeQuestion[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("intake_questions")
    .select("*")
    .order("display_order", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    question_key: r.question_key as string,
    question_text: r.question_text as string,
    question_type: (r.question_type as string) ?? "text",
    options: Array.isArray(r.options)
      ? (r.options as string[])
      : null,
    is_required: Boolean(r.is_required),
    is_active: Boolean(r.is_active),
    display_order: (r.display_order as number) ?? 0,
    placeholder: (r.placeholder as string | null) ?? null,
    help_text: (r.help_text as string | null) ?? null,
  }));
}

export interface IntakeInput {
  question_key?: string;
  question_text?: string;
  question_type?: string;
  options?: string[] | null;
  is_required?: boolean;
  is_active?: boolean;
  placeholder?: string | null;
  help_text?: string | null;
  display_order?: number;
}

function row(input: IntakeInput): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (input.question_key !== undefined)
    r.question_key = input.question_key.trim();
  if (input.question_text !== undefined)
    r.question_text = input.question_text.trim();
  if (input.question_type !== undefined)
    r.question_type = input.question_type;
  if (input.options !== undefined)
    r.options =
      input.options && input.options.length > 0 ? input.options : null;
  if (input.is_required !== undefined)
    r.is_required = Boolean(input.is_required);
  if (input.is_active !== undefined)
    r.is_active = Boolean(input.is_active);
  if (input.placeholder !== undefined)
    r.placeholder = input.placeholder || null;
  if (input.help_text !== undefined)
    r.help_text = input.help_text || null;
  if (input.display_order !== undefined)
    r.display_order = Math.max(0, Math.floor(input.display_order));
  return r;
}

export async function createIntake(
  input: IntakeInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.question_key?.trim() || !input.question_text?.trim())
    return { ok: false, message: "Key and question text are required." };
  const db = createServiceClient();
  const { data: top } = await db
    .from("intake_questions")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("intake_questions").insert({
    ...row(input),
    question_key: input.question_key.trim(),
    question_text: input.question_text.trim(),
    question_type: input.question_type || "text",
    is_required: input.is_required ?? false,
    is_active: input.is_active ?? true,
    display_order:
      ((top?.display_order as number | undefined) ?? 0) + 1,
  });
  return error
    ? {
        ok: false,
        message: error.message.includes("duplicate")
          ? "That question key already exists."
          : error.message,
      }
    : { ok: true };
}

export async function updateIntake(
  id: string,
  input: IntakeInput
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("intake_questions")
    .update(row(input))
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteIntake(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("intake_questions")
    .delete()
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Swap display_order with the neighbour in the given direction. */
export async function reorderIntake(
  id: string,
  dir: "up" | "down"
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: all } = await db
    .from("intake_questions")
    .select("id, display_order")
    .order("display_order", { ascending: true });
  const list = all ?? [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, message: "Not found." };
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return { ok: true }; // edge
  const a = list[idx];
  const b = list[swap];
  await db
    .from("intake_questions")
    .update({ display_order: b.display_order as number })
    .eq("id", a.id as string);
  await db
    .from("intake_questions")
    .update({ display_order: a.display_order as number })
    .eq("id", b.id as string);
  return { ok: true };
}
