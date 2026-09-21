import CardShell from "./CardShell";
import { toggleBillPaid } from "@/lib/actions/finance";
import { relativeDay } from "@/lib/dates";
import { money } from "@/lib/format";
import { billStatus } from "@/lib/domain";
import type { Bill } from "@/lib/types";

export const statusChip: Record<string, { label: string; className: string }> = {
  vencida: { label: "Vencida", className: "bg-danger/12 text-danger" },
  hoje: { label: "Vence hoje", className: "bg-warning/15 text-warning" },
  proxima: { label: "Esta semana", className: "bg-primarySoft text-primaryInk" },
  futura: { label: "Agendada", className: "bg-surface2 text-muted" },
  paga: { label: "Paga", className: "bg-success/12 text-success" },
};

export default function BillCard({
  slug,
  bill,
  due,
}: {
  slug: string;
  bill: Bill | null;
  due: string | null;
}) {
  const status = billStatus(due);
  const chip = statusChip[status];

  return (
    <CardShell title="Próxima conta" href={`/w/${slug}/financas`}>
      {!bill || !due ? (
        <p className="py-2 text-[14px] text-muted">Não há contas por pagar. 🎉</p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium">{bill.name}</p>
            <p className="text-[13px] text-muted">
              {money(bill.amount)} · {relativeDay(due)}
            </p>
            <span className={`chip mt-1.5 ${chip.className}`}>{chip.label}</span>
          </div>
          <form action={toggleBillPaid}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={bill.id} />
            <input type="hidden" name="due" value={due} />
            <button type="submit" className="btn-soft btn-sm">
              Marcar paga
            </button>
          </form>
        </div>
      )}
    </CardShell>
  );
}
