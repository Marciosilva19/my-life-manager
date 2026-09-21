import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import NoteFields from "@/components/forms/NoteFields";
import { createNote, deleteNote } from "@/lib/actions/notes";
import { getNotes, getTasks, getWorkspace } from "@/lib/data";
import { formatDateTime, timeLeft, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "hoje", label: "Expira hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "todas", label: "Todas" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { ws } = await params;
  const { f } = await searchParams;
  const filter: FilterKey = FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "todas";

  const workspace = await getWorkspace(ws);
  const [notes, tasks] = await Promise.all([getNotes(workspace.id), getTasks(workspace.id)]);
  const today = todayISO();
  const taskTitles = new Map(tasks.map((t) => [t.id, t.title]));

  const endOfToday = new Date(`${today}T23:59:59`);
  const endOfWeek = new Date(endOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const filtered = notes.filter((note) => {
    const expires = new Date(note.expires_at);
    if (filter === "hoje") return expires <= endOfToday;
    if (filter === "semana") return expires <= endOfWeek;
    return true;
  });

  return (
    <main>
      <PageHeader
        title="Notas temporárias"
        subtitle="Desaparecem sozinhas quando deixam de fazer sentido"
        action={
          <FormSheet
            trigger="+ Nova"
            triggerClassName="btn-primary btn-sm"
            title="Nova nota temporária"
            description="A nota é apagada automaticamente na data e hora que escolheres."
            action={createNote}
            hidden={{ slug: ws }}
            submitLabel="Criar nota"
          >
            <NoteFields tasks={tasks} />
          </FormSheet>
        }
      />

      <nav className="mb-4 flex gap-2" aria-label="Filtrar notas">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={`?f=${item.key}`}
            aria-current={filter === item.key ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              filter === item.key ? "bg-primarySoft text-primaryInk" : "bg-surface2 text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="⏳"
          title={notes.length === 0 ? "Sem notas temporárias" : "Nada neste filtro"}
          hint="Úteis para cupões, prazos de inscrição e ideias que deixam de fazer sentido depois de uma data."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((note) => (
            <li key={note.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-medium">{note.title}</p>
                  {note.body ? <p className="mt-1 text-[14px] leading-relaxed text-muted">{note.body}</p> : null}
                  {note.task_id && taskTitles.has(note.task_id) ? (
                    <p className="mt-1.5 text-[12px] text-muted">Ligada a: {taskTitles.get(note.task_id)}</p>
                  ) : null}
                </div>
                <ConfirmForm action={deleteNote} message={`Apagar a nota “${note.title}”?`}>
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="id" value={note.id} />
                  <button type="submit" className="btn-ghost btn-sm" aria-label={`Apagar ${note.title}`}>
                    ✕
                  </button>
                </ConfirmForm>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-[12px] text-muted">
                <span className="chip bg-primarySoft text-primaryInk">Faltam {timeLeft(note.expires_at)}</span>
                <span>válida até {formatDateTime(note.expires_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        As notas expiradas são removidas da base de dados automaticamente.
      </p>
    </main>
  );
}
