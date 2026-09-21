import CopyButton from "@/components/CopyButton";
import ConfirmForm from "@/components/ui/ConfirmForm";
import { createShareLink, revokeShareLink } from "@/lib/actions/shopping";

export default function ShareBox({
  slug,
  listId,
  url,
}: {
  slug: string;
  listId: string;
  url: string | null;
}) {
  return (
    <section className="card">
      <h2 className="mb-1 text-[16px]">Partilhar esta lista</h2>

      {url ? (
        <>
          <p className="mb-3 text-[13px] leading-relaxed text-muted">
            Qualquer pessoa com este link <strong className="text-text">pode ver e editar esta lista</strong>, sem criar
            conta. Não tem acesso a tarefas, calendário, finanças nem às outras listas.
          </p>
          <p className="mb-3 break-all rounded-xl bg-surface2 px-3 py-2.5 text-[12px] text-muted">{url}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={url} label="Copiar link" className="btn-soft btn-sm" />
            <ConfirmForm
              action={revokeShareLink}
              message="Desativar este link? Quem o tiver deixa de conseguir abrir a lista."
            >
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="list_id" value={listId} />
              <button type="submit" className="btn-ghost btn-sm">
                Desativar link
              </button>
            </ConfirmForm>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-[13px] leading-relaxed text-muted">
            Gera um link privado para partilhares esta lista. Quem o receber pode ver e editar os artigos desta lista —
            e apenas desta lista.
          </p>
          <form action={createShareLink}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="list_id" value={listId} />
            <button type="submit" className="btn-soft btn-sm">
              Gerar link de partilha
            </button>
          </form>
        </>
      )}
    </section>
  );
}
