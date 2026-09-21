import PageHeader from "@/components/PageHeader";
import TaskRow from "@/components/TaskRow";
import EmptyState from "@/components/ui/EmptyState";
import FormSheet from "@/components/ui/FormSheet";
import TaskFields from "@/components/forms/TaskFields";
import { createTask } from "@/lib/actions/tasks";
import { getTasks, getWorkspace } from "@/lib/data";
import { bucketTasks, isDoneOn, type TaskBucket } from "@/lib/domain";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

const GROUPS: { key: TaskBucket; title: string; hint?: string }[] = [
  { key: "atrasadas", title: "Em atraso" },
  { key: "hoje", title: "Hoje" },
  { key: "semana", title: "Esta semana" },
  { key: "tarde", title: "Mais tarde" },
];

export default async function TasksPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const tasks = await getTasks(workspace.id);
  const today = todayISO();
  const buckets = bucketTasks(tasks, today);

  const totalToday = buckets.hoje.length;
  const doneToday = buckets.hoje.filter(({ task }) => isDoneOn(task, today)).length;
  const hasAny = GROUPS.some((g) => buckets[g.key].length > 0);

  return (
    <main>
      <PageHeader
        title="Tarefas"
        subtitle={totalToday ? `${doneToday} de ${totalToday} concluídas hoje` : "Sem tarefas para hoje"}
        action={
          <FormSheet
            trigger="+ Nova"
            triggerClassName="btn-primary btn-sm"
            title="Nova tarefa"
            action={createTask}
            hidden={{ slug: ws }}
            submitLabel="Adicionar tarefa"
          >
            <TaskFields defaultDate={today} />
          </FormSheet>
        }
      />

      {!hasAny ? (
        <EmptyState
          emoji="🌿"
          title="Ainda não há tarefas"
          hint="Começa por acrescentar algo pequeno que queiras tirar da cabeça hoje."
        />
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const entries = buckets[group.key];
            if (entries.length === 0) return null;
            return (
              <section key={group.key}>
                <h2 className="section-title mb-2">
                  {group.title} <span className="font-normal normal-case text-muted/80">· {entries.length}</span>
                </h2>
                <ul className="card space-y-0.5 p-2">
                  {entries.map(({ task, date }) => (
                    <TaskRow key={`${task.id}-${date}`} task={task} slug={ws} date={date} bucket={group.key} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        As tarefas concluídas ficam visíveis de forma discreta até ao fim do dia.
      </p>
    </main>
  );
}
