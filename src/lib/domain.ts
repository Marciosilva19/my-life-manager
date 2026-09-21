import { addDays, addMonths, daysBetween, parseISO, todayISO, weekdayOf } from "./dates";
import type { Bill, CalendarEvent, Task, Transaction } from "./types";

/* ------------------------------------------------------------------ tarefas */

/** A tarefa acontece na data indicada? */
export function occursOn(task: Task, iso: string): boolean {
  const start = task.due_date;
  switch (task.recurrence) {
    case "none":
      return start === iso;
    case "daily":
      return !start || iso >= start;
    case "weekly":
      return Boolean(start) && iso >= start! && weekdayOf(iso) === weekdayOf(start!);
    case "monthly":
      return Boolean(start) && iso >= start! && parseISO(iso).getDate() === parseISO(start!).getDate();
    case "weekdays":
      return (!start || iso >= start) && task.recurrence_days.includes(weekdayOf(iso));
    default:
      return false;
  }
}

export const isDoneOn = (task: Task, iso: string) => task.completed_dates.includes(iso);

/** Uma tarefa sem recorrência e já concluída considera-se arrumada. */
export const isArchived = (task: Task) =>
  task.recurrence === "none" && task.completed_dates.length > 0 && (!task.due_date || task.due_date < todayISO());

/** Próxima ocorrência a partir de uma data (procura até `horizon` dias). */
export function nextOccurrence(task: Task, fromISO = todayISO(), horizon = 370): string | null {
  if (task.recurrence === "none") return task.due_date && task.due_date >= fromISO ? task.due_date : null;
  for (let i = 0; i <= horizon; i++) {
    const iso = addDays(fromISO, i);
    if (occursOn(task, iso)) return iso;
  }
  return null;
}

export type TaskBucket = "hoje" | "semana" | "tarde" | "atrasadas";

/** Organiza as tarefas em Hoje / Esta semana / Mais tarde (+ atrasadas). */
export function bucketTasks(tasks: Task[], today = todayISO()) {
  const buckets: Record<TaskBucket, { task: Task; date: string | null }[]> = {
    atrasadas: [],
    hoje: [],
    semana: [],
    tarde: [],
  };

  for (const task of tasks) {
    if (occursOn(task, today)) {
      buckets.hoje.push({ task, date: today });
      continue;
    }
    if (task.recurrence === "none" && task.due_date && task.due_date < today && !isDoneOn(task, task.due_date)) {
      buckets.atrasadas.push({ task, date: task.due_date });
      continue;
    }
    if (isArchived(task)) continue;

    const next = nextOccurrence(task, addDays(today, 1));
    if (next && daysBetween(today, next) <= 7) buckets.semana.push({ task, date: next });
    else buckets.tarde.push({ task, date: next });
  }

  const byTime = (a: { task: Task; date: string | null }, b: { task: Task; date: string | null }) => {
    if (a.date !== b.date) return (a.date ?? "9999").localeCompare(b.date ?? "9999");
    return (a.task.due_time ?? "99:99").localeCompare(b.task.due_time ?? "99:99");
  };
  buckets.atrasadas.sort(byTime);
  buckets.hoje.sort(byTime);
  buckets.semana.sort(byTime);
  buckets.tarde.sort(byTime);
  return buckets;
}

/* ---------------------------------------------------------------- calendário */

export const eventOccursOn = (event: CalendarEvent, iso: string) =>
  event.repeats_weekly ? event.weekday === weekdayOf(iso) : event.date === iso;

export type AgendaEntry = {
  id: string;
  kind: "event" | "task";
  title: string;
  start: string;
  end: string | null;
  color: string;
  location?: string | null;
  notes?: string | null;
  done?: boolean;
  taskId?: string;
};

/** Compromissos + tarefas com hora de um dia, ordenados. */
export function agendaFor(iso: string, events: CalendarEvent[], tasks: Task[]): AgendaEntry[] {
  const fromEvents: AgendaEntry[] = events
    .filter((e) => eventOccursOn(e, iso))
    .map((e) => ({
      id: e.id,
      kind: "event" as const,
      title: e.title,
      start: e.start_time.slice(0, 5),
      end: e.end_time.slice(0, 5),
      color: e.color,
      location: e.location,
      notes: e.notes,
    }));

  const fromTasks: AgendaEntry[] = tasks
    .filter((t) => t.show_in_calendar && t.due_time && occursOn(t, iso))
    .map((t) => ({
      id: `task-${t.id}-${iso}`,
      kind: "task" as const,
      title: t.title,
      start: t.due_time!.slice(0, 5),
      end: null,
      color: "tarefa",
      done: isDoneOn(t, iso),
      taskId: t.id,
    }));

  return [...fromEvents, ...fromTasks].sort((a, b) => a.start.localeCompare(b.start));
}

/** Próximo compromisso a partir de agora (procura nos próximos 14 dias). */
export function nextCommitment(
  events: CalendarEvent[],
  tasks: Task[],
  today: string,
  now: string,
): { date: string; entry: AgendaEntry } | null {
  for (let i = 0; i < 14; i++) {
    const iso = addDays(today, i);
    const entries = agendaFor(iso, events, tasks);
    const found = entries.find((e) => (i > 0 || e.start >= now) && !e.done);
    if (found) return { date: iso, entry: found };
  }
  return null;
}

/* ------------------------------------------------------------------ finanças */

export function monthSummary(transactions: Transaction[], month: string) {
  let income = 0;
  let expense = 0;
  const byCategory: Record<string, number> = {};

  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue;
    const amount = Number(t.amount);
    if (t.type === "income") income += amount;
    else {
      expense += amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + amount;
    }
  }
  return { income, expense, balance: income - expense, byCategory };
}

/** Próximo vencimento por pagar de uma conta recorrente. */
export function nextDue(bill: Bill, from = todayISO()): string | null {
  if (bill.recurrence === "none") return bill.paid_dates.includes(bill.due_date) ? null : bill.due_date;

  let due = bill.due_date;
  let guard = 0;
  // recua enquanto estiver muito no passado sem estar pago
  while (due < from && guard < 400) {
    if (!bill.paid_dates.includes(due)) return due; // vencida e por pagar
    due = advance(due, bill.recurrence);
    guard++;
  }
  while (bill.paid_dates.includes(due) && guard < 400) {
    due = advance(due, bill.recurrence);
    guard++;
  }
  return due;
}

function advance(iso: string, recurrence: Bill["recurrence"]): string {
  if (recurrence === "weekly") return addDays(iso, 7);
  if (recurrence === "yearly") return addMonths(iso, 12);
  return addMonths(iso, 1);
}

export type BillStatus = "vencida" | "hoje" | "proxima" | "futura" | "paga";

export function billStatus(dueISO: string | null, today = todayISO()): BillStatus {
  if (!dueISO) return "paga";
  const diff = daysBetween(today, dueISO);
  if (diff < 0) return "vencida";
  if (diff === 0) return "hoje";
  if (diff <= 7) return "proxima";
  return "futura";
}
