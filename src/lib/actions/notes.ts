"use server";

import { db } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";
import { done, fail, guard, optionalText, refresh, text, workspaceFromForm } from "./helpers";

export async function createNote(_prev: ActionState, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const ws = await workspaceFromForm(form);

    const title = text(form, "title", 120);
    if (!title) return fail("Escreve um título para a nota.");

    if (form.get("confirm") === null) {
      return fail("Confirma que compreendes que a nota é apagada automaticamente.");
    }

    const raw = text(form, "expires_at", 40);
    const expires = raw ? new Date(raw) : null;
    if (!expires || Number.isNaN(expires.getTime())) return fail("Indica a data e hora de validade.");
    if (expires.getTime() <= Date.now()) return fail("A validade tem de ser no futuro.");

    const taskId = text(form, "task_id");

    const { error } = await db().from("notes").insert({
      workspace_id: ws.id,
      title,
      body: optionalText(form, "body", 2000),
      expires_at: expires.toISOString(),
      task_id: taskId || null,
    });
    if (error) return fail(error.message);
    refresh(ws.slug);
    return done();
  });
}

export async function deleteNote(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("notes").delete().eq("id", text(form, "id")).eq("workspace_id", ws.id);
  refresh(ws.slug);
}

/** Limpeza manual das notas já expiradas. */
export async function purgeNotes(form: FormData): Promise<void> {
  const ws = await workspaceFromForm(form);
  await db().from("notes").delete().eq("workspace_id", ws.id).lt("expires_at", new Date().toISOString());
  refresh(ws.slug);
}
