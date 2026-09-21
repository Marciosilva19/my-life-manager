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

  await client.from("tasks").insert([
    { ...demo, title: "Beber 1,5 L de água", recurrence: "daily", priority: "baixa", category: "saúde", due_date: today },
    { ...demo, title: "Entregar relatório de Estatística", due_date: addDays(today, 2), due_time: "17:00", priority: "alta", category: "estudos" },
    { ...demo, title: "Aspirar a sala", due_date: today, due_time: "19:30", priority: "media", category: "casa" },
    { ...demo, title: "Marcar consulta de rotina", due_date: addDays(today, 5), priority: "media", category: "saúde" },
    { ...demo, title: "Rever apontamentos", recurrence: "weekdays", recurrence_days: [1, 3], due_date: today, due_time: "21:00", category: "estudos" },
  ]);

  await client.from("events").insert([
    { ...demo, title: "Álgebra Linear", kind: "aula", weekday: 1, start_time: "09:00", end_time: "10:30", color: "rosa", location: "Sala B2.1" },
    { ...demo, title: "Programação", kind: "aula", weekday: 2, start_time: "11:00", end_time: "13:00", color: "azul", location: "Lab 3" },
    { ...demo, title: "Ginásio", kind: "ginasio", weekday: 3, start_time: "18:30", end_time: "19:30", color: "verde" },
    { ...demo, title: "Estudo acompanhado", kind: "estudo", weekday: 4, start_time: "15:00", end_time: "17:00", color: "lilas" },
    { ...demo, title: "Turno na loja", kind: "trabalho", weekday: 6, start_time: "10:00", end_time: "16:00", color: "ambar", location: "Centro comercial" },
  ]);

  await client.from("transactions").insert([
    { ...demo, amount: 850, type: "income", category: "outros", date: `${month}-01`, description: "Bolsa/ordenado", recurrence: "monthly" },
    { ...demo, amount: 62.4, type: "expense", category: "alimentação", date: `${month}-04`, description: "Compras da semana" },
    { ...demo, amount: 30, type: "expense", category: "transporte", date: `${month}-05`, description: "Passe mensal", recurrence: "monthly" },
    { ...demo, amount: 12.99, type: "expense", category: "subscrições", date: `${month}-07`, description: "Streaming", recurrence: "monthly" },
    { ...demo, amount: 24, type: "expense", category: "lazer", date: `${month}-12`, description: "Cinema com amigos" },
    { ...demo, amount: 45.5, type: "expense", category: "estudos", date: `${month}-15`, description: "Manual de apoio" },
  ]);

  await client.from("budgets").insert([
    { ...demo, category: "alimentação", amount: 200 },
    { ...demo, category: "transporte", amount: 60 },
    { ...demo, category: "lazer", amount: 80 },
  ]);

  await client.from("bills").insert([
    { ...demo, name: "Renda", amount: 420, due_date: `${month}-08`, recurrence: "monthly" },
    { ...demo, name: "Eletricidade", amount: 38.7, due_date: addDays(today, 3), recurrence: "monthly" },
    { ...demo, name: "Internet", amount: 29.9, due_date: addDays(today, 11), recurrence: "monthly" },
  ]);

  const { data: list } = await client
    .from("shopping_lists")
    .insert({ ...demo, name: "Supermercado" })
    .select("id")
    .single();

  if (list) {
    await client.from("shopping_items").insert([
      { list_id: list.id, is_demo: true, name: "Bananas", quantity: "1 kg", category: "fruta e legumes", position: 1 },
      { list_id: list.id, is_demo: true, name: "Leite", quantity: "6 un", category: "frescos", position: 2 },
      { list_id: list.id, is_demo: true, name: "Massa integral", category: "mercearia", position: 3 },
      { list_id: list.id, is_demo: true, name: "Detergente da loiça", category: "limpeza", position: 4 },
      { list_id: list.id, is_demo: true, name: "Café", quantity: "250 g", category: "mercearia", bought: true, position: 5 },
    ]);
  }

  const in3days = new Date();
  in3days.setDate(in3days.getDate() + 3);
  const tonight = new Date();
  tonight.setHours(23, 59, 0, 0);

  await client.from("notes").insert([
    { ...demo, title: "Cupão -15% na livraria", body: "Código LIVRO15 na compra online.", expires_at: in3days.toISOString() },
    { ...demo, title: "Devolver livro à biblioteca", body: "Balcão do piso 1.", expires_at: tonight.toISOString() },
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
