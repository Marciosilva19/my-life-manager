import Link from "next/link";
import Nav from "@/components/Nav";
import { signOut } from "@/lib/actions/auth";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireProfile();
  return (
    <div className="min-h-dvh pb-24 sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="text-primary">●</span> PT Studio
          </Link>
          <Nav role={me.role} />
          <div className="flex items-center gap-1">
            <Link href="/profile" className="btn-ghost btn-sm">
              <span className="max-w-[9rem] truncate">{me.full_name}</span>
              <span className="chip bg-primarySoft capitalize text-primary">{me.role}</span>
            </Link>
            <form action={signOut}>
              <button className="btn-ghost btn-sm" aria-label="Sign out" title="Sign out">⎋</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
