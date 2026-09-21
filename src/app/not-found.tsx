import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <span aria-hidden className="text-3xl">
        🔍
      </span>
      <h1 className="mt-3">Página não encontrada</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        O link pode estar incompleto ou a área já não existir. Confirma o endereço que guardaste.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Voltar ao início
      </Link>
    </main>
  );
}
