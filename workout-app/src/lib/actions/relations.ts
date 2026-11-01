"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient, requireProfile, requireTrainer } from "@/lib/auth";
import { back, dbMessage, str } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";

export async function joinTrainer(form: FormData) {
  await requireClient();
  const code = str(form, "code");
  const from = str(form, "from") === "dashboard" ? "/dashboard" : "/trainers";
  if (!code) back(from, "error", "Enter your trainer's invite code.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_trainer", { code });
  if (error) back(from, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(from, "ok", "You're now connected with your trainer.");
}

/** Either side can end the PT ↔ client relationship. */
export async function endRelationship(form: FormData) {
  const me = await requireProfile();
  const other = str(form, "other_id");
  const supabase = await createClient();
  const q = supabase.from("trainer_clients").delete();
  const { error } =
    me.role === "trainer"
      ? await q.eq("trainer_id", me.id).eq("client_id", other)
      : await q.eq("trainer_id", other).eq("client_id", me.id);
  const page = me.role === "trainer" ? "/clients" : "/trainers";
  if (error) back(page, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(page, "ok", me.role === "trainer" ? "Client removed." : "You left that trainer.");
}

export async function regenerateInviteCode() {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("regenerate_invite_code");
  if (error) back("/clients", "error", dbMessage(error));
  revalidatePath("/", "layout");
  back("/clients", "ok", "New invite code created. The old one no longer works.");
}

export async function updateProfile(form: FormData) {
  const me = await requireProfile();
  const fullName = str(form, "full_name");
  if (!fullName) back("/profile", "error", "Your name can't be empty.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, bio: str(form, "bio") || null })
    .eq("id", me.id);
  if (error) back("/profile", "error", dbMessage(error));
  revalidatePath("/", "layout");
  redirect("/profile?ok=Saved.");
}
