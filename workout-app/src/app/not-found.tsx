import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1>Page not found</h1>
      <p className="text-muted">It may have been removed, or you don't have access to it.</p>
      <Link href="/dashboard" className="btn-primary">Go home</Link>
    </main>
  );
}
