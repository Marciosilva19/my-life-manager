import { Field, Input, Row, Select } from "@/components/ui/Field";
import { todayISO } from "@/lib/dates";
import type { Bill } from "@/lib/types";

export default function BillFields({ bill }: { bill?: Bill }) {
  return (
    <>
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required maxLength={120} defaultValue={bill?.name} placeholder="Renda, eletricidade…" />
      </Field>

      <Row>
        <Field label="Valor (€)" htmlFor="amount">
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            title="Usa números, com até duas casas decimais (ex.: 42,90)"
            defaultValue={bill ? String(bill.amount).replace(".", ",") : ""}
          />
        </Field>
        <Field label="Vencimento" htmlFor="due_date">
          <Input id="due_date" type="date" name="due_date" required defaultValue={bill?.due_date ?? todayISO()} />
        </Field>
      </Row>

      <Field label="Recorrência" htmlFor="recurrence">
        <Select id="recurrence" name="recurrence" defaultValue={bill?.recurrence ?? "monthly"}>
          <option value="none">Só uma vez</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
          <option value="yearly">Anual</option>
        </Select>
      </Field>
    </>
  );
}
