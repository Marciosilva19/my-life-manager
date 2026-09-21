import CardShell from "./CardShell";
import { money } from "@/lib/format";

export default function FinanceCard({
  slug,
  monthLabel,
  income,
  expense,
  balance,
}: {
  slug: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}) {
  return (
    <CardShell title="Resumo do mês" href={`/w/${slug}/financas`}>
      <p className="mb-3 text-[12px] uppercase tracking-wide text-muted">{monthLabel}</p>
      <p className={`text-[26px] font-semibold tracking-[-0.02em] ${balance < 0 ? "text-danger" : ""}`}>
        {money(balance)}
      </p>
      <p className="text-[13px] text-muted">disponível este mês</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-xl bg-surface2 px-3 py-2">
          <p className="text-muted">Recebido</p>
          <p className="font-medium text-success">{money(income)}</p>
        </div>
        <div className="rounded-xl bg-surface2 px-3 py-2">
          <p className="text-muted">Gasto</p>
          <p className="font-medium">{money(expense)}</p>
        </div>
      </div>
    </CardShell>
  );
}
