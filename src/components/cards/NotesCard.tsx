import CardShell from "./CardShell";
import { timeLeft } from "@/lib/dates";
import type { Note } from "@/lib/types";

export default function NotesCard({ slug, notes }: { slug: string; notes: Note[] }) {
  return (
    <CardShell title="Notas temporárias" href={`/w/${slug}/notas`}>
      {notes.length === 0 ? (
        <p className="py-2 text-[14px] text-muted">Sem notas ativas.</p>
      ) : (
        <ul className="space-y-2">
          {notes.slice(0, 4).map((note) => (
            <li key={note.id} className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[14px] font-medium">{note.title}</p>
                <span className="shrink-0 text-[12px] text-primaryInk">{timeLeft(note.expires_at)}</span>
              </div>
              {note.body ? <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{note.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
