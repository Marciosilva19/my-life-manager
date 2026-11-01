import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { signUp } from "@/lib/actions/auth";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; code?: string; error?: string }>;
}) {
  if (await getProfile()) redirect("/dashboard");
  const sp = await searchParams;
  const role = sp.role === "trainer" ? "trainer" : "client";
  const code = sp.code ?? "";
  return (
    <AuthShell title="Create your account">
      <Flash error={sp.error} />
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface2 p-1 text-sm font-semibold">
        {(["client", "trainer"] as const).map((r) => (
          <Link
            key={r}
            href={`/signup?role=${r}${code ? `&code=${code}` : ""}`}
            className={`rounded-lg py-2 text-center ${role === r ? "bg-surface shadow-soft" : "text-muted"}`}
          >
            {r === "client" ? "I'm a client" : "I'm a trainer"}
          </Link>
        ))}
      </div>
      <form action={signUp} className="card space-y-4">
        <input type="hidden" name="role" value={role} />
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" required maxLength={80} autoComplete="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        {role === "client" ? (
          <div>
            <label className="label" htmlFor="invite_code">Trainer invite code (optional)</label>
            <input id="invite_code" name="invite_code" defaultValue={code} maxLength={8} placeholder="e.g. 4F9A2C1B" className="input font-mono uppercase" />
            <p className="mt-1 text-xs text-muted">Ask your PT for it. You can also add it later.</p>
          </div>
        ) : (
          <p className="rounded-xl bg-primarySoft px-3 py-2 text-sm text-primary">
            You'll get an invite code to share with your clients.
          </p>
        )}
        <SubmitButton className="btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
