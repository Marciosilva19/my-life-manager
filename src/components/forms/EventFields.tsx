"use client";

import { useState } from "react";
import { Field, Input, Row, Select, Textarea } from "@/components/ui/Field";
import { weekdayLong } from "@/lib/dates";
import { capitalize } from "@/lib/format";
import { EVENT_COLORS, type CalendarEvent } from "@/lib/types";

const KINDS: { value: CalendarEvent["kind"]; label: string }[] = [
  { value: "aula", label: "Aula" },
  { value: "trabalho", label: "Trabalho" },
  { value: "estudo", label: "Estudo" },
  { value: "ginasio", label: "Ginásio" },
  { value: "outro", label: "Outro" },
];

export default function EventFields({
  event,
  defaultDate,
  defaultWeekday = 1,
  defaultStart = "09:00",
}: {
  event?: CalendarEvent;
  defaultDate?: string;
  defaultWeekday?: number;
  defaultStart?: string;
}) {
  const [weekly, setWeekly] = useState(event ? event.repeats_weekly : true);

  return (
    <>
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" required maxLength={160} defaultValue={event?.title} placeholder="Aula de Matemática" />
      </Field>

      <Row>
        <Field label="Tipo" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={event?.kind ?? "aula"}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cor" htmlFor="color">
          <Select id="color" name="color" defaultValue={event?.color ?? "rosa"}>
            {EVENT_COLORS.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row>
        <Field label="Início" htmlFor="start_time">
          <Input id="start_time" type="time" name="start_time" required defaultValue={event?.start_time?.slice(0, 5) ?? defaultStart} />
        </Field>
        <Field label="Fim" htmlFor="end_time">
          <Input id="end_time" type="time" name="end_time" required defaultValue={event?.end_time?.slice(0, 5) ?? "10:00"} />
        </Field>
      </Row>

      <label className="flex items-start gap-3 rounded-xl bg-surface2 px-3.5 py-3 text-[14px]">
        <input
          type="checkbox"
          name="repeats_weekly"
          checked={weekly}
          onChange={(e) => setWeekly(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]"
        />
        <span className="leading-snug">Repete todas as semanas (entra no horário)</span>
      </label>

      {weekly ? (
        <Field label="Dia da semana" htmlFor="weekday">
          <Select id="weekday" name="weekday" defaultValue={String(event?.weekday ?? defaultWeekday)}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <option key={d} value={d}>
                {capitalize(weekdayLong(d))}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Data" htmlFor="date">
          <Input id="date" type="date" name="date" defaultValue={event?.date ?? defaultDate ?? ""} required />
        </Field>
      )}

      <Field label="Local (opcional)" htmlFor="location">
        <Input id="location" name="location" maxLength={160} defaultValue={event?.location ?? ""} placeholder="Sala, ginásio, casa…" />
      </Field>

      <Field label="Notas (opcional)" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={event?.notes ?? ""} />
      </Field>
    </>
  );
}
