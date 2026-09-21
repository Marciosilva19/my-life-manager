"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { randomToken } from "@/lib/id";
import type { ActionState, ListShare, ShoppingList } from "@/lib/types";
import { SHOPPING_CATEGORIES } from "@/lib/types";
import { done, fail, guard, optionalText, pick, refresh, text, workspaceFromForm } from "./helpers";

/**
 * Contexto de uma lista: ou vem da workspace (link secreto principal) ou de um
 * link de partilha. Num link de partilha só é possível tocar nessa lista.
 */
type ListContext = { list: ShoppingList; canEdit: boolean; revalidate: () => void };

async function resolveList(form: FormData): Promise<ListContext> {
  const token = text(form, "token", 64);

  if (token) {
    const { data, error } = await db()
      .from("list_shares")
      .select("*, shopping_lists(*)")
      .eq("token", token)
      .is("revoked_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const row = data as (ListShare & { shopping_lists: ShoppingList | null }) | null;
    if (!row?.shopping_lists) throw new Error("Este link de partilha já não é válido.");
    return {
      list: row.shopping_lists,
      canEdit: row.role === "editor",
      revalidate: () => revalidatePath(`/lista/${token}`),
    };
  }

  const ws = await workspaceFromForm(form);
  const listId = text(form, "list_id");
  const { data, error } = await db()
    .from("shopping_lists")
    .select("*")
    .eq("id", listId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lista não encontrada.");
  return { list: data as ShoppingList, canEdit: true, revalidate: () => refresh(ws.slug) };
}

/* ----------------------------------------------------------------- listas */

export async function createList(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const name = text(form, "name", 80);
    if (!name) return fail("Dá um nome à lista.");
    const { error } = await db().from("shopping_lists").insert({ workspace_id: ws.id, name });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function renameList(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);
    const name = text(form, "name", 80);
    if (!name) return fail("Dá um nome à lista.");
    const { error } = await db()
      .from("shopping_lists")
      .update({ name })
      .eq("id", text(form, "list_id"))
      .eq("workspace_id", ws.id);
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function deleteList(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("shopping_lists").delete().eq("id", text(form, "list_id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}

/* ------------------------------------------------------------------ itens */

export async function addItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await resolveList(form);
    if (!ctx.canEdit) return fail("Este link só permite ver a lista.");

    const name = text(form, "name", 120);
    if (!name) return fail("Escreve o nome do artigo.");

    const { error } = await db().from("shopping_items").insert({
      list_id: ctx.list.id,
      name,
      quantity: optionalText(form, "quantity", 40),
      category: pick(text(form, "category"), SHOPPING_CATEGORIES, "outros"),
      notes: optionalText(form, "notes", 200),
      position: Date.now() % 1_000_000,
    });
    if (error) return fail(error.message);
    ctx.revalidate();
    return done();
  });
}

export async function toggleItem(form: FormData): Promise<void> {
  const ctx = await resolveList(form);
  if (!ctx.canEdit) return;
  const id = text(form, "item_id");
  const { data } = await db().from("shopping_items").select("bought").eq("id", id).eq("list_id", ctx.list.id).maybeSingle();
  if (!data) return;
  await db().from("shopping_items").update({ bought: !data.bought }).eq("id", id).eq("list_id", ctx.list.id);
  ctx.revalidate();
}

export async function deleteItem(form: FormData): Promise<void> {
  const ctx = await resolveList(form);
  if (!ctx.canEdit) return;
  await db().from("shopping_items").delete().eq("id", text(form, "item_id")).eq("list_id", ctx.list.id);
  ctx.revalidate();
}

export async function clearBought(form: FormData): Promise<void> {
  const ctx = await resolveList(form);
  if (!ctx.canEdit) return;
  await db().from("shopping_items").delete().eq("list_id", ctx.list.id).eq("bought", true);
  ctx.revalidate();
}

/* --------------------------------------------------------------- partilha */

export async function createShareLink(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const listId = text(form, "list_id");
  const { data: list } = await db()
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!list) return;

  const { data: existing } = await db()
    .from("list_shares")
    .select("id")
    .eq("list_id", listId)
    .is("revoked_at", null)
    .maybeSingle();
  if (!existing) {
    await db().from("list_shares").insert({ list_id: listId, token: randomToken(24), role: "editor" });
  }
  refresh(ws.slug);
}

export async function revokeShareLink(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  const listId = text(form, "list_id");
  const { data: list } = await db()
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!list) return;
  await db()
    .from("list_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("list_id", listId)
    .is("revoked_at", null);
  refresh(ws.slug);
}
