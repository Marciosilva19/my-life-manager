import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Current user's profile, or null when signed out. Cached per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const p = await getProfile();
  if (!p) redirect("/login");
  return p;
}

export async function requireTrainer(): Promise<Profile> {
  const p = await requireProfile();
  if (p.role !== "trainer") redirect("/dashboard");
  return p;
}

export async function requireClient(): Promise<Profile> {
  const p = await requireProfile();
  if (p.role !== "client") redirect("/dashboard");
  return p;
}
