import PageHeader from "@/components/PageHeader";
import CalendarView from "@/components/calendar/CalendarView";
import { getEvents, getTasks, getWorkspace, resolveSettings } from "@/lib/data";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const settings = resolveSettings(workspace.settings);
  const [events, tasks] = await Promise.all([getEvents(workspace.id), getTasks(workspace.id)]);

  return (
    <main>
      <PageHeader title="Calendário" subtitle="Horário semanal e compromissos" />
      <CalendarView slug={ws} events={events} tasks={tasks} weekStart={settings.weekStart} today={todayISO()} />
      <p className="mt-5 text-center text-[12px] leading-relaxed text-muted">
        A vista de semana é o teu horário: toca num dia para ver o detalhe e nos botões Dia / Semana / Mês para aproximar
        ou afastar.
      </p>
    </main>
  );
}
