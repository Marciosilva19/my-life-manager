import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SubmitButton from "@/components/SubmitButton";
import { joinTrainer } from "@/lib/actions/relations";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Join your trainer" };

/** Shareable invite link: /join/<code>. */
export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase().slice(0, 8);
  const me = await getProfile();

  if (!me) {
    return (
      <AuthShell title="You've been invited to train">
        <div className="card space-y-4">
          <p className="text-muted">
            Your personal trainer invited you to PT Studio. Create an account to book gym sessions and follow their
            recorded workouts.
          </p>
          <p className="text-sm">Invite code: <span className="font-mono font-semibold">{code}</span></p>
          <Link href={`/signup?role=client&code=${code}`} className="btn-primary w-full">Create my account</Link>
          <Link href={`/login?next=/join/${code}`} className="btn-secondary w-full">I already have an account</Link>
        </div>
      </AuthShell>
    );
  }

  if (me.role === "trainer") {
    return (
      <AuthShell title="This is a client invite">
        <div className="card space-y-4">
          <p className="text-muted">You're signed in as a trainer. Share this link with your clients instead.</p>
          <Link href="/dashboard" className="btn-primary w-full">Go to dashboard</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Join your trainer">
      <form action={joinTrainer} className="card space-y-4">
        <input type="hidden" name="code" value={code} />
        <p className="text-muted">
          Connect with the trainer who owns code <span className="font-mono font-semibold text-text">{code}</span>?
        </p>
        <SubmitButton className="btn-primary w-full" pendingText="Joining…">Join trainer</SubmitButton>
      </form>
    </AuthShell>
  );
}
