"use server";

import { db } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";
import { EVENT_COLORS } from "@/lib/types";
import { done, fail, guard, isDate, isTime, optionalText, pick, refresh, text, workspaceFromForm } from "./helpers";

const KINDS = ["aula", "trabalho", "estudo", "ginasio", "outro"] as const;

function readEvent(form: FormData) {
  const title = text(form, "title", 160);
  if (!title) return { error: "Indica um título para o bloco." as const };

  const start = text(form, "start_time");
  const end = text(form, "end_time");
  if (!isTime(start) || !isTime(end)) return { error: "Indica horas de início e fim válidas." as const };
  if (end <= start) return { error: "A hora de fim tem de ser depois da hora de início." as const };

  const repeats = form.get("repeats_weekly") !== null;
  const weekdayRaw = text(form, "weekday");
  const date = text(form, "date");

  if (repeats) {
    const weekday = Number(weekdayRaw);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return { error: "Escolhe o dia da semana." as const };
    }
    return { values: base(form, title, start, end, { repeats_weekly: true, weekday, date: null }) };
  }

  if (!isDate(date)) return { error: "Escolhe a data do compromisso." as const };
  return { values: base(form, title, start, end, { repeats_weekly: false, weekday: null, date }) };
}

function base(
  form: FormData,
  title: string,
  start: string,
  end: string,
  when: { repeats_weekly: boolean; weekday: number | null; date: string | null },
) {
  return {
    title,
    kind: pick(text(form, "kind"), KINDS, "outro"),
    start_time: start,
    end_time: end,
    color: pick(text(form, "color"), EVENT_COLORS, "rosa"),
    location: optionalText(form, "location", 160),
    notes: optionalText(form, "notes"),
    ...when,
  };
}

export async function createEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readEvent(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db().from("events").insert({ workspace_id: ws.id, ...parsed.values });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function updateEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const parsed = readEvent(form);
    if (parsed.error !== undefined) return fail(parsed.error);
    const { error } = await db()
      .from("events")
      .update(parsed.values)
      .eq("id", text(form, "id"))
      .eq("workspace_id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function deleteEvent(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("events").delete().eq("id", text(form, "id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}
