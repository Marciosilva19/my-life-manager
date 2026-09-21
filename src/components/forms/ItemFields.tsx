import { Field, Input, Row, Select, Textarea } from "@/components/ui/Field";
import { SHOPPING_CATEGORIES } from "@/lib/types";
import { capitalize } from "@/lib/format";

export default function ItemFields() {
  return (
    <>
      <Field label="Artigo" htmlFor="name">
        <Input id="name" name="name" required maxLength={120} placeholder="Ex.: arroz" autoComplete="off" />
      </Field>

      <Row>
        <Field label="Quantidade (opcional)" htmlFor="quantity">
          <Input id="quantity" name="quantity" maxLength={40} placeholder="2 kg, 3 un…" />
        </Field>
        <Field label="Categoria" htmlFor="category">
          <Select id="category" name="category" defaultValue="outros">
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <Field label="Notas (opcional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} placeholder="Marca preferida, alternativa…" />
      </Field>
    </>
  );
}
