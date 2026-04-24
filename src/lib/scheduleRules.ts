import { Employee, EmployeeStats, MonthSchedule } from "@/types/schedule";
import { GUARD_HOURS_WEEKDAY, GUARD_HOURS_WEEKEND } from "@/constants/app";
import { getShift } from "@/config/shifts";
import { isWeekend, parseLocalDate } from "./dateUtils";

/** Compute per-employee statistics for a single month schedule. */
export function calculateStats(
  schedule: MonthSchedule,
  employees: readonly Employee[],
): EmployeeStats[] {
  return employees.map((emp): EmployeeStats => {
    let totalHours       = 0;
    let guardCount       = 0;
    let holidayCount     = 0;
    let weekendDaysWorked = 0;
    let francoCount      = 0;
    let vacationCount    = 0;

    for (const week of schedule.weeks) {
      const row = week.rows.find((r) => r.employeeId === emp.id);
      if (row) {
        for (const [dateStr, assignment] of Object.entries(row.days)) {
          const date  = parseLocalDate(dateStr);
          const shift = getShift(assignment.shift);
          totalHours += shift.hours;

          if (assignment.shift === "FRANCO")    francoCount++;
          if (assignment.shift === "FERIADO")   holidayCount++;
          if (assignment.shift === "VACACIONES") vacationCount++;

          if (
            isWeekend(date) &&
            assignment.shift !== "FRANCO" &&
            assignment.shift !== "VACACIONES"
          ) {
            weekendDaysWorked++;
          }
        }
      }

      // Guard hours
      for (const guard of week.guards) {
        if (guard.employeeId === emp.id) {
          guardCount++;
          const date = parseLocalDate(guard.date);
          totalHours += isWeekend(date) ? GUARD_HOURS_WEEKEND : GUARD_HOURS_WEEKDAY;
        }
      }
    }

    return {
      employeeId: emp.id,
      totalHours,
      guardCount,
      holidayCount,
      weekendDaysWorked,
      francoCount,
      vacationCount,
    };
  });
}

/**
 * Count guard assignments per employee across a list of historical schedules.
 * Returns a record keyed by employee ID with accumulated guard counts.
 */
export function countHistoricalGuards(
  history: readonly MonthSchedule[],
  employees: readonly Employee[],
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    employees.map((e) => [e.id, 0]),
  );

  for (const schedule of history) {
    for (const week of schedule.weeks) {
      for (const guard of week.guards) {
        if (guard.employeeId && guard.employeeId in counts) {
          counts[guard.employeeId]++;
        }
      }
    }
  }

  return counts;
}
