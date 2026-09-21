import Link from "next/link";
import FormSheet from "@/components/ui/FormSheet";
import TaskFields from "@/components/forms/TaskFields";
import TasksCard from "@/components/cards/TasksCard";
import NextCard from "@/components/cards/NextCard";
import FinanceCard from "@/components/cards/FinanceCard";
import BillCard from "@/components/cards/BillCard";
import ShoppingCard from "@/components/cards/ShoppingCard";
import NotesCard from "@/components/cards/NotesCard";
import { createTask } from "@/lib/actions/tasks";
import { seedDemo } from "@/lib/actions/workspace";
import {
  getBills,
  getEvents,
  getItemsForLists,
  getLists,
  getNotes,
  getTasks,
  getTransactions,
  getWorkspace,
  resolveSettings,
} from "@/lib/data";
import { bucketTasks, isDoneOn, monthSummary, nextCommitment, nextDue } from "@/lib/domain";
import { formatDayLong, formatMonthYear, monthKey, nowTime, todayISO } from "@/lib/dates";
import type { CardId } from "@/lib/types";

export const dynamic = "force-dynamic";

function greeting(now: string) {
  const hour = Number(now.slice(0, 2));
  if (hour < 6) return "Boa madrugada";
  if (hour < 13) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}

function progressMessage(done: number, total: number) {
  if (total === 0) return "Hoje está livre de tarefas.";
  if (done === 0) return `${total} ${total === 1 ? "tarefa" : "tarefas"} para hoje. Um passo de cada vez.`;
  if (done === total) return "Tudo feito por hoje. Bom trabalho ✨";
  return `${done} de ${total} concluídas — estás a meio caminho.`;
}

export default async function TodayPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const settings = resolveSettings(workspace.settings);

  const [tasks, events, transactions, bills, lists, notes] = await Promise.all([
    getTasks(workspace.id),
    getEvents(workspace.id),
    getTransactions(workspace.id),
    getBills(workspace.id),
    getLists(workspace.id),
    getNotes(workspace.id),
  ]);
  const items = await getItemsForLists(lists.map((l) => l.id));

  const today = todayISO();
  const now = nowTime();
  const buckets = bucketTasks(tasks, today);
  const todayEntries = buckets.hoje;
  const doneCount = todayEntries.filter(({ task }) => isDoneOn(task, today)).length;

  const summary = monthSummary(transactions, monthKey(today));
  const upcomingBills = bills
    .map((bill) => ({ bill, due: nextDue(bill, today) }))
    .filter((b) => b.due)
    .sort((a, b) => a.due!.localeCompare(b.due!));

  const firstList = lists[0] ?? null;
  const listItems = firstList ? items.filter((i) => i.list_id === firstList.id) : [];
  const isEmpty =
    tasks.length === 0 &&
    events.length === 0 &&
    transactions.length === 0 &&
    bills.length === 0 &&
    lists.length === 0 &&
    notes.length === 0;

  const cardNodes: Record<CardId, React.ReactNode> = {
    tarefas: <TasksCard slug={ws} today={today} entries={todayEntries} />,
    proximo: <NextCard slug={ws} next={nextCommitment(events, tasks, today, now)} />,
    financas: (
      <FinanceCard
        slug={ws}
        monthLabel={formatMonthYear(today)}
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
      />
    ),
    conta: <BillCard slug={ws} bill={upcomingBills[0]?.bill ?? null} due={upcomingBills[0]?.due ?? null} />,
    compras: <ShoppingCard slug={ws} list={firstList} items={listItems} />,
    notas: <NotesCard slug={ws} notes={notes} />,
  };

  return (
    <main>
      <header className="mb-5">
        <p className="text-[13px] text-muted">{formatDayLong(today)}</p>
        <h1 className="mt-0.5">
          {greeting(now)}
          {workspace.name && workspace.name !== "A minha vida" ? `, ${workspace.name}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-primaryInk">{progressMessage(doneCount, todayEntries.length)}</p>
      </header>

      {isEmpty ? (
        <section className="card mb-5 animate-riseIn">
          <h2 className="mb-1">Começar com calma</h2>
          <p className="mb-4 text-[14px] leading-relaxed text-muted">
            Podes adicionar as tuas coisas uma a uma ou experimentar com dados de exemplo para veres a app preenchida.
            Os exemplos podem ser apagados a qualquer momento nas Definições.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={seedDemo} className="sm:flex-1">
              <input type="hidden" name="slug" value={ws} />
              <button type="submit" className="btn-primary w-full">
                Experimentar com dados de exemplo
              </button>
            </form>
            <Link href={`/w/${ws}/tarefas`} className="btn-outline sm:flex-1">
              Criar a primeira tarefa
            </Link>
          </div>
        </section>
      ) : null}

      <div className="space-y-4">
        {settings.cards.filter((c) => c.visible).map((c) => (
          <div key={c.id}>{cardNodes[c.id]}</div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <FormSheet
          trigger="+ Nova tarefa"
          triggerClassName="btn-primary w-full sm:flex-1"
          title="Nova tarefa"
          action={createTask}
          hidden={{ slug: ws }}
          submitLabel="Adicionar tarefa"
        >
          <TaskFields defaultDate={today} />
        </FormSheet>
        <Link href={`/w/${ws}/definicoes`} className="btn-outline w-full sm:w-auto">
          Personalizar cartões
        </Link>
      </div>
    </main>
  );
}
