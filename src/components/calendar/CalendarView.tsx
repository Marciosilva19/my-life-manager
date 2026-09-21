"use client";

import { useMemo, useState } from "react";
import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import EventFields from "@/components/forms/EventFields";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDayLong,
  formatDayShort,
  formatMonthYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  timeToMinutes,
  weekdayShort,
} from "@/lib/dates";
import { agendaFor, eventOccursOn, occursOn } from "@/lib/domain";
import type { CalendarEvent, Task } from "@/lib/types";

type View = "dia" | "semana" | "mes";
const ORDER: View[] = ["dia", "semana", "mes"];
const HOUR_HEIGHT = 56;

export default function CalendarView({
  slug,
  events,
  tasks,
  weekStart,
  today,
}: {
  slug: string;
  events: CalendarEvent[];
  tasks: Task[];
  weekStart: 0 | 1;
  today: string;
}) {
  const [view, setView] = useState<View>("semana");
  const [anchor, setAnchor] = useState(today);
  const [zoom, setZoom] = useState<"in" | "out">("in");

  function changeView(next: View, date?: string) {
    setZoom(ORDER.indexOf(next) < ORDER.indexOf(view) ? "in" : "out");
    if (date) setAnchor(date);
    setView(next);
  }

  function shift(delta: number) {
    if (view === "dia") setAnchor(addDays(anchor, delta));
    else if (view === "semana") setAnchor(addDays(anchor, delta * 7));
    else setAnchor(addMonths(anchor, delta));
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor, weekStart);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor, weekStart]);

  const title =
    view === "dia" ? formatDayLong(anchor) : view === "semana" ? `${formatDayShort(weekDays[0])} – ${formatDayShort(weekDays[6])}` : formatMonthYear(anchor);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="Modo de visualização">
          {ORDER.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => changeView(v)}>
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="btn-soft btn-sm" onClick={() => setAnchor(today)}>
            Hoje
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Seguinte">
            ›
          </button>
        </div>
      </div>

      <p className="mb-3 px-1 text-[15px] font-medium first-letter:uppercase">{title}</p>

      <div key={`${view}-${anchor}`} className={zoom === "in" ? "animate-zoomIn" : "animate-zoomOut"}>
        {view === "dia" ? (
          <DayView slug={slug} date={anchor} events={events} tasks={tasks} />
        ) : view === "semana" ? (
          <WeekGrid days={weekDays} events={events} tasks={tasks} today={today} onPickDay={(d) => changeView("dia", d)} />
        ) : (
          <MonthGrid
            anchor={anchor}
            weekStart={weekStart}
            events={events}
            tasks={tasks}
            today={today}
            onPickDay={(d) => changeView("dia", d)}
          />
        )}
      </div>

      <div className="mt-5">
        <FormSheet
          trigger="+ Novo bloco"
          triggerClassName="btn-primary w-full"
          title="Novo bloco"
          description="Aulas, trabalho, estudo, ginásio ou qualquer outro compromisso."
          action={createEvent}
          hidden={{ slug }}
          submitLabel="Adicionar ao horário"
        >
          <EventFields defaultDate={anchor} defaultWeekday={parseISO(anchor).getDay()} />
        </FormSheet>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- dia */

