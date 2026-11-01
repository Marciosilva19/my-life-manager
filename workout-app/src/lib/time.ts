/**
 * All session times are entered and displayed in the gym's time zone, so a PT in Lisbon
 * and a server running in UTC agree on what "Tuesday 18:00" means.
 */
export const TZ = process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Europe/Lisbon";

/** Offset (ms) of `tz` from UTC at the instant `d`. */
function offsetMs(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return asUtc - d.getTime();
}

/** "2026-11-03" + "18:30" in the gym's time zone → Date (UTC instant). */
export function zonedToUtc(date: string, time: string, tz = TZ): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle the DST boundary correctly.
  let t = guess - offsetMs(new Date(guess), tz);
  t = guess - offsetMs(new Date(t), tz);
  return new Date(t);
}

/** Date → "YYYY-MM-DD" in the gym's time zone (used to group sessions by day). */
export function dayKey(d: Date | string, tz = TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(d),
  );
}

export function fmtDay(d: Date | string, tz = TZ): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(d),
  );
}

export function fmtShortDay(d: Date | string, tz = TZ): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(
    new Date(d),
  );
}

export function fmtTime(d: Date | string, tz = TZ): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(d),
  );
}

export function fmtRange(start: string, end: string): string {
  return `${fmtTime(start)}–${fmtTime(end)}`;
}

/** Label for a day key relative to today: "Today", "Tomorrow" or the full date. */
export function dayLabel(key: string, sample: string): string {
  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 86_400_000));
  if (key === today) return "Today";
  if (key === tomorrow) return "Tomorrow";
  return fmtDay(sample);
}

export function groupByDay<T extends { starts_at: string }>(rows: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = dayKey(r.starts_at);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()];
}

export function todayKey(): string {
  return dayKey(new Date());
}
