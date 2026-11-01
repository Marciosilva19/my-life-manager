"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { back, safeNext, str } from "@/lib/flash";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signUp(form: FormData) {
  const role = str(form, "role") === "trainer" ? "trainer" : "client";
  const fullName = str(form, "full_name");
  const email = str(form, "email");
  const password = str(form, "password");
  const inviteCode = role === "client" ? str(form, "invite_code").toUpperCase() : "";
  const retry = `/signup?role=${role}${inviteCode ? `&code=${inviteCode}` : ""}`;

  if (!fullName || !email) back(retry, "error", "Please fill in your name and e-mail.");
  if (password.length < 8) back(retry, "error", "Password must have at least 8 characters.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName, invite_code: inviteCode || null },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) back(retry, "error", error.message);

  // Projects with "Confirm email" on return no session until the link is clicked.
  if (!data.session) {
    redirect(`/login?ok=${encodeURIComponent("Check your inbox to confirm your e-mail, then sign in.")}`);
  }
  redirect("/dashboard");
}

export async function signIn(form: FormData) {
  const next = safeNext(str(form, "next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (error) back(`/login?next=${encodeURIComponent(next)}`, "error", error.message);
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
