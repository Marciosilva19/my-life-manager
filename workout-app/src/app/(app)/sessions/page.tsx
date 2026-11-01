import Link from "next/link";
import Flash from "@/components/Flash";
import SessionCard from "@/components/SessionCard";
import SubmitButton from "@/components/SubmitButton";
import {
  bookSession,
  cancelBooking,
  createSession,
  deleteSession,
  removeAttendee,
  setSessionCancelled,
} from "@/lib/actions/sessions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayKey, dayLabel, groupByDay, todayKey } from "@/lib/time";
import type { NamedRef, Profile, Session } from "@/lib/types";

export const metadata = { title: "Sessions" };

type SP = Promise<{ error?: string; ok?: string; view?: string; trainer?: string }>;

export default async function SessionsPage({ searchParams }: { searchParams: SP }) {
  const me = await requireProfile();
  const sp = await searchParams;
  return (
    <>
      <Flash error={sp.error} ok={sp.ok} />
      {me.role === "trainer" ? (
        <TrainerSchedule me={me} past={sp.view === "past"} />
      ) : (
        <ClientBooking me={me} trainerFilter={sp.trainer} />
      )}
    </>
  );
}

// ───────────────────────────────────────────── trainer

type TrainerRow = Session & {
  bookings: { id: string; client_id: string; client: NamedRef }[];
};

