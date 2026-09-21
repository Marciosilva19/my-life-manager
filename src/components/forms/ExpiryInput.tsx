"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";

/** Valor por omissão: hoje às 23:59, na hora do dispositivo. */
function defaultExpiry(): string {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Campo de validade. O valor visível está na hora local de quem usa a app e é
 * convertido para UTC no browser, para que o servidor guarde sempre o instante
 * certo, independentemente do fuso onde a app estiver alojada.
 */
export default function ExpiryInput({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? defaultExpiry());
  const parsed = new Date(value);
  const iso = Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();

  return (
    <Field label="Válida até" htmlFor="expires_at_local" hint="Depois desta data e hora a nota é apagada automaticamente.">
      <Input
        id="expires_at_local"
        name="expires_at_local"
        type="datetime-local"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input type="hidden" name="expires_at" value={iso} />
    </Field>
  );
}
