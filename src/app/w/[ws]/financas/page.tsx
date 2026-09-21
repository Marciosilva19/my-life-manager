import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import TransactionFields from "@/components/forms/TransactionFields";
import BillFields from "@/components/forms/BillFields";
import { Field, Input, Select } from "@/components/ui/Field";
import { statusChip } from "@/components/cards/BillCard";
import {
  createBill,
  createTransaction,
  deleteBill,
  deleteTransaction,
  saveBudget,
  toggleBillPaid,
  updateBill,
  updateTransaction,
} from "@/lib/actions/finance";
import { getBills, getBudgets, getTransactions, getWorkspace } from "@/lib/data";
import { billStatus, monthSummary, nextDue } from "@/lib/domain";
import { addMonths, formatDayShort, formatMonthYear, monthKey, relativeDay, todayISO } from "@/lib/dates";
import { capitalize, money } from "@/lib/format";
import { FINANCE_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { ws } = await params;
  const { m } = await searchParams;
  const workspace = await getWorkspace(ws);

  const today = todayISO();
  const month = /^\d{4}-\d{2}$/.test(m ?? "") ? m! : monthKey(today);
  const monthAnchor = `${month}-01`;

  const [transactions, budgets, bills] = await Promise.all([
    getTransactions(workspace.id),
    getBudgets(workspace.id),
    getBills(workspace.id),
  ]);

  const summary = monthSummary(transactions, month);
  const monthTransactions = transactions.filter((t) => t.date.startsWith(month));

  const billRows = bills
    .map((bill) => ({ bill, due: nextDue(bill, today) }))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  const alerts = billRows.filter(({ due }) => due && billStatus(due, today) !== "futura");

  return (
    <main>
      <PageHeader
        title="Finanças"
        subtitle="Privado a esta área. Nunca é incluído nos links de compras."
        action={
          <FormSheet
            trigger="+ Movimento"
            triggerClassName="btn-primary btn-sm"
            title="Novo movimento"
            action={createTransaction}
            hidden={{ slug: ws }}
            submitLabel="Registar"
          >
            <TransactionFields />
          </FormSheet>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`?m=${monthKey(addMonths(monthAnchor, -1))}`} className="btn-ghost btn-sm" aria-label="Mês anterior">
          ‹
        </Link>
        <p className="text-[15px] font-medium first-letter:uppercase">{formatMonthYear(monthAnchor)}</p>
        <Link href={`?m=${monthKey(addMonths(monthAnchor, 1))}`} className="btn-ghost btn-sm" aria-label="Mês seguinte">
          ›
        </Link>
      </div>

      <section className="card mb-4">
        <p className="text-[12px] uppercase tracking-wide text-muted">Disponível no mês</p>
        <p className={`text-[30px] font-semibold tracking-[-0.02em] ${summary.balance < 0 ? "text-danger" : ""}`}>
          {money(summary.balance)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
          <div className="rounded-xl bg-surface2 px-3 py-2.5">
            <p className="text-[12px] text-muted">Recebido</p>
            <p className="font-medium text-success">{money(summary.income)}</p>
          </div>
          <div className="rounded-xl bg-surface2 px-3 py-2.5">
            <p className="text-[12px] text-muted">Gasto</p>
            <p className="font-medium">{money(summary.expense)}</p>
          </div>
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="mb-5 space-y-2" aria-label="Avisos de contas">
          {alerts.map(({ bill, due }) => {
            const status = billStatus(due, today);
            return (
              <div
                key={bill.id}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[14px] ${
                  status === "vencida" ? "bg-danger/10 text-danger" : "bg-warning/12 text-warning"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {bill.name} · {money(bill.amount)}
                  </p>
                  <p className="text-[13px] opacity-90">
                    {status === "vencida" ? "Venceu " : "Vence "}
                    {relativeDay(due!, today).toLowerCase()}
                  </p>
                </div>
                <form action={toggleBillPaid}>
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="id" value={bill.id} />
                  <input type="hidden" name="due" value={due!} />
                  <button type="submit" className="btn-outline btn-sm">
                    Pagar
                  </button>
                </form>
              </div>
            );
          })}
        </section>
      ) : null}

      {/* ------------------------------------------------ contas a pagar */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Contas a pagar</h2>
          <FormSheet
            trigger="+ Conta"
            triggerClassName="btn-ghost btn-sm"
            title="Nova conta"
            action={createBill}
            hidden={{ slug: ws }}
            submitLabel="Guardar conta"
          >
            <BillFields />
          </FormSheet>
        </div>

        {billRows.length === 0 ? (
          <EmptyState emoji="🧾" title="Sem contas registadas" hint="Adiciona a renda, a luz ou as subscrições para receberes avisos." />
        ) : (
          <ul className="card space-y-1 p-2">
            {billRows.map(({ bill, due }) => {
              const chip = statusChip[billStatus(due, today)];
              return (
                <li key={bill.id} className="flex flex-wrap items-center gap-2 rounded-xl px-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px]">{bill.name}</p>
                    <p className="text-[12px] text-muted">
                      {money(bill.amount)} · {due ? formatDayShort(due) : "sem vencimentos por pagar"}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${chip.className}`}>{chip.label}</span>
                  <div className="ml-auto flex items-center gap-1">
                  {due ? (
                    <form action={toggleBillPaid}>
                      <input type="hidden" name="slug" value={ws} />
                      <input type="hidden" name="id" value={bill.id} />
                      <input type="hidden" name="due" value={due} />
                      <button type="submit" className="btn-soft btn-sm" aria-label={`Marcar ${bill.name} como paga`}>
                        ✓
                      </button>
                    </form>
                  ) : null}
                  <FormSheet
                    trigger="Editar"
                    triggerClassName="btn-ghost btn-sm"
                    title="Editar conta"
                    action={updateBill}
                    hidden={{ slug: ws, id: bill.id }}
                    submitLabel="Guardar alterações"
                  >
                    <BillFields bill={bill} />
                  </FormSheet>
                  <ConfirmForm action={deleteBill} message={`Apagar a conta “${bill.name}”?`}>
                    <input type="hidden" name="slug" value={ws} />
                    <input type="hidden" name="id" value={bill.id} />
                    <button type="submit" className="btn-ghost btn-sm" aria-label={`Apagar ${bill.name}`}>
                      ✕
                    </button>
                  </ConfirmForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------- orçamentos */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Orçamento mensal</h2>
          <FormSheet
            trigger="Definir"
            triggerClassName="btn-ghost btn-sm"
            title="Orçamento por categoria"
            description="Define quanto queres gastar por mês. Coloca 0 € para remover."
            action={saveBudget}
            hidden={{ slug: ws }}
            submitLabel="Guardar orçamento"
          >
            <Field label="Categoria" htmlFor="category">
              <Select id="category" name="category" defaultValue="alimentação">
                {FINANCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {capitalize(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor mensal (€)" htmlFor="amount">
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                required
                placeholder="0,00"
                pattern="[0-9]+([.,][0-9]{1,2})?"
                title="Usa números, com até duas casas decimais"
              />
            </Field>
          </FormSheet>
        </div>

        {budgets.length === 0 ? (
          <EmptyState emoji="🎯" title="Sem orçamentos definidos" hint="Um limite por categoria ajuda a perceber onde o dinheiro vai." />
        ) : (
          <ul className="card space-y-3">
            {budgets
              .slice()
              .sort((a, b) => a.category.localeCompare(b.category))
              .map((budget) => {
                const spent = summary.byCategory[budget.category] ?? 0;
                const ratio = budget.amount > 0 ? Math.min(spent / budget.amount, 1) : 0;
                const over = spent > budget.amount;
                return (
                  <li key={budget.id}>
                    <div className="mb-1 flex items-baseline justify-between text-[14px]">
                      <span>{capitalize(budget.category)}</span>
                      <span className={over ? "text-danger" : "text-muted"}>
                        {money(spent)} / {money(budget.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className={`h-full rounded-full ${over ? "bg-danger" : "bg-primary"}`}
                        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------- movimentos */}
      <section>
        <h2 className="section-title mb-2">Movimentos de {formatMonthYear(monthAnchor)}</h2>
        {monthTransactions.length === 0 ? (
          <EmptyState emoji="💶" title="Ainda sem movimentos este mês" hint="Regista uma despesa ou um rendimento para começar." />
        ) : (
          <ul className="card space-y-0.5 p-2">
            {monthTransactions.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl px-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">{t.description || capitalize(t.category)}</p>
                  <p className="text-[12px] text-muted">
                    {formatDayShort(t.date)} · {capitalize(t.category)}
                    {t.recurrence !== "none" ? " · ↻" : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-[15px] font-medium ${t.type === "income" ? "text-success" : ""}`}>
                  {t.type === "income" ? "+" : "−"}
                  {money(t.amount)}
                </span>
                <div className="ml-auto flex items-center gap-1">
                <FormSheet
                  trigger="Editar"
                  triggerClassName="btn-ghost btn-sm"
                  title="Editar movimento"
                  action={updateTransaction}
                  hidden={{ slug: ws, id: t.id }}
                  submitLabel="Guardar alterações"
                >
                  <TransactionFields transaction={t} />
                </FormSheet>
                <ConfirmForm action={deleteTransaction} message="Apagar este movimento?">
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="btn-ghost btn-sm" aria-label="Apagar movimento">
                    ✕
                  </button>
                </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
