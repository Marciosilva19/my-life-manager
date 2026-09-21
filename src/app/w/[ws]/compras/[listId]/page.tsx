import Link from "next/link";
import { notFound } from "next/navigation";
import ListBody from "@/components/shopping/ListBody";
import ShareBox from "@/components/shopping/ShareBox";
import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import { Field, Input } from "@/components/ui/Field";
import { deleteList, renameList } from "@/lib/actions/shopping";
import { getActiveShare, getItems, getLists, getWorkspace } from "@/lib/data";
import { getOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ ws: string; listId: string }>;
}) {
  const { ws, listId } = await params;
  const workspace = await getWorkspace(ws);
  const lists = await getLists(workspace.id);
  const list = lists.find((l) => l.id === listId);
  if (!list) notFound();

  const [items, share, origin] = await Promise.all([getItems(list.id), getActiveShare(list.id), getOrigin()]);
  const shareUrl = share ? `${origin}/lista/${share.token}` : null;

  return (
    <main>
      <Link href={`/w/${ws}/compras`} className="mb-3 inline-block text-[13px] text-muted">
        ‹ Todas as listas
      </Link>

      <header className="mb-5 flex items-start justify-between gap-3">
        <h1>{list.name}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <FormSheet
            trigger="Editar"
            triggerClassName="btn-ghost btn-sm"
            title="Renomear lista"
            action={renameList}
            hidden={{ slug: ws, list_id: list.id }}
            submitLabel="Guardar"
          >
            <Field label="Nome da lista" htmlFor="name">
              <Input id="name" name="name" required maxLength={80} defaultValue={list.name} />
            </Field>
          </FormSheet>
          <ConfirmForm action={deleteList} message={`Apagar a lista “${list.name}” e todos os seus artigos?`}>
            <input type="hidden" name="slug" value={ws} />
            <input type="hidden" name="list_id" value={list.id} />
            <button type="submit" className="btn-ghost btn-sm" aria-label="Apagar lista">
              ✕
            </button>
          </ConfirmForm>
        </div>
      </header>

      <ListBody ctx={{ slug: ws, listId: list.id }} items={items} />

      <div className="mt-6">
        <ShareBox slug={ws} listId={list.id} url={shareUrl} />
      </div>
    </main>
  );
}
