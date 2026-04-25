import { Employee, MonthSchedule, WeekRow, GuardDay } from "@/types/schedule";
import {
  getWeeksInMonth,
  getDatesInWeek,
  formatDate,
  isWeekend,
  monthId,
} from "./dateUtils";
import { countHistoricalGuards } from "./scheduleRules";

// ── Day-of-week constants ─────────────────────────────────────────────────────
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ── Base schedule (when NOT working the weekend rotation) ─────────────────────
// Any day not listed → FRANCO
const BASE_SCHEDULE: Record<string, Partial<Record<DayOfWeek, string>>> = {
  albalat: {
    1: "13:00-22:00", // Mon
    2: "13:00-22:00", // Tue
  },
  rawson: {
    1: "06:00-16:00", // Mon
    2: "06:00-16:00", // Tue
    3: "06:00-16:00", // Wed
    4: "06:00-16:00", // Thu
  },
  pazos: {
    3: "14:00-22:00", // Wed
    4: "14:00-22:00", // Thu
    5: "14:00-22:00", // Fri
  },
};

// ── Weekend-worker schedule (when this employee IS on weekend rotation) ────────
// Replaces BASE_SCHEDULE entirely for that week.
// Any day not listed → FRANCO.
// Compensation: drop Thu–Fri to balance the extra Sat+Sun.
const WEEKEND_SCHEDULE: Record<string, Partial<Record<DayOfWeek, string>>> = {
  albalat: {
    1: "13:00-22:00", // Mon
    2: "13:00-22:00", // Tue
    6: "08:00-20:00", // Sat
    0: "08:00-20:00", // Sun
  },
  rawson: {
    1: "06:00-16:00", // Mon
    2: "06:00-16:00", // Tue
    3: "06:00-16:00", // Wed
    6: "08:00-20:00", // Sat
    0: "08:00-20:00", // Sun
    // Thu–Fri → FRANCO as compensation
  },
  pazos: {
    3: "14:00-22:00", // Wed
    6: "08:00-20:00", // Sat
    0: "08:00-20:00", // Sun
  },
};

// All 3 employees rotate weekends
const WEEKEND_ELIGIBLE = new Set(["albalat", "rawson", "pazos"]);

// ── Count weekend shifts per employee across history ──────────────────────────
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
          if (
            isWeekend(date) &&
            assignment.shift !== "FRANCO" &&
            row.employeeId in counts
          ) {
            counts[row.employeeId]++;
          }
        }
      }
    }
  }
  return counts;
}

/**
 * Generate a full monthly schedule using per-employee, per-day-of-week rules.
 *
 * Algorithm:
 * - Each employee has a BASE_SCHEDULE (days worked Mon–Fri when not on weekend).
 * - Weekend rotation is only among WEEKEND_ELIGIBLE employees (albalat, pazos).
 *   Rotation happens every 2 weeks, fairness-ordered by historical weekend count.
 * - Weekend worker uses WEEKEND_SCHEDULE for that week (works Sat+Sun, skips some weekdays).
 * - Rawson always follows BASE_SCHEDULE and is never assigned weekends.
 * - Guards: one employee per week, rotating by fewest historical guards (all 3 eligible).
 */
export function suggestMonth(
  year: number,
  month: number,
  employees: readonly Employee[],
  history: readonly MonthSchedule[],
): MonthSchedule {
  const historicGuards   = countHistoricalGuards(history, employees);
  const historicWeekends = countHistoricalWeekends(history, employees);

  // For guards: sort ALL employees by fewest guard count
  const sortedByGuards = [...employees].sort(
    (a, b) => (historicGuards[a.id] ?? 0) - (historicGuards[b.id] ?? 0),
  );

  // For weekends: only eligible employees, sorted by fewest weekends
  const eligibleForWeekend = employees.filter((e) => WEEKEND_ELIGIBLE.has(e.id));
  const sortedByWeekends   = [...eligibleForWeekend].sort(
    (a, b) => (historicWeekends[a.id] ?? 0) - (historicWeekends[b.id] ?? 0),
  );

  const rawWeeks = getWeeksInMonth(year, month);

  const weeks = rawWeeks.map((week, weekIndex) => {
    const dates = getDatesInWeek(week.start);

    // Weekend rotation: same person covers 2 consecutive weeks, then next
    const weekendEmp = sortedByWeekends[
      Math.floor(weekIndex / 2) % sortedByWeekends.length
    ];

    // Build shift rows per employee
    const rows: WeekRow[] = employees.map((emp) => {
      const isWeekendWorker = emp.id === weekendEmp.id;
      const schedule =
        isWeekendWorker && WEEKEND_SCHEDULE[emp.id]
          ? WEEKEND_SCHEDULE[emp.id]
          : BASE_SCHEDULE[emp.id] ?? {};

      const days: Record<string, { shift: string }> = {};
      for (const date of dates) {
        const dateStr   = formatDate(date);
        const dow       = date.getDay() as DayOfWeek;
        const shift     = schedule[dow] ?? "FRANCO";
        days[dateStr]   = { shift };
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
