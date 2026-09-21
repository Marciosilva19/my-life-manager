import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import type { ActionState, Workspace } from "@/lib/types";

/** Resolve a workspace a partir do identificador secreto enviado no formulário. */
export async function workspaceFromForm(form: FormData): Promise<Workspace> {
  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) throw new Error("Workspace em falta.");
  const { data, error } = await db().from("workspaces").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Workspace não encontrada.");
  return data as Workspace;
}

export function refresh(slug: string) {
  revalidatePath(`/w/${slug}`, "layout");
}

export const fail = (error: string): ActionState => ({ ok: false, error });
export const done = (): ActionState => ({ ok: true });

export function text(form: FormData, key: string, max = 500): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export function optionalText(form: FormData, key: string, max = 2000): string | null {
  const value = text(form, key, max);
  return value ? value : null;
}

export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function isTime(value: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

export function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Envolve uma Server Action, convertendo erros inesperados em mensagem legível. */
export async function guard(run: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await run();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return fail(message);
  }
}
