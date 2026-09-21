"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui/Field";
import { weekdayShort } from "@/lib/dates";
import type { Recurrence } from "@/lib/types";

const OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Não repete" },
  { value: "daily", label: "Todos os dias" },
  { value: "weekly", label: "Todas as semanas" },
  { value: "monthly", label: "Todos os meses" },
  { value: "weekdays", label: "Dias específicos da semana" },
];

export default function RecurrencePicker({
  defaultValue = "none",
  defaultDays = [],
}: {
  defaultValue?: Recurrence;
  defaultDays?: number[];
}) {
  const [value, setValue] = useState<Recurrence>(defaultValue);

  return (
    <div className="space-y-3">
      <Field label="Repetição" htmlFor="recurrence">
        <Select id="recurrence" name="recurrence" value={value} onChange={(e) => setValue(e.target.value as Recurrence)}>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {value === "weekdays" ? (
        <fieldset>
          <legend className="label">Dias da semana</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <label
                key={day}
                className="cursor-pointer select-none rounded-full border border-border bg-surface2 px-3 py-1.5 text-[13px] font-medium has-[:checked]:border-primary has-[:checked]:bg-primarySoft has-[:checked]:text-primaryInk"
              >
                <input
                  type="checkbox"
                  name="recurrence_days"
                  value={day}
                  defaultChecked={defaultDays.includes(day)}
                  className="sr-only"
                />
                {weekdayShort(day)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