async function TrainerSchedule({ me, past }: { me: Profile; past: boolean }) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  let q = supabase
    .from("sessions")
    .select("*, bookings(id, client_id, client:profiles!bookings_client_id_fkey(full_name))")
    .eq("trainer_id", me.id);
  q = past
    ? q.lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(60)
    : q.gte("ends_at", nowIso).order("starts_at");
  const { data } = await q;
  const sessions = (data ?? []) as TrainerRow[];

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <section className="card h-fit lg:sticky lg:top-20">
        <h2>Add gym availability</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Your clients can book a spot in any session you publish.</p>
        <form action={createSession} className="space-y-3">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" maxLength={80} placeholder="e.g. Strength 1:1, HIIT small group" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="date">Date</label>
            <input id="date" name="date" type="date" required min={todayKey()} defaultValue={todayKey()} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="start">Start</label>
              <input id="start" name="start" type="time" required defaultValue="18:00" step={300} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="end">End</label>
              <input id="end" name="end" type="time" required defaultValue="19:00" step={300} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="capacity">Spots</label>
              <input id="capacity" name="capacity" type="number" min={1} max={100} defaultValue={1} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="repeat_weeks">Repeat weekly</label>
              <select id="repeat_weeks" name="repeat_weeks" className="input" defaultValue="0">
                <option value="0">Just once</option>
                {[1, 3, 5, 7, 11].map((n) => (
                  <option key={n} value={n}>
                    {n + 1} weeks
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location">Gym / location</label>
            <input id="location" name="location" maxLength={120} placeholder="e.g. Fitness Hut Alvalade" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={2} maxLength={500} placeholder="What to bring, focus of the session…" className="input" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Publishing…">Publish</SubmitButton>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1>{past ? "Past sessions" : "Your schedule"}</h1>
          <div className="flex rounded-xl bg-surface2 p-1 text-sm font-medium">
            <Link href="/sessions" className={`rounded-lg px-3 py-1 ${!past ? "bg-surface shadow-soft" : "text-muted"}`}>Upcoming</Link>
            <Link href="/sessions?view=past" className={`rounded-lg px-3 py-1 ${past ? "bg-surface shadow-soft" : "text-muted"}`}>Past</Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="card text-center text-muted">
            {past ? "No past sessions yet." : "No upcoming sessions. Use the form to add the days you'll be at the gym."}
          </div>
        ) : (
          <div className="space-y-6">
            {groupByDay(sessions).map(([key, rows]) => (
              <div key={key}>
                <p className="section-title">{dayLabel(key, rows[0].starts_at)}</p>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <SessionCard key={s.id} session={{ ...s, booked_count: s.bookings.length }}>
                      {!past ? (
                        <form action={setSessionCancelled}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="cancelled" value={String(!s.cancelled)} />
                          <SubmitButton
                            className="btn-secondary btn-sm"
                            pendingText="…"
                            confirm={s.cancelled ? undefined : "Cancel this session? Booked clients will see it as cancelled."}
                          >
                            {s.cancelled ? "Reopen" : "Cancel"}
                          </SubmitButton>
                        </form>
                      ) : null}
                      <form action={deleteSession}>
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton className="btn-danger btn-sm" pendingText="…" confirm="Delete this session and its bookings?">
                          Delete
                        </SubmitButton>
                      </form>
                    </SessionCard>
                  ))}
                </div>
                {rows.some((s) => s.bookings.length > 0) ? (
                  <div className="mt-2 space-y-1">
                    {rows
                      .filter((s) => s.bookings.length > 0)
                      .map((s) => (
                        <div key={s.id} className="rounded-xl bg-surface2 px-3 py-2 text-sm">
                          <span className="font-medium">{s.title}: </span>
                          {s.bookings.map((b, i) => (
                            <span key={b.id} className="inline-flex items-center">
                              {i > 0 ? ", " : ""}
                              {b.client?.full_name ?? "Former client"}
                              {!past ? (
                                <form action={removeAttendee} className="inline">
                                  <input type="hidden" name="booking_id" value={b.id} />
                                  <SubmitButton className="ml-0.5 px-1 text-muted hover:text-danger" pendingText="…" confirm="Remove this person from the session?">
                                    ×
                                  </SubmitButton>
                                </form>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── client

type ClientRow = Session & { booked_count: number; trainer: NamedRef };

async function ClientBooking({ me, trainerFilter }: { me: Profile; trainerFilter?: string }) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [{ data: links }, { data: sessions }, { data: bookings }] = await Promise.all([
    supabase
      .from("trainer_clients")
      .select("trainer_id, trainer:profiles!trainer_clients_trainer_id_fkey(full_name)")
      .eq("client_id", me.id),
    supabase
      .from("sessions")
      .select("*, booked_count, trainer:profiles!sessions_trainer_id_fkey(full_name)")
      .gt("starts_at", nowIso)
      .order("starts_at")
      .limit(200),
    supabase.from("bookings").select("session_id").eq("client_id", me.id),
  ]);

  const trainers = (links ?? []) as unknown as { trainer_id: string; trainer: NamedRef }[];
  if (trainers.length === 0) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h2>No trainer yet</h2>
        <p className="mt-1 text-sm text-muted">Connect with your PT to see when they're at the gym.</p>
        <Link href="/trainers" className="btn-primary mt-4">Add my trainer</Link>
      </div>
    );
  }

  const mine = new Set((bookings ?? []).map((b) => b.session_id as string));
  const all = ((sessions ?? []) as ClientRow[]).filter((s) => !trainerFilter || s.trainer_id === trainerFilter);
  const booked = all.filter((s) => mine.has(s.id));
  const open = all.filter((s) => !mine.has(s.id) && !s.cancelled);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Book a session</h1>
        {trainers.length > 1 ? (
          <div className="flex flex-wrap gap-1 text-sm">
            <Link href="/sessions" className={`chip px-3 py-1 ${!trainerFilter ? "bg-primary text-onprimary" : "bg-surface2"}`}>All trainers</Link>
            {trainers.map((t) => (
              <Link
                key={t.trainer_id}
                href={`/sessions?trainer=${t.trainer_id}`}
                className={`chip px-3 py-1 ${trainerFilter === t.trainer_id ? "bg-primary text-onprimary" : "bg-surface2"}`}
              >
                {t.trainer?.full_name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {booked.length > 0 ? (
        <section>
          <p className="section-title">My bookings</p>
          <div className="space-y-2">
            {booked.map((s) => (
              <SessionCard key={s.id} session={s} trainerName={s.trainer?.full_name} booked>
                <span className="self-center text-xs font-medium text-muted">{dayLabel(dayKey(s.starts_at), s.starts_at)}</span>
                {!s.cancelled ? (
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton className="btn-secondary btn-sm" pendingText="…" confirm="Cancel your booking?">
                      Cancel booking
                    </SubmitButton>
                  </form>
                ) : null}
              </SessionCard>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <p className="section-title">Available sessions</p>
        {open.length === 0 ? (
          <div className="card text-center text-muted">No sessions published right now — check back soon.</div>
        ) : (
          <div className="space-y-6">
            {groupByDay(open).map(([key, rows]) => (
              <div key={key}>
                <h2 className="mb-2 text-base">{dayLabel(key, rows[0].starts_at)}</h2>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <SessionCard key={s.id} session={s} trainerName={trainers.length > 1 ? s.trainer?.full_name : null}>
                      {s.booked_count < s.capacity ? (
                        <form action={bookSession}>
                          <input type="hidden" name="id" value={s.id} />
                          <SubmitButton className="btn-primary btn-sm" pendingText="Booking…">Book</SubmitButton>
                        </form>
                      ) : (
                        <span className="btn-secondary btn-sm pointer-events-none opacity-60">Full</span>
                      )}
                    </SessionCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
