"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { randomToken } from "@/lib/id";
import { addDays, startOfMonth, todayISO } from "@/lib/dates";
import { DEFAULT_CARDS, type ActionState, type CardId, type CardPref, type Settings } from "@/lib/types";
import { done, fail, guard, pick, refresh, text, workspaceFromForm } from "./helpers";
import { resolveSettings } from "@/lib/data";

const THEMES = ["rosa", "lilas", "azul", "neutro", "escuro"] as const;

/* -------------------------------------------------------- criar workspace */

export async function createWorkspace(_prev: ActionState, form: FormData): Promise<ActionState> {
  const slug = randomToken(22);
  const name = text(form, "name", 60) || "A minha vida";

  const result = await guard(async () => {
    const { error } = await db().from("workspaces").insert({ slug, name });
    if (error) return fail(error.message);
    return done();
  });
  if (!result.ok) return result;

  redirect(`/w/${slug}`);
}

export async function renameWorkspace(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const name = text(form, "name", 60);
    if (!name) return fail("Escreve um nome.");
    const { error } = await db().from("workspaces").update({ name }).eq("id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

/* --------------------------------------------------------------- preferências */

async function saveSettings(slug: string, id: string, settings: Settings) {
  await db().from("workspaces").update({ settings }).eq("id", id);
  refresh(slug);
}

export async function setAppearance(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const current = resolveSettings(ws.settings);
  const theme = pick(text(form, "theme"), THEMES, current.theme);
  const modeRaw = text(form, "mode");
  const mode = modeRaw === "dark" || modeRaw === "light" ? modeRaw : theme === "escuro" ? "dark" : current.mode;
  await saveSettings(ws.slug, ws.id, { ...current, theme, mode: theme === "escuro" ? "dark" : mode });
}

export async function setWeekStart(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const current = resolveSettings(ws.settings);
  const weekStart = text(form, "week_start") === "0" ? 0 : 1;
  await saveSettings(ws.slug, ws.id, { ...current, weekStart });
}

export async function toggleCard(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const current = resolveSettings(ws.settings);
  const id = text(form, "card") as CardId;
  const cards = current.cards.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
  await saveSettings(ws.slug, ws.id, { ...current, cards });
}

export async function moveCard(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const current = resolveSettings(ws.settings);
  const id = text(form, "card") as CardId;
  const dir = text(form, "direction") === "up" ? -1 : 1;

  const cards: CardPref[] = [...current.cards];
  const index = cards.findIndex((c) => c.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= cards.length) return;
  [cards[index], cards[target]] = [cards[target], cards[index]];
  await saveSettings(ws.slug, ws.id, { ...current, cards });
}

export async function resetCards(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const current = resolveSettings(ws.settings);
  await saveSettings(ws.slug, ws.id, { ...current, cards: DEFAULT_CARDS });
}

/* ------------------------------------------------------- dados de exemplo */

export async function seedDemo(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const client = db();
  const today = todayISO();
  const month = startOfMonth(today).slice(0, 7);
  const demo = { workspace_id: ws.id, is_demo: true };

  /**
   * Numa inserção em lote, o supabase-js envia a união das chaves de todos os
   * objetos e o PostgREST grava NULL onde a chave falta — não o valor por
   * omissão da coluna. Por isso cada linha é construída a partir de um molde
   * com todos os campos preenchidos.
   */
  async function insertAll(table: string, rows: Record<string, unknown>[]) {
    const { error } = await client.from(table).insert(rows);
    if (error) throw new Error(`Não foi possível criar os dados de exemplo (${table}): ${error.message}`);
  }

  const task = (t: Record<string, unknown>) => ({
    ...demo,
    description: null,
    due_date: null,
    due_time: null,
    priority: "media",
    category: "pessoal",
    recurrence: "none",
    recurrence_days: [],
    show_in_calendar: true,
    ...t,
  });

  const event = (e: Record<string, unknown>) => ({
    ...demo,
    kind: "outro",
    weekday: null,
    date: null,
    repeats_weekly: true,
    color: "rosa",
    location: null,
    notes: null,
    ...e,
  });

  const movement = (m: Record<string, unknown>) => ({
    ...demo,
    type: "expense",
    category: "outros",
    description: null,
    recurrence: "none",
    ...m,
  });

  const bill = (b: Record<string, unknown>) => ({ ...demo, recurrence: "monthly", paid_dates: [], ...b });

  await insertAll("tasks", [
    task({ title: "Beber 1,5 L de água", recurrence: "daily", priority: "baixa", category: "saúde", due_date: today }),
    task({ title: "Entregar relatório de Estatística", due_date: addDays(today, 2), due_time: "17:00", priority: "alta", category: "estudos" }),
    task({ title: "Aspirar a sala", due_date: today, due_time: "19:30", category: "casa" }),
    task({ title: "Marcar consulta de rotina", due_date: addDays(today, 5), category: "saúde" }),
    task({ title: "Rever apontamentos", recurrence: "weekdays", recurrence_days: [1, 3], due_date: today, due_time: "21:00", category: "estudos" }),
  ]);

  await insertAll("events", [
    event({ title: "Álgebra Linear", kind: "aula", weekday: 1, start_time: "09:00", end_time: "10:30", color: "rosa", location: "Sala B2.1" }),
    event({ title: "Programação", kind: "aula", weekday: 2, start_time: "11:00", end_time: "13:00", color: "azul", location: "Lab 3" }),
    event({ title: "Ginásio", kind: "ginasio", weekday: 3, start_time: "18:30", end_time: "19:30", color: "verde" }),
    event({ title: "Estudo acompanhado", kind: "estudo", weekday: 4, start_time: "15:00", end_time: "17:00", color: "lilas" }),
    event({ title: "Turno na loja", kind: "trabalho", weekday: 6, start_time: "10:00", end_time: "16:00", color: "ambar", location: "Centro comercial" }),
  ]);

  await insertAll("transactions", [
    movement({ amount: 850, type: "income", date: `${month}-01`, description: "Bolsa/ordenado", recurrence: "monthly" }),
    movement({ amount: 62.4, category: "alimentação", date: `${month}-04`, description: "Compras da semana" }),
    movement({ amount: 30, category: "transporte", date: `${month}-05`, description: "Passe mensal", recurrence: "monthly" }),
    movement({ amount: 12.99, category: "subscrições", date: `${month}-07`, description: "Streaming", recurrence: "monthly" }),
    movement({ amount: 24, category: "lazer", date: `${month}-12`, description: "Cinema com amigos" }),
    movement({ amount: 45.5, category: "estudos", date: `${month}-15`, description: "Manual de apoio" }),
  ]);

  await insertAll("budgets", [
    { ...demo, category: "alimentação", amount: 200 },
    { ...demo, category: "transporte", amount: 60 },
    { ...demo, category: "lazer", amount: 80 },
  ]);

  await insertAll("bills", [
    bill({ name: "Renda", amount: 420, due_date: `${month}-08` }),
    bill({ name: "Eletricidade", amount: 38.7, due_date: addDays(today, 3) }),
    bill({ name: "Internet", amount: 29.9, due_date: addDays(today, 11) }),
  ]);

  const { data: list, error: listError } = await client
    .from("shopping_lists")
    .insert({ ...demo, name: "Supermercado" })
    .select("id")
    .single();
  if (listError) throw new Error(`Não foi possível criar a lista de exemplo: ${listError.message}`);

  if (list) {
    const item = (i: Record<string, unknown>) => ({
      list_id: list.id,
      is_demo: true,
      quantity: null,
      category: "outros",
      notes: null,
      bought: false,
      ...i,
    });

    await insertAll("shopping_items", [
      item({ name: "Bananas", quantity: "1 kg", category: "fruta e legumes", position: 1 }),
      item({ name: "Leite", quantity: "6 un", category: "frescos", position: 2 }),
      item({ name: "Massa integral", category: "mercearia", position: 3 }),
      item({ name: "Detergente da loiça", category: "limpeza", position: 4 }),
      item({ name: "Café", quantity: "250 g", category: "mercearia", bought: true, position: 5 }),
    ]);
  }

  const in3days = new Date();
  in3days.setDate(in3days.getDate() + 3);
  const tonight = new Date();
  tonight.setHours(23, 59, 0, 0);

  await insertAll("notes", [
    { ...demo, title: "Cupão -15% na livraria", body: "Código LIVRO15 na compra online.", expires_at: in3days.toISOString(), task_id: null },
    { ...demo, title: "Devolver livro à biblioteca", body: "Balcão do piso 1.", expires_at: tonight.toISOString(), task_id: null },
  ]);

  refresh(ws.slug);
}

export async function clearDemo(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const client = db();

  const { data: lists } = await client
    .from("shopping_lists")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("is_demo", true);

  for (const table of ["tasks", "events", "transactions", "budgets", "bills", "notes"] as const) {
    await client.from(table).delete().eq("workspace_id", ws.id).eq("is_demo", true);
  }
  if (lists?.length) {
    await client
      .from("shopping_lists")
      .delete()
      .in("id", lists.map((l) => l.id));
  }
  refresh(ws.slug);
}
