import "server-only";
import { notFound } from "next/navigation";
import { db } from "./supabase";
import { DEFAULT_SETTINGS, type Budget, type Bill, type CalendarEvent, type ListShare, type Note, type Settings, type ShoppingItem, type ShoppingList, type Task, type Transaction, type Workspace } from "./types";

/** Junta as preferências guardadas com os valores por omissão. */
export function resolveSettings(raw: Workspace["settings"]): Settings {
  const s = (raw ?? {}) as Partial<Settings>;
  const cards = Array.isArray(s.cards) && s.cards.length ? s.cards : DEFAULT_SETTINGS.cards;
  return {
    theme: s.theme ?? DEFAULT_SETTINGS.theme,
    mode: s.mode ?? (s.theme === "escuro" ? "dark" : DEFAULT_SETTINGS.mode),
    weekStart: s.weekStart === 0 ? 0 : 1,
    cards,
  };
}

/** Carrega a workspace pelo identificador secreto do URL. */
export async function getWorkspace(slug: string): Promise<Workspace> {
  const { data, error } = await db().from("workspaces").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a workspace: ${error.message}`);
  if (!data) notFound();
  return data as Workspace;
}

/** Remove as notas cuja validade já passou (limpeza automática). */
export async function purgeExpiredNotes(): Promise<void> {
  await db().from("notes").delete().lt("expires_at", new Date().toISOString());
}

const rows = <T>(data: unknown): T[] => (data ?? []) as T[];

export async function getTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await db()
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<Task>(data);
}

export async function getEvents(workspaceId: string): Promise<CalendarEvent[]> {
  const { data, error } = await db()
    .from("events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<CalendarEvent>(data);
}

export async function getTransactions(workspaceId: string): Promise<Transaction[]> {
  const { data, error } = await db()
    .from("transactions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return rows<Transaction>(data).map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function getBudgets(workspaceId: string): Promise<Budget[]> {
  const { data, error } = await db().from("budgets").select("*").eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return rows<Budget>(data).map((b) => ({ ...b, amount: Number(b.amount) }));
}

export async function getBills(workspaceId: string): Promise<Bill[]> {
  const { data, error } = await db()
    .from("bills")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<Bill>(data).map((b) => ({ ...b, amount: Number(b.amount) }));
}

export async function getLists(workspaceId: string): Promise<ShoppingList[]> {
  const { data, error } = await db()
    .from("shopping_lists")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<ShoppingList>(data);
}

export async function getItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await db()
    .from("shopping_items")
    .select("*")
    .eq("list_id", listId)
    .order("bought", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<ShoppingItem>(data);
}

/** Itens de várias listas de uma só vez (usado no ecrã Hoje e no índice). */
export async function getItemsForLists(listIds: string[]): Promise<ShoppingItem[]> {
  if (!listIds.length) return [];
  const { data, error } = await db().from("shopping_items").select("*").in("list_id", listIds);
  if (error) throw new Error(error.message);
  return rows<ShoppingItem>(data);
}

export async function getActiveShare(listId: string): Promise<ListShare | null> {
  const { data, error } = await db()
    .from("list_shares")
    .select("*")
    .eq("list_id", listId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ListShare) ?? null;
}

export async function getSharesForLists(listIds: string[]): Promise<ListShare[]> {
  if (!listIds.length) return [];
  const { data, error } = await db().from("list_shares").select("*").in("list_id", listIds).is("revoked_at", null);
  if (error) throw new Error(error.message);
  return rows<ListShare>(data);
}

/**
 * Resolve um link de partilha. Devolve apenas a lista associada ao token —
 * nunca tarefas, calendário, finanças ou outras listas da workspace.
 */
export async function getListByToken(
  token: string,
): Promise<{ list: ShoppingList; share: ListShare } | null> {
  const { data, error } = await db()
    .from("list_shares")
    .select("*, shopping_lists(*)")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { shopping_lists: list, ...share } = data as ListShare & { shopping_lists: ShoppingList | null };
  if (!list) return null;
  return { list, share: share as ListShare };
}

export async function getNotes(workspaceId: string): Promise<Note[]> {
  const { data, error } = await db()
    .from("notes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows<Note>(data);
}
