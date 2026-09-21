import { Checkbox, Field, Input, Row, Select, Textarea } from "@/components/ui/Field";
import RecurrencePicker from "./RecurrencePicker";
import { TASK_CATEGORIES, type Task } from "@/lib/types";
import { capitalize } from "@/lib/format";
import { todayISO } from "@/lib/dates";

export default function TaskFields({ task, defaultDate }: { task?: Task; defaultDate?: string }) {
  return (
    <>
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" required maxLength={160} defaultValue={task?.title} placeholder="O que precisas de fazer?" />
      </Field>

      <Field label="Descrição (opcional)" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={task?.description ?? ""} placeholder="Detalhes úteis…" />
      </Field>

      <Row>
        <Field label="Data" htmlFor="due_date">
          <Input id="due_date" type="date" name="due_date" defaultValue={task?.due_date ?? defaultDate ?? todayISO()} />
        </Field>
        <Field label="Hora (opcional)" htmlFor="due_time">
          <Input id="due_time" type="time" name="due_time" defaultValue={task?.due_time?.slice(0, 5) ?? ""} />
        </Field>
      </Row>

      <Row>
        <Field label="Prioridade" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={task?.priority ?? "media"}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </Select>
        </Field>
        <Field label="Categoria" htmlFor="category">
          <Select id="category" name="category" defaultValue={task?.category ?? "pessoal"}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <RecurrencePicker defaultValue={task?.recurrence ?? "none"} defaultDays={task?.recurrence_days ?? []} />

      <Checkbox
        name="show_in_calendar"
        defaultChecked={task ? task.show_in_calendar : true}
        label="Mostrar no calendário quando tiver hora"
      />
    </>
  );
}
