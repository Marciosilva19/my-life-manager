import Flash, { type FlashParams } from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { endRelationship, joinTrainer } from "@/lib/actions/relations";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Trainers" };

type Row = { trainer_id: string; trainer: { full_name: string; bio: string | null } | null };

export default async function TrainersPage({ searchParams }: { searchParams: FlashParams }) {
  const me = await requireClient();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("trainer_clients")
    .select("trainer_id, trainer:profiles!trainer_clients_trainer_id_fkey(full_name, bio)")
    .eq("client_id", me.id);
  const trainers = (data ?? []) as unknown as Row[];

  return (
    <>
      <Flash error={sp.error} ok={sp.ok} />
      <h1>My trainers</h1>

      <section className="card mt-4 max-w-lg">
        <h2>Add a trainer</h2>
        <p className="mt-1 text-sm text-muted">Enter the invite code your personal trainer shared with you.</p>
        <form action={joinTrainer} className="mt-3 flex gap-2">
          <input name="code" required maxLength={8} placeholder="Invite code" className="input font-mono uppercase" />
          <SubmitButton pendingText="Joining…">Join</SubmitButton>
        </form>
      </section>

      <section className="mt-6">
        {trainers.length === 0 ? (
          <div className="card text-center text-muted">You're not connected with any trainer yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {trainers.map((t) => (
              <div key={t.trainer_id} className="card flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3>{t.trainer?.full_name}</h3>
                  <p className="text-sm text-muted">{t.trainer?.bio || "Personal trainer"}</p>
                </div>
                <form action={endRelationship}>
                  <input type="hidden" name="other_id" value={t.trainer_id} />
                  <SubmitButton
                    className="btn-ghost btn-sm"
                    pendingText="…"
                    confirm="Leave this trainer? You'll no longer see their sessions or videos."
                  >
                    Leave
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
