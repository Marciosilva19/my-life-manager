import CardShell from "./CardShell";
import { toggleItem } from "@/lib/actions/shopping";
import type { ShoppingItem, ShoppingList } from "@/lib/types";

export default function ShoppingCard({
  slug,
  list,
  items,
}: {
  slug: string;
  list: ShoppingList | null;
  items: ShoppingItem[];
}) {
  const pending = items.filter((i) => !i.bought);

  return (
    <CardShell title="Lista de compras" href={`/w/${slug}/compras`}>
      {!list ? (
        <p className="py-2 text-[14px] text-muted">Ainda não criaste nenhuma lista.</p>
      ) : (
        <>
          <p className="mb-2 text-[12px] uppercase tracking-wide text-muted">{list.name}</p>
          {pending.length === 0 ? (
            <p className="py-1 text-[14px] text-muted">Tudo comprado nesta lista.</p>
          ) : (
            <ul className="space-y-1.5">
              {pending.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  <form action={toggleItem}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="list_id" value={list.id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      aria-label={`Marcar ${item.name} como comprado`}
                      className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-border hover:border-primary"
                    />
                  </form>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{item.name}</span>
                  {item.quantity ? <span className="text-[12px] text-muted">{item.quantity}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {pending.length > 5 ? (
            <p className="mt-2 text-[12px] text-muted">e mais {pending.length - 5} artigos…</p>
          ) : null}
        </>
      )}
    </CardShell>
  );
}
