import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import ExpiryInput from "./ExpiryInput";
import type { Task } from "@/lib/types";

export default function NoteFields({ tasks }: { tasks: Task[] }) {
  return (
    <>
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" required maxLength={120} placeholder="Ex.: cupão da livraria" autoComplete="off" />
      </Field>

      <Field label="Texto (opcional)" htmlFor="body">
        <Textarea id="body" name="body" placeholder="Código, morada, detalhe a lembrar…" />
      </Field>

      <ExpiryInput />

      <Field label="Ligar a uma tarefa (opcional)" htmlFor="task_id">
        <Select id="task_id" name="task_id" defaultValue="">
          <option value="">Sem ligação</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>
      </Field>

      <Checkbox
        name="confirm"
        required
        label={
          <>
            Compreendo que esta nota é <strong>apagada automaticamente</strong> quando a validade passar e que não pode
            ser recuperada.
          </>
        }
      />
    </>
  );
}
