"use server";

import { db } from "@/lib/supabase";
import { todayISO } from "@/lib/dates";
import type { ActionState } from "@/lib/types";
import { TASK_CATEGORIES } from "@/lib/types";
import { done, fail, guard, isDate, isTime, optionalText, pick, refresh, text, workspaceFromForm } from "./helpers";

const RECURRENCES = ["none", "daily", "weekly", "monthly", "weekdays"] as const;
const PRIORITIES = ["baixa", "media", "alta"] as const;

function readTask(form: FormData) {
  const title = text(form, "title", 160);
  if (!title) return { error: "Indica um título para a tarefa." as const };

  const dueDate = text(form, "due_date");
  if (dueDate && !isDate(dueDate)) return { error: "Data inválida." as const };

  const dueTime = text(form, "due_time");
  if (dueTime && !isTime(dueTime)) return { error: "Hora inválida." as const };

  const recurrence = pick(text(form, "recurrence"), RECURRENCES, "none");
  const days = form
    .getAll("recurrence_days")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

  if (recurrence === "weekdays" && days.length === 0) {
    return { error: "Escolhe pelo menos um dia da semana." as const };
  }
  if (recurrence !== "none" && recurrence !== "daily" && !dueDate) {
    return { error: "As tarefas repetidas precisam de uma data de início." as const };
  }

  return {
    values: {
      title,
      description: optionalText(form, "description"),
      due_date: dueDate || null,
      due_time: dueTime || null,
      priority: pick(text(form, "priority"), PRIORITIES, "media"),
      category: pick(text(form, "category"), TASK_CATEGORIES, "pessoal"),
      recurrence,
      recurrence_days: recurrence === "weekdays" ? days : [],
      show_in_calendar: form.get("show_in_calendar") !== null,
    },
  };
}

export async function createTask(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readTask(form);
    if (parsed.error !== undefined) return fail(parsed.error);

    const { error } = await db().from("tasks").insert({ workspace_id: ws.id, ...parsed.values });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function updateTask(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const id = text(form, "id");
    const parsed = readTask(form);
    if (parsed.error !== undefined) return fail(parsed.error);

    const { error } = await db().from("tasks").update(parsed.values).eq("id", id).eq("workspace_id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function toggleTask(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const id = text(form, "id");
  const date = text(form, "date") || todayISO();

  const { data } = await db()
    .from("tasks")
    .select("completed_dates")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!data) return;

  const current: string[] = data.completed_dates ?? [];
  const next = current.includes(date) ? current.filter((d) => d !== date) : [...current, date];

  await db().from("tasks").update({ completed_dates: next }).eq("id", id).eq("workspace_id", ws.id);
  refresh(ws.slug);
}

export async function deleteTask(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("tasks").delete().eq("id", text(form, "id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}
