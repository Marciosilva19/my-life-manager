import { Field, Input, Row, Select, Textarea } from "@/components/ui/Field";
import { FINANCE_CATEGORIES, type Transaction } from "@/lib/types";
import { capitalize } from "@/lib/format";
import { todayISO } from "@/lib/dates";

export default function TransactionFields({
  transaction,
  defaultType = "expense",
}: {
  transaction?: Transaction;
  defaultType?: "income" | "expense";
}) {
  return (
    <>
      <Row>
        <Field label="Tipo" htmlFor="type">
          <Select id="type" name="type" defaultValue={transaction?.type ?? defaultType}>
            <option value="expense">Despesa</option>
            <option value="income">Rendimento</option>
          </Select>
        </Field>
        <Field label="Valor (€)" htmlFor="amount">
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            title="Usa números, com até duas casas decimais (ex.: 12,50)"
            defaultValue={transaction ? String(transaction.amount).replace(".", ",") : ""}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Categoria" htmlFor="category">
          <Select id="category" name="category" defaultValue={transaction?.category ?? "alimentação"}>
            {FINANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data" htmlFor="date">
          <Input id="date" type="date" name="date" required defaultValue={transaction?.date ?? todayISO()} />
        </Field>
      </Row>

      <Field label="Descrição (opcional)" htmlFor="description">
        <Textarea id="description" name="description" rows={2} defaultValue={transaction?.description ?? ""} />
      </Field>

      <Field label="Recorrência" htmlFor="recurrence" hint="Serve para te lembrares: não são criados movimentos automáticos.">
        <Select id="recurrence" name="recurrence" defaultValue={transaction?.recurrence ?? "none"}>
          <option value="none">Movimento único</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
          <option value="yearly">Anual</option>
        </Select>
      </Field>
    </>
  );
}
