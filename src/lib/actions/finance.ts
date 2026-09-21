"use server";

import { db } from "@/lib/supabase";
import { parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import type { ActionState } from "@/lib/types";
import { FINANCE_CATEGORIES } from "@/lib/types";
import { done, fail, guard, isDate, optionalText, pick, refresh, text, workspaceFromForm } from "./helpers";

const MONEY_RECURRENCES = ["none", "weekly", "monthly", "yearly"] as const;

/* ------------------------------------------------------------- movimentos */

function readTransaction(form: FormData) {
  const amount = parseAmount(form.get("amount"));
  if (amount === null || amount <= 0) return { error: "Indica um valor maior do que 0 €." as const };
  if (amount > 1_000_000) return { error: "Valor demasiado elevado." as const };

  const date = text(form, "date");
  if (!isDate(date)) return { error: "Indica uma data válida." as const };

  return {
    values: {
      amount,
      type: pick(text(form, "type"), ["income", "expense"] as const, "expense"),
      category: pick(text(form, "category"), FINANCE_CATEGORIES, "outros"),
      date,
      description: optionalText(form, "description", 200),
      recurrence: pick(text(form, "recurrence"), MONEY_RECURRENCES, "none"),
    },
  };
}

export async function createTransaction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readTransaction(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db().from("transactions").insert({ workspace_id: ws.id, ...parsed.values });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function updateTransaction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readTransaction(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db()
      .from("transactions")
      .update(parsed.values)
      .eq("id", text(form, "id"))
      .eq("workspace_id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function deleteTransaction(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("transactions").delete().eq("id", text(form, "id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}

/* -------------------------------------------------------------- orçamentos */

export async function saveBudget(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const category = pick(text(form, "category"), FINANCE_CATEGORIES, "outros");
    const amount = parseAmount(form.get("amount"));
    if (amount === null || amount < 0) return fail("Indica um valor válido para o orçamento.");

    if (amount === 0) {
      await db().from("budgets").delete().eq("workspace_id", ws.id).eq("category", category);
    } else {
      const { error } = await db()
        .from("budgets")
        .upsert({ workspace_id: ws.id, category, amount }, { onConflict: "workspace_id,category" });
      if (error) return fail(error.message);
    }
    refresh(ws.slug);
    return done();
  });
}

/* ------------------------------------------------------------ contas a pagar */

function readBill(form: FormData) {
  const name = text(form, "name", 120);
  if (!name) return { error: "Indica o nome da conta." as const };

  const amount = parseAmount(form.get("amount"));
  if (amount === null || amount < 0) return { error: "Indica um valor válido." as const };

  const due = text(form, "due_date");
  if (!isDate(due)) return { error: "Indica a data de vencimento." as const };

  return {
    values: {
      name,
      amount,
      due_date: due,
      recurrence: pick(text(form, "recurrence"), MONEY_RECURRENCES, "monthly"),
    },
  };
}

export async function createBill(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readBill(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db().from("bills").insert({ workspace_id: ws.id, ...parsed.values });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function updateBill(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readBill(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db()
      .from("bills")
      .update(parsed.values)
      .eq("id", text(form, "id"))
      .eq("workspace_id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

/** Marca (ou desmarca) um vencimento como pago. */
export async function toggleBillPaid(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const id = text(form, "id");
  const due = text(form, "due") || todayISO();

  const { data } = await db()
    .from("bills")
    .select("paid_dates")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!data) return;

  const current: string[] = data.paid_dates ?? [];
  const next = current.includes(due) ? current.filter((d) => d !== due) : [...current, due];
  await db().from("bills").update({ paid_dates: next }).eq("id", id).eq("workspace_id", ws.id);
  refresh(ws.slug);
}

export async function deleteBill(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("bills").delete().eq("id", text(form, "id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}
