import CardShell from "./CardShell";
import { relativeDay } from "@/lib/dates";
import type { AgendaEntry } from "@/lib/domain";

export default function NextCard({
  slug,
  next,
}: {
  slug: string;
  next: { date: string; entry: AgendaEntry } | null;
}) {
  return (
    <CardShell title="Próximo compromisso" href={`/w/${slug}/calendario`}>
      {!next ? (
        <p className="py-2 text-[14px] text-muted">Sem compromissos nos próximos dias.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primarySoft px-3.5 py-2.5 text-center">
            <p className="text-[18px] font-semibold leading-none text-primaryInk">{next.entry.start}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-primaryInk/80">{relativeDay(next.date)}</p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium">{next.entry.title}</p>
            <p className="text-[13px] text-muted">
              {next.entry.end ? `até às ${next.entry.end}` : "tarefa com hora"}
              {next.entry.location ? ` · ${next.entry.location}` : ""}
            </p>
          </div>
        </div>
      )}
    </CardShell>
  );
}
