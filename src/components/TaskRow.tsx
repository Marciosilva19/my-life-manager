import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import TaskFields from "@/components/forms/TaskFields";
import { deleteTask, toggleTask, updateTask } from "@/lib/actions/tasks";
import { hhmm, relativeDay } from "@/lib/dates";
import { capitalize } from "@/lib/format";
import { isDoneOn, type TaskBucket } from "@/lib/domain";
import type { Task } from "@/lib/types";

const priorityDot: Record<Task["priority"], string> = {
  alta: "bg-danger",
  media: "bg-warning",
  baixa: "bg-muted/60",
};

const priorityLabel: Record<Task["priority"], string> = {
  alta: "Prioridade alta",
  media: "Prioridade média",
  baixa: "Prioridade baixa",
};

export default function TaskRow({
  task,
  slug,
  date,
  bucket = "hoje",
  compact = false,
}: {
  task: Task;
  slug: string;
  date: string | null;
  bucket?: TaskBucket;
  compact?: boolean;
}) {
  const refDate = date ?? task.due_date ?? "";
  const done = refDate ? isDoneOn(task, refDate) : false;
  const showDate = bucket !== "hoje";

  return (
    <li
      className={`flex items-start gap-3 rounded-xl px-2 py-2 transition-opacity ${
        done ? "opacity-55" : ""
      } ${compact ? "" : "hover:bg-surface2/70"}`}
    >
      <form action={toggleTask} className="pt-0.5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="date" value={refDate} />
        <button
          type="submit"
          aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
          aria-pressed={done}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            done ? "border-primary bg-primary text-onprimary" : "border-border hover:border-primary"
          }`}
        >
          {done ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-snug ${done ? "line-through" : ""}`}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
          <span className={`inline-block h-2 w-2 rounded-full ${priorityDot[task.priority]}`} title={priorityLabel[task.priority]} />
          <span className="sr-only">{priorityLabel[task.priority]}</span>
          {task.due_time ? <span>{hhmm(task.due_time)}</span> : null}
          {showDate && refDate ? <span>{relativeDay(refDate)}</span> : null}
          <span>{capitalize(task.category)}</span>
          {task.recurrence !== "none" ? <span aria-label="Tarefa repetida">↻</span> : null}
        </div>
        {task.description && !compact ? (
          <p className="mt-1 text-[13px] leading-snug text-muted">{task.description}</p>
        ) : null}
      </div>

      {compact ? null : (
        <div className="flex shrink-0 items-center gap-1">
          <FormSheet
            trigger="Editar"
            triggerClassName="btn-ghost btn-sm"
            title="Editar tarefa"
            action={updateTask}
            hidden={{ slug, id: task.id }}
            submitLabel="Guardar alterações"
          >
            <TaskFields task={task} />
          </FormSheet>

          <ConfirmForm action={deleteTask} message={`Apagar a tarefa “${task.title}”?`}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={task.id} />
            <button type="submit" className="btn-ghost btn-sm" aria-label={`Apagar ${task.title}`}>
              ✕
            </button>
          </ConfirmForm>
        </div>
      )}
    </li>
  );
}
