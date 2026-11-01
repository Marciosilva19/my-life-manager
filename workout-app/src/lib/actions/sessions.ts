"use server";

import { revalidatePath } from "next/cache";
import { requireClient, requireTrainer } from "@/lib/auth";
import { back, dbMessage, optStr, str } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";
import { zonedToUtc } from "@/lib/time";

const PAGE = "/sessions";

/** PT publishes one session, or the same slot repeated weekly. */
export async function createSession(form: FormData) {
  const me = await requireTrainer();
  const title = str(form, "title") || "Training session";
  const date = str(form, "date");
  const start = str(form, "start");
  const end = str(form, "end");
  const capacity = Number(str(form, "capacity") || 1);
  const repeatWeeks = Math.min(Math.max(Number(str(form, "repeat_weeks") || 0), 0), 12);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    back(PAGE, "error", "Please pick a date, a start time and an end time.");
  }
  if (end <= start) back(PAGE, "error", "The end time must be after the start time.");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    back(PAGE, "error", "Spots must be a whole number between 1 and 100.");
  }

  const first = zonedToUtc(date, start);
  if (first.getTime() <= Date.now()) back(PAGE, "error", "That time is in the past.");

  const rows = [];
  for (let w = 0; w <= repeatWeeks; w++) {
    // Add whole calendar days, then convert in the gym time zone (DST-safe).
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7 * w);
    const day = d.toISOString().slice(0, 10);
    rows.push({
      trainer_id: me.id,
      title,
      starts_at: zonedToUtc(day, start).toISOString(),
      ends_at: zonedToUtc(day, end).toISOString(),
      location: optStr(form, "location"),
      capacity,
      notes: optStr(form, "notes"),
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert(rows);
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(PAGE, "ok", rows.length > 1 ? `${rows.length} sessions published.` : "Session published.");
}

export async function setSessionCancelled(form: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ cancelled: str(form, "cancelled") === "true" })
    .eq("id", str(form, "id"));
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
}

export async function deleteSession(form: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", str(form, "id"));
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(PAGE, "ok", "Session deleted.");
}

/** PT removes someone from a session. */
export async function removeAttendee(form: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", str(form, "booking_id"));
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
}

export async function bookSession(form: FormData) {
  await requireClient();
  const supabase = await createClient();
  const { error } = await supabase.rpc("book_session", { p_session: str(form, "id") });
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(PAGE, "ok", "You're booked in. See you at the gym!");
}

export async function cancelBooking(form: FormData) {
  const me = await requireClient();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("session_id", str(form, "id"))
    .eq("client_id", me.id);
  if (error) back(PAGE, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(PAGE, "ok", "Booking cancelled.");
}
