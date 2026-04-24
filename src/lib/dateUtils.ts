import { WEEKEND_DAYS } from "@/constants/app";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

const MONTH_NAMES_ES: readonly string[] = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Parse an ISO date string as a local (not UTC) Date.
 * Avoids the off-by-one-day issue caused by UTC offset when using `new Date("YYYY-MM-DD")`.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD (ISO, local timezone). */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format a YYYY-MM-DD string as DD/MM/YYYY for display. */
export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/** Return the ISO day name (Monday-indexed) for a given Date. */
export function getDayName(date: Date): DayName {
  return DAY_NAMES[date.getDay()];
}

/** Returns true if the date falls on Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.has(date.getDay() as 0 | 6);
}

/** Spanish month name, 1-indexed (1 = "Enero"). */
export function getMonthName(month: number): string {
  return MONTH_NAMES_ES[month - 1] ?? "";
}

/**
 * Returns all Mon–Sun week ranges that overlap with the given month.
 * Weeks beginning before the 1st or ending after the last day are included
 * if any day falls within the month.
 */
export function getWeeksInMonth(
  year: number,
  month: number,
): { start: Date; end: Date }[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);

  // Walk back to the nearest Monday
  const mondayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const startMonday  = new Date(firstDay);
  startMonday.setDate(firstDay.getDate() - mondayOffset);

  const weeks: { start: Date; end: Date }[] = [];
  const current = new Date(startMonday);

  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekEnd   = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weeks.push({ start: weekStart, end: weekEnd });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/** Returns an array of 7 consecutive Dates starting from weekStart (Monday). */
export function getDatesInWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format a week range header for display, e.g. "01/04/2025 – 07/04/2025". */
export function formatWeekHeader(startDate: string, endDate: string): string {
  return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

/** Human-readable month + year label in Spanish, e.g. "Abril 2025". */
export function getMonthLabel(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}

/** Stable string ID for a month (used as storage key), format YYYY-MM. */
export function monthId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Returns the previous month as { year, month }, handling January wrap-around. */
export function prevMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}
