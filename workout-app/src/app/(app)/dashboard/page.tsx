import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import Flash, { type FlashParams } from "@/components/Flash";
import SessionCard from "@/components/SessionCard";
import SubmitButton from "@/components/SubmitButton";
import VideoCard from "@/components/VideoCard";
import { joinTrainer } from "@/lib/actions/relations";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayKey, dayLabel, fmtShortDay, fmtTime } from "@/lib/time";
import type { NamedRef, Profile, Session, Video } from "@/lib/types";

export const metadata = { title: "Home" };

type SessionRow = Session & { booked_count: number; trainer: NamedRef };

export default async function Dashboard({ searchParams }: { searchParams: FlashParams }) {
  const me = await requireProfile();
  const sp = await searchParams;
  return (
    <>
      <Flash error={sp.error} ok={sp.ok} />
      <h1>Hi, {me.full_name.split(" ")[0]} 👋</h1>
      {me.role === "trainer" ? <TrainerHome me={me} /> : <ClientHome me={me} />}
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="card transition hover:border-primary/50">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </Link>
  );
}

async function TrainerHome({ me }: { me: Profile }) {
  const supabase = await createClient();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const [{ data: sessions }, { count: clients }, { count: videos }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, booked_count")
      .eq("trainer_id", me.id)
      .eq("cancelled", false)
      .gte("starts_at", now.toISOString())
      .lt("starts_at", weekAhead.toISOString())
      .order("starts_at"),
    supabase.from("trainer_clients").select("*", { count: "exact", head: true }).eq("trainer_id", me.id),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("trainer_id", me.id),
  ]);
  const upcoming = (sessions ?? []) as SessionRow[];
  const bookedSpots = upcoming.reduce((n, s) => n + s.booked_count, 0);
  const totalSpots = upcoming.reduce((n, s) => n + s.capacity, 0);

  return (
    <div className="mt-6 space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions next 7 days" value={upcoming.length} href="/sessions" />
        <Stat label="Spots booked" value={`${bookedSpots}/${totalSpots}`} href="/sessions" />
        <Stat label="Clients" value={clients ?? 0} href="/clients" />
        <Stat label="Videos" value={videos ?? 0} href="/videos" />
      </div>

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Invite clients</h2>
          <p className="text-sm text-muted">
            Share your code <span className="font-mono font-semibold text-text">{me.invite_code}</span> or the link.
          </p>
        </div>
        <CopyButton text={`/join/${me.invite_code}`} label="Copy invite link" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>Coming up</h2>
          <Link href="/sessions" className="btn-ghost btn-sm">Manage schedule →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card text-center text-muted">
            No sessions this week.{" "}
            <Link href="/sessions" className="font-semibold text-primary">Add your gym availability</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 6).map((s) => (
              <div key={s.id}>
                <p className="mb-1 text-xs font-medium text-muted">{dayLabel(dayKey(s.starts_at), s.starts_at)}</p>
                <SessionCard session={s} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function ClientHome({ me }: { me: Profile }) {
  const supabase = await createClient();
  const { count: trainers } = await supabase
    .from("trainer_clients")
    .select("*", { count: "exact", head: true })
    .eq("client_id", me.id);

  if (!trainers) {
    return (
      <section className="card mt-6 max-w-lg">
        <h2>Connect with your trainer</h2>
        <p className="mt-1 text-sm text-muted">
          Enter the invite code your personal trainer gave you to see their gym schedule and workouts.
        </p>
        <form action={joinTrainer} className="mt-4 flex gap-2">
          <input type="hidden" name="from" value="dashboard" />
          <input name="code" required maxLength={8} placeholder="Invite code" className="input font-mono uppercase" />
          <SubmitButton pendingText="Joining…">Join</SubmitButton>
        </form>
      </section>
    );
  }

  const nowIso = new Date().toISOString();
  const [{ data: mine }, { data: open }, { data: videos }, { data: done }] = await Promise.all([
    supabase
      .from("bookings")
      .select("session:sessions!inner(*, trainer:profiles!sessions_trainer_id_fkey(full_name))")
      .eq("client_id", me.id)
      .gte("session.starts_at", nowIso),
    supabase
      .from("sessions")
      .select("*, booked_count, trainer:profiles!sessions_trainer_id_fkey(full_name)")
      .eq("cancelled", false)
      .gt("starts_at", nowIso)
      .order("starts_at")
      .limit(20),
    supabase
      .from("videos")
      .select("*, trainer:profiles!videos_trainer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("video_completions").select("video_id").eq("client_id", me.id),
  ]);

  const booked = ((mine ?? []) as unknown as { session: SessionRow }[])
    .map((b) => b.session)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const bookedIds = new Set(booked.map((s) => s.id));
  const available = ((open ?? []) as SessionRow[])
    .filter((s) => !bookedIds.has(s.id) && s.booked_count < s.capacity)
    .slice(0, 3);
  const doneIds = new Set((done ?? []).map((d) => d.video_id as string));
  const vids = (videos ?? []) as (Video & { trainer: NamedRef })[];

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-3">Your next sessions</h2>
        {booked.length === 0 ? (
          <div className="card text-center text-muted">Nothing booked yet.</div>
        ) : (
          <div className="space-y-2">
            {booked.slice(0, 4).map((s) => (
              <div key={s.id}>
                <p className="mb-1 text-xs font-medium text-muted">{dayLabel(dayKey(s.starts_at), s.starts_at)}</p>
                <SessionCard session={s} trainerName={s.trainer?.full_name} booked />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>Open spots</h2>
          <Link href="/sessions" className="btn-ghost btn-sm">See all →</Link>
        </div>
        {available.length === 0 ? (
          <div className="card text-center text-muted">No open spots right now — check back soon.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {available.map((s) => (
              <Link key={s.id} href="/sessions" className="card transition hover:border-primary/50">
                <p className="text-xs font-medium text-muted">{fmtShortDay(s.starts_at)}</p>
                <SessionLine s={s} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>New workouts</h2>
          <Link href="/videos" className="btn-ghost btn-sm">Library →</Link>
        </div>
        {vids.length === 0 ? (
          <div className="card text-center text-muted">Your trainer hasn't posted videos yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {vids.map((v) => (
              <VideoCard key={v.id} video={v} trainerName={v.trainer?.full_name} done={doneIds.has(v.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SessionLine({ s }: { s: SessionRow }) {
  return (
    <>
      <h3 className="mt-0.5">{s.title}</h3>
      <p className="text-sm text-muted">
        {fmtTime(s.starts_at)} · {s.capacity - s.booked_count} left{s.trainer ? ` · ${s.trainer.full_name}` : ""}
      </p>
    </>
  );
}
