import CopyButton from "@/components/CopyButton";
import Flash, { type FlashParams } from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { endRelationship, regenerateInviteCode } from "@/lib/actions/relations";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtShortDay } from "@/lib/time";

export const metadata = { title: "Clients" };

type Row = {
  client_id: string;
  created_at: string;
  client: { full_name: string; bio: string | null } | null;
};

export default async function ClientsPage({ searchParams }: { searchParams: FlashParams }) {
  const me = await requireTrainer();
  const sp = await searchParams;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: links }, { data: upcoming }, { data: completions }] = await Promise.all([
    supabase
      .from("trainer_clients")
      .select("client_id, created_at, client:profiles!trainer_clients_client_id_fkey(full_name, bio)")
      .eq("trainer_id", me.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("client_id, session:sessions!inner(starts_at, trainer_id)")
      .eq("session.trainer_id", me.id)
      .gte("session.starts_at", nowIso),
    supabase.from("video_completions").select("client_id, video:videos!inner(trainer_id)").eq("video.trainer_id", me.id),
  ]);

  const clients = (links ?? []) as unknown as Row[];
  const nextSession = new Map<string, string>();
  const bookedCount = new Map<string, number>();
  for (const b of (upcoming ?? []) as unknown as { client_id: string; session: { starts_at: string } }[]) {
    bookedCount.set(b.client_id, (bookedCount.get(b.client_id) ?? 0) + 1);
    const cur = nextSession.get(b.client_id);
    if (!cur || b.session.starts_at < cur) nextSession.set(b.client_id, b.session.starts_at);
  }
  const watched = new Map<string, number>();
  for (const c of (completions ?? []) as { client_id: string }[]) {
    watched.set(c.client_id, (watched.get(c.client_id) ?? 0) + 1);
  }

  return (
    <>
      <Flash error={sp.error} ok={sp.ok} />
      <h1>Clients</h1>

      <section className="card mt-4">
        <h2>Invite a client</h2>
        <p className="mt-1 text-sm text-muted">
          Clients join by signing up with your code, or by opening your invite link.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-surface2 px-4 py-2 font-mono text-xl font-bold tracking-widest">
            {me.invite_code}
          </span>
          <CopyButton text={me.invite_code ?? ""} label="Copy code" />
          <CopyButton text={`/join/${me.invite_code}`} label="Copy invite link" />
          <form action={regenerateInviteCode}>
            <SubmitButton
              className="btn-ghost btn-sm"
              pendingText="…"
              confirm="Create a new code? The current code and link will stop working (existing clients stay)."
            >
              New code
            </SubmitButton>
          </form>
        </div>
      </section>

      <section className="mt-6">
        <p className="section-title">{clients.length} {clients.length === 1 ? "client" : "clients"}</p>
        {clients.length === 0 ? (
          <div className="card text-center text-muted">No clients yet — share your invite link to get started.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clients.map((c) => (
              <div key={c.client_id} className="card flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate">{c.client?.full_name}</h3>
                  {c.client?.bio ? <p className="line-clamp-2 text-sm text-muted">{c.client.bio}</p> : null}
                  <p className="mt-2 text-xs text-muted">
                    Client since {fmtShortDay(c.created_at)} · {bookedCount.get(c.client_id) ?? 0} upcoming
                    {nextSession.get(c.client_id) ? ` (next ${fmtShortDay(nextSession.get(c.client_id)!)})` : ""} ·{" "}
                    {watched.get(c.client_id) ?? 0} videos done
                  </p>
                </div>
                <form action={endRelationship}>
                  <input type="hidden" name="other_id" value={c.client_id} />
                  <SubmitButton
                    className="btn-danger btn-sm"
                    pendingText="…"
                    confirm={`Remove ${c.client?.full_name ?? "this client"}? They'll lose access to your sessions and videos.`}
                  >
                    Remove
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
