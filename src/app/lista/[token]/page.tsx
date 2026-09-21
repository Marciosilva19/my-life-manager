import type { Metadata } from "next";
import ListBody from "@/components/shopping/ListBody";
import { getItems, getListByToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lista partilhada · My Life Manager",
  robots: { index: false, follow: false },
};

export default async function SharedListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getListByToken(token);

  if (!result) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <span aria-hidden className="text-3xl">
          🔒
        </span>
        <h1 className="mt-3">Link indisponível</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Este link de partilha já não é válido. Pede um novo a quem partilhou a lista.
        </p>
      </main>
    );
  }

  const { list, share } = result;
  const items = await getItems(list.id);
  const canEdit = share.role === "editor";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-4">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-primaryInk">Lista partilhada</p>
        <h1 className="mt-0.5">{list.name}</h1>
      </header>

      <div className="mb-5 rounded-2xl bg-primarySoft px-4 py-3 text-[13px] leading-relaxed text-primaryInk">
        {canEdit ? (
          <>
            <strong>Qualquer pessoa com este link pode ver e editar esta lista.</strong> As alterações ficam visíveis
            para todos. Este link não dá acesso a tarefas, calendário, finanças nem a outras listas.
          </>
        ) : (
          <>Este link permite apenas consultar a lista.</>
        )}
      </div>

      <ListBody ctx={{ token }} items={items} canEdit={canEdit} />

      <p className="mt-8 text-center text-[12px] text-muted">My Life Manager</p>
    </main>
  );
}
