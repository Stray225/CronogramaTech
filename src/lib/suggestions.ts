import { Employee, MonthSchedule, WeekRow, GuardDay } from "@/types/schedule";
import {
  getWeeksInMonth,
  getDatesInWeek,
  formatDate,
  isWeekend,
  monthId,
} from "./dateUtils";
import { countHistoricalGuards } from "./scheduleRules";

// ── Per-employee weekday shift preference ─────────────────────────────────────
// Keyed by employee ID. Falls back to DEFAULT_WEEKDAY for unknown IDs.

const WEEKDAY_SHIFT: Record<string, string> = {
  pazos:   "13:00-22:00", // shifts ending at 22:00
  albalat: "06:00-16:00", // shifts ending at 16:00
  rawson:  "06:00-16:00", // shifts ending at 16:00
};

const DEFAULT_WEEKDAY = "06:00-16:00";
const WEEKEND_SHIFT   = "08:00-20:00";

function weekdayShiftFor(employeeId: string): string {
  return WEEKDAY_SHIFT[employeeId] ?? DEFAULT_WEEKDAY;
}

/**
 * Count weekend shifts per employee across historical schedules.
 * Used for fair weekend rotation (fewest first).
 */
function countHistoricalWeekends(
  history: readonly MonthSchedule[],
  employees: readonly Employee[],
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    employees.map((e) => [e.id, 0]),
  );
  for (const schedule of history) {
    for (const week of schedule.weeks) {
      for (const row of week.rows) {
        for (const [dateStr, assignment] of Object.entries(row.days)) {
          const date = new Date(dateStr + "T00:00:00");
          if (isWeekend(date) && assignment.shift !== "FRANCO" && row.employeeId in counts) {
            counts[row.employeeId]++;
          }
        }
      }
    }
  }
  return counts;
}

/**
 * Generate a full monthly schedule using employee-specific shift rules.
 *
 * Algorithm:
 * - Weekdays (Mon–Fri): each employee gets their configured shift (WEEKDAY_SHIFT).
 * - Weekends (Sat–Sun): one employee covers weekend shifts, rotating every 2 weeks
 *   based on historical weekend count (fewest first). Others get FRANCO.
 * - Guards: one employee per week, rotating weekly by historical guard count (fewest first).
 */
export function suggestMonth(
  year: number,
  month: number,
  employees: readonly Employee[],
  history: readonly MonthSchedule[],
): MonthSchedule {
  const historicGuards   = countHistoricalGuards(history, employees);
  const historicWeekends = countHistoricalWeekends(history, employees);

  // Sort by fewest guards / weekends for fair rotation
  const sortedByGuards   = [...employees].sort(
    (a, b) => (historicGuards[a.id] ?? 0) - (historicGuards[b.id] ?? 0),
  );
  const sortedByWeekends = [...employees].sort(
    (a, b) => (historicWeekends[a.id] ?? 0) - (historicWeekends[b.id] ?? 0),
  );

  const rawWeeks = getWeeksInMonth(year, month);

  const weeks = rawWeeks.map((week, weekIndex) => {
    const dates = getDatesInWeek(week.start);

    // Weekend rotation: same person for 2 consecutive weeks, then next
    const weekendEmp = sortedByWeekends[Math.floor(weekIndex / 2) % sortedByWeekends.length];

    // Build shift rows per employee
    const rows: WeekRow[] = employees.map((emp) => {
      const days: Record<string, { shift: string }> = {};
      const isWeekendWorker = emp.id === weekendEmp.id;

      for (const date of dates) {
        const dateStr  = formatDate(date);
        const dayOfWeek = date.getDay(); // 0=Sun,1=Mon,...,4=Thu,5=Fri,6=Sat

        if (isWeekend(date)) {
          // Sat + Sun: only the weekend employee works
          days[dateStr] = { shift: isWeekendWorker ? WEEKEND_SHIFT : "FRANCO" };
        } else if (isWeekendWorker && (dayOfWeek === 4 || dayOfWeek === 5)) {
          // Thu + Fri: the weekend employee rests (compensates for Sat+Sun)
          days[dateStr] = { shift: "FRANCO" };
        } else {
          // Mon–Wed (and Thu–Fri for non-weekend employees): normal weekday shift
          days[dateStr] = { shift: weekdayShiftFor(emp.id) };
        }
      }

      return { employeeId: emp.id, days };
    });

    // Guard: one employee covers the whole week, rotating weekly
    const guardEmp = sortedByGuards[weekIndex % sortedByGuards.length];
    const guards: GuardDay[] = dates.map((date) => ({
      date: formatDate(date),
      employeeId: guardEmp.id,
    }));

    return {
      startDate: formatDate(week.start),
      endDate:   formatDate(week.end),
      rows,
      guards,
    };
  });

  return {
    id: monthId(year, month),
    month,
    year,
    weeks,
    updatedAt: new Date().toISOString(),
  };
}

/** Create an empty schedule for a month where every day is FRANCO and no guards are set. */
export function emptyMonth(
  year: number,
  month: number,
  employees: readonly Employee[],
): MonthSchedule {
  const rawWeeks = getWeeksInMonth(year, month);

  const weeks = rawWeeks.map((week) => {
    const dates = getDatesInWeek(week.start);

    const rows: WeekRow[] = employees.map((emp) => {
      const days: Record<string, { shift: string }> = {};
      for (const date of dates) {
        days[formatDate(date)] = { shift: "FRANCO" };
      }
      return { employeeId: emp.id, days };
    });

    const guards: GuardDay[] = dates.map((date) => ({
      date: formatDate(date),
      employeeId: null,
    }));

    return {
      startDate: formatDate(week.start),
      endDate:   formatDate(week.end),
      rows,
      guards,
    };
  });

  return {
    id: monthId(year, month),
    month,
    year,
    weeks,
    updatedAt: new Date().toISOString(),
  };
}
