import Link from "next/link";

export default function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <span className="text-primary">●</span> PT Studio
      </Link>
      <h1 className="mb-6">{title}</h1>
      {children}
    </main>
  );
}
