import type { DayPart } from "./constants";

/** Локальная дата пользователя в формате YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** ISO-день недели: понедельник = 1, воскресенье = 7. */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/** "08:00:00" -> "08:00" */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}

/** Категория отображения по времени начала. Без времени → Дополнительно. */
export function dayPartFor(startTime: string | null): DayPart {
  if (!startTime) return "extra";
  const hour = Number(startTime.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 18) return "day";
  return "evening";
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} ч`);
  if (m) parts.push(`${m} мин`);
  if (s) parts.push(`${s} сек`);
  return parts.join(" ");
}

export function splitDuration(seconds: number | null | undefined) {
  const total = seconds ?? 0;
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const MONTHS_NOMINATIVE = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEKDAY_LONG = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

export function formatDayLong(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}, ${WEEKDAY_LONG[date.getDay()]}`;
}

export function formatDayShort(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function formatMonthTitle(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthStartKey(date: Date): string {
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

/** Сетка месяца, начинающаяся с понедельника. */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -(isoWeekday(first) - 1));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
