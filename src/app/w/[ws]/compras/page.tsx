import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import FormSheet from "@/components/ui/FormSheet";
import { Field, Input } from "@/components/ui/Field";
import { createList } from "@/lib/actions/shopping";
import { getItemsForLists, getLists, getSharesForLists, getWorkspace } from "@/lib/data";
import { pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ShoppingPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const lists = await getLists(workspace.id);
  const [items, shares] = await Promise.all([
    getItemsForLists(lists.map((l) => l.id)),
    getSharesForLists(lists.map((l) => l.id)),
  ]);

  const newListForm = (
    <FormSheet
      trigger="+ Nova lista"
      triggerClassName="btn-primary btn-sm"
      title="Nova lista de compras"
      action={createList}
      hidden={{ slug: ws }}
      submitLabel="Criar lista"
    >
      <Field label="Nome da lista" htmlFor="name">
        <Input id="name" name="name" required maxLength={80} placeholder="Supermercado, farmácia…" autoComplete="off" />
      </Field>
    </FormSheet>
  );

  return (
    <main>
      <PageHeader title="Compras" subtitle="Listas que podes partilhar por link" action={newListForm} />

      {lists.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Ainda não tens listas"
          hint="Cria uma lista para o supermercado e partilha-a com quem for contigo."
        />
      ) : (
        <ul className="space-y-3">
          {lists.map((list) => {
            const listItems = items.filter((i) => i.list_id === list.id);
            const pending = listItems.filter((i) => !i.bought).length;
            const shared = shares.some((s) => s.list_id === list.id);
            return (
              <li key={list.id}>
                <Link href={`/w/${ws}/compras/${list.id}`} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium">{list.name}</p>
                    <p className="text-[13px] text-muted">
                      {pending > 0
                        ? `${pending} ${pluralize(pending, "artigo por comprar", "artigos por comprar")}`
                        : listItems.length > 0
                          ? "Tudo comprado"
                          : "Lista vazia"}
                      {shared ? " · partilhada" : ""}
                    </p>
                  </div>
                  <span aria-hidden className="text-muted">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        Os links de partilha dão acesso apenas à lista escolhida. Tarefas, calendário e finanças ficam sempre fora.
      </p>
    </main>
  );
}
