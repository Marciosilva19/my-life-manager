import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "@/lib/actions/auth";
import { getProfile } from "@/lib/auth";
import { safeNext } from "@/lib/flash";

export const metadata = { title: "Sign in" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getProfile()) redirect(next);
  return (
    <AuthShell title="Welcome back">
      <Flash error={sp.error} ok={sp.ok} />
      <form action={signIn} className="card space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
