export const TZ = "Europe/Lisbon";

const WD_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const WD_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const weekdayLong = (i: number) => WD_LONG[((i % 7) + 7) % 7];
export const weekdayShort = (i: number) => WD_SHORT[((i % 7) + 7) % 7];
export const monthName = (i: number) => MONTHS[((i % 12) + 12) % 12];

/** Data de hoje (fuso de Portugal continental) em formato YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** Hora atual (HH:MM) no fuso de Portugal. */
export function nowTime(): string {
  return new Date().toLocaleTimeString("pt-PT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** Converte YYYY-MM-DD num Date local (sem saltos de fuso). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
}

export const weekdayOf = (iso: string) => parseISO(iso).getDay();

export function startOfWeek(iso: string, weekStart: 0 | 1 = 1): string {
  const wd = weekdayOf(iso);
  const diff = (wd - weekStart + 7) % 7;
  return addDays(iso, -diff);
}

export function rangeDays(startISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(startISO, i));
}

export const startOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;
export const monthKey = (iso: string) => iso.slice(0, 7);

export function endOfMonth(iso: string): string {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = parseISO(aISO).getTime();
  const b = parseISO(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** "segunda, 21 de setembro" */
export function formatDayLong(iso: string): string {
  const d = parseISO(iso);
  return `${weekdayLong(d.getDay())}, ${d.getDate()} de ${monthName(d.getMonth())}`;
}

/** "21 set" */
export function formatDayShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)}`;
}

/** "setembro de 2026" */
export function formatMonthYear(iso: string): string {
  const d = parseISO(iso);
  return `${monthName(d.getMonth())} de ${d.getFullYear()}`;
}

/** Hoje / Amanhã / Ontem / data curta. */
export function relativeDay(iso: string, today = todayISO()): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 1 && diff < 7) return weekdayLong(weekdayOf(iso));
  return formatDayShort(iso);
}

export const hhmm = (time: string | null | undefined) => (time ? time.slice(0, 5) : "");

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Tempo restante legível: "3 h 20 min", "2 dias", "expirada". */
export function timeLeft(expiresAtISO: string, from: Date = new Date()): string {
  const ms = new Date(expiresAtISO).getTime() - from.getTime();
  if (ms <= 0) return "expirada";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const rest = mins % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 dia";
  if (days < 30) return `${days} dias`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 mês" : `${months} meses`;
}

/** Data/hora local (pt-PT) a partir de um timestamp. */
export function formatDateTime(tsISO: string): string {
  return new Date(tsISO).toLocaleString("pt-PT", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Converte um valor datetime-local em ISO UTC. */
export function localInputToISO(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
