import CardShell from "./CardShell";
import TaskRow from "@/components/TaskRow";
import type { Task } from "@/lib/types";

export default function TasksCard({
  slug,
  today,
  entries,
}: {
  slug: string;
  today: string;
  entries: { task: Task; date: string | null }[];
}) {
  return (
    <CardShell title="Tarefas de hoje" href={`/w/${slug}/tarefas`}>
      {entries.length === 0 ? (
        <p className="py-2 text-[14px] text-muted">Nada marcado para hoje. Aproveita o espaço livre.</p>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {entries.slice(0, 6).map(({ task }) => (
            <TaskRow key={task.id} task={task} slug={slug} date={today} compact />
          ))}
        </ul>
      )}
      {entries.length > 6 ? (
        <p className="mt-2 px-2 text-[12px] text-muted">e mais {entries.length - 6}…</p>
      ) : null}
    </CardShell>
  );
}