function DayView({
  slug,
  date,
  events,
  tasks,
}: {
  slug: string;
  date: string;
  events: CalendarEvent[];
  tasks: Task[];
}) {
  const entries = agendaFor(date, events, tasks);
  const byId = new Map(events.map((e) => [e.id, e]));

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-10 text-center">
        <p className="font-medium">Dia livre</p>
        <p className="mt-1 text-[14px] text-muted">Nada marcado para este dia.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const event = entry.kind === "event" ? byId.get(entry.id) : undefined;
        return (
          <li key={entry.id} className={`ev ev-${entry.color} flex items-start gap-3 rounded-xl px-3.5 py-3`}>
            <div className="w-14 shrink-0 text-[13px] font-semibold">
              {entry.start}
              {entry.end ? <div className="font-normal opacity-70">{entry.end}</div> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-medium ${entry.done ? "line-through opacity-70" : ""}`}>{entry.title}</p>
              {entry.location ? <p className="text-[13px] opacity-80">{entry.location}</p> : null}
              {entry.notes ? <p className="mt-0.5 text-[13px] opacity-75">{entry.notes}</p> : null}
              {entry.kind === "task" ? <p className="text-[12px] opacity-75">Tarefa</p> : null}
            </div>

            {event ? (
              <div className="flex shrink-0 items-center gap-1">
                <FormSheet
                  trigger="Editar"
                  triggerClassName="btn-ghost btn-sm"
                  title="Editar bloco"
                  action={updateEvent}
                  hidden={{ slug, id: event.id }}
                  submitLabel="Guardar alterações"
                >
                  <EventFields event={event} />
                </FormSheet>
                <ConfirmForm action={deleteEvent} message={`Apagar “${event.title}” do horário?`}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="btn-ghost btn-sm" aria-label={`Apagar ${event.title}`}>
                    ✕
                  </button>
                </ConfirmForm>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------- semana */

function WeekGrid({
  days,
  events,
  tasks,
  today,
  onPickDay,
}: {
  days: string[];
  events: CalendarEvent[];
  tasks: Task[];
  today: string;
  onPickDay: (date: string) => void;
}) {
  const dayEntries = days.map((d) => agendaFor(d, events, tasks));
  const all = dayEntries.flat();

  const startHour = Math.min(8, ...all.map((e) => Math.floor(timeToMinutes(e.start) / 60)));
  const endHour = Math.max(20, ...all.map((e) => Math.ceil(timeToMinutes(e.end ?? e.start) / 60) + (e.end ? 0 : 1)));
  const hours = Array.from({ length: Math.max(endHour - startHour, 1) }, (_, i) => startHour + i);
  const gridStart = startHour * 60;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-surface">
      <div className="min-w-[620px]">
        <div className="sticky top-0 z-10 grid grid-cols-[46px_repeat(7,1fr)] border-b border-border/70 bg-surface">
          <div />
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onPickDay(d)}
              className={`py-2 text-center text-[12px] font-medium ${d === today ? "text-primaryInk" : "text-muted"}`}
            >
              <div>{weekdayShort(parseISO(d).getDay())}</div>
              <div
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                  d === today ? "bg-primary text-onprimary" : "text-text"
                }`}
              >
                {parseISO(d).getDate()}
              </div>
            </button>
          ))}
        </div>

        <div className="relative grid grid-cols-[46px_repeat(7,1fr)] pt-2.5">
          <div>
            {hours.map((h) => (
              <div key={h} className="relative text-right" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2 right-1.5 text-[11px] text-muted">{`${h}`.padStart(2, "0")}h</span>
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div key={day} className="relative border-l border-border/60">
              {hours.map((h) => (
                <div key={h} className="border-b border-border/40" style={{ height: HOUR_HEIGHT }} />
              ))}

              {dayEntries[dayIndex].map((entry) => {
                const top = ((timeToMinutes(entry.start) - gridStart) / 60) * HOUR_HEIGHT;
                const minutes = entry.end ? timeToMinutes(entry.end) - timeToMinutes(entry.start) : 30;
                const height = Math.max((minutes / 60) * HOUR_HEIGHT - 3, 22);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onPickDay(day)}
                    className={`ev ev-${entry.color} absolute left-1 right-1 overflow-hidden rounded-lg px-1.5 py-1 text-left`}
                    style={{ top, height }}
                  >
                    <span className="block truncate text-[11px] font-semibold leading-tight">{entry.title}</span>
                    <span className="block truncate text-[10px] opacity-80">{entry.start}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- mês */

function MonthGrid({
  anchor,
  weekStart,
  events,
  tasks,
  today,
  onPickDay,
}: {
  anchor: string;
  weekStart: 0 | 1;
  events: CalendarEvent[];
  tasks: Task[];
  today: string;
  onPickDay: (date: string) => void;
}) {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const gridStart = startOfWeek(first, weekStart);
  const weeks = Math.ceil((parseISO(last).getTime() - parseISO(gridStart).getTime()) / 86_400_000 / 7);
  const cells = Array.from({ length: Math.max(weeks, 5) * 7 }, (_, i) => addDays(gridStart, i));
  const month = anchor.slice(0, 7);

  const headers = Array.from({ length: 7 }, (_, i) => weekdayShort((weekStart + i) % 7));

  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-2">
      <div className="grid grid-cols-7 pb-1">
        {headers.map((h) => (
          <div key={h} className="py-1 text-center text-[11px] font-medium uppercase text-muted">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const count =
            events.filter((e) => eventOccursOn(e, date)).length +
            tasks.filter((t) => t.due_time && t.show_in_calendar && occursOn(t, date)).length;
          const inMonth = date.startsWith(month);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onPickDay(date)}
              aria-label={formatDayLong(date)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] transition-colors ${
                inMonth ? "text-text hover:bg-surface2" : "text-muted/45"
              } ${date === today ? "bg-primarySoft font-semibold text-primaryInk" : ""}`}
            >
              {parseISO(date).getDate()}
              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
