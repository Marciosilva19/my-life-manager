import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import EmptyState from "@/components/ui/EmptyState";
import ItemFields from "@/components/forms/ItemFields";
import { addItem, clearBought, deleteItem, toggleItem } from "@/lib/actions/shopping";
import { capitalize } from "@/lib/format";
import type { ShoppingItem } from "@/lib/types";

export type ListContextProps = { slug?: string; listId?: string; token?: string };

function hiddenFields(ctx: ListContextProps) {
  return ctx.token ? { token: ctx.token } : { slug: ctx.slug, list_id: ctx.listId };
}

function HiddenInputs({ ctx }: { ctx: ListContextProps }) {
  return (
    <>
      {Object.entries(hiddenFields(ctx)).map(([name, value]) =>
        value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />,
      )}
    </>
  );
}

export default function ListBody({
  ctx,
  items,
  canEdit = true,
}: {
  ctx: ListContextProps;
  items: ShoppingItem[];
  canEdit?: boolean;
}) {
  const pending = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);

  const groups = new Map<string, ShoppingItem[]>();
  for (const item of pending) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  return (
    <div className="space-y-5">
      {canEdit ? (
        <FormSheet
          trigger="+ Adicionar artigo"
          triggerClassName="btn-primary w-full"
          title="Novo artigo"
          action={addItem}
          hidden={hiddenFields(ctx)}
          submitLabel="Adicionar"
        >
          <ItemFields />
        </FormSheet>
      ) : null}

      {items.length === 0 ? (
        <EmptyState emoji="🧺" title="Lista vazia" hint="Adiciona o primeiro artigo para começares." />
      ) : null}

      {[...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, group]) => (
          <section key={category}>
            <h2 className="section-title mb-2">{capitalize(category)}</h2>
            <ul className="card space-y-0.5 p-2">
              {group.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-xl px-2 py-2">
                  <form action={toggleItem} className="pt-0.5">
                    <HiddenInputs ctx={ctx} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      disabled={!canEdit}
                      aria-label={`Marcar ${item.name} como comprado`}
                      className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-border transition-colors hover:border-primary disabled:opacity-40"
                    />
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug">{item.name}</p>
                    {item.quantity || item.notes ? (
                      <p className="text-[12px] text-muted">
                        {[item.quantity, item.notes].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <ConfirmForm action={deleteItem} message={`Apagar “${item.name}”?`}>
                      <HiddenInputs ctx={ctx} />
                      <input type="hidden" name="item_id" value={item.id} />
                      <button type="submit" className="btn-ghost btn-sm" aria-label={`Apagar ${item.name}`}>
                        ✕
                      </button>
                    </ConfirmForm>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}

      {bought.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Comprados · {bought.length}</h2>
            {canEdit ? (
              <ConfirmForm action={clearBought} message="Remover todos os artigos já comprados?">
                <HiddenInputs ctx={ctx} />
                <button type="submit" className="btn-ghost btn-sm">
                  Limpar
                </button>
              </ConfirmForm>
            ) : null}
          </div>
          <ul className="card space-y-0.5 p-2 opacity-70">
            {bought.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <form action={toggleItem}>
                  <HiddenInputs ctx={ctx} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    aria-label={`Repor ${item.name} na lista`}
                    className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-primary bg-primary text-onprimary disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                      <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
                <span className="min-w-0 flex-1 truncate text-[15px] line-through">{item.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
