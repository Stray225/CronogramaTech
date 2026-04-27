/**
 * Core domain types for the Tech Support schedule application.
 * All interfaces are readonly to prevent accidental mutation.
 */

/** A team member with a stable identifier. */
export interface Employee {
  readonly id: string;
  readonly name: string;
}

/** Visual and export metadata for a single shift type. */
export interface ShiftDefinition {
  readonly code: string;
  readonly label: string;
  /** Counted hours for statistics. 0 for FRANCO / non-worked days. */
  readonly hours: number;
  /** Tailwind bg class (with dark variant). */
  readonly color: string;
  /** Tailwind text class (with dark variant). */
  readonly textColor: string;
  /** ARGB hex string for Excel cell fill (e.g. "FFD1FAE5"). */
  readonly exportColor: string;
}

/** A single day's assignment for one employee. */
export interface DayAssignment {
  readonly shift: string;
  readonly note?: string;
  /** Free-text coverage info for FERIADO / CUMPLEAÑOS days (e.g. "Rawson 06:00-14:00"). */
  readonly coverage?: string;
}

/** Guard duty for a single calendar day. */
export interface GuardDay {
  /** ISO date string: YYYY-MM-DD */
  readonly date: string;
  readonly employeeId: string | null;
}

/** One employee's assignments across all days of a week. */
export interface WeekRow {
  readonly employeeId: string;
  /** Keys are ISO date strings (YYYY-MM-DD). */
  readonly days: Readonly<Record<string, DayAssignment>>;
}

/** A Mon–Sun week block within a monthly schedule. */
export interface WeekSchedule {
  /** ISO date string: Monday */
  readonly startDate: string;
  /** ISO date string: Sunday */
  readonly endDate: string;
  readonly rows: readonly WeekRow[];
  readonly guards: readonly GuardDay[];
}

/** The full schedule for one calendar month. */
export interface MonthSchedule {
  /** Format: YYYY-MM (e.g. "2025-03") */
  readonly id: string;
  /** 1-indexed month number (1 = January). */
  readonly month: number;
  readonly year: number;
  readonly weeks: readonly WeekSchedule[];
  /** ISO timestamp of last modification. */
  readonly updatedAt: string;
}

/** Statistics computed for a single employee over a month. */
export interface EmployeeStats {
  readonly employeeId: string;
  readonly totalHours: number;
  readonly guardCount: number;
  readonly holidayCount: number;
  readonly weekendDaysWorked: number;
  readonly francoCount: number;
  readonly vacationCount: number;
}

/** Shape of the object stored in localStorage. */
export interface StoredData {
  readonly schedules: readonly MonthSchedule[];
  readonly version: number;
}

// ── Runtime type guards ───────────────────────────────────────────────────────

export function isDayAssignment(value: unknown): value is DayAssignment {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["shift"] === "string" &&
    (v["note"]     === undefined || typeof v["note"]     === "string") &&
    (v["coverage"] === undefined || typeof v["coverage"] === "string")
  );
}

export function isGuardDay(value: unknown): value is GuardDay {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["date"] === "string" &&
    (v["employeeId"] === null || typeof v["employeeId"] === "string")
  );
}

export function isWeekRow(value: unknown): value is WeekRow {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["employeeId"] === "string" &&
    typeof v["days"] === "object" &&
    v["days"] !== null
  );
}

export function isWeekSchedule(value: unknown): value is WeekSchedule {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["startDate"] === "string" &&
    typeof v["endDate"] === "string" &&
    Array.isArray(v["rows"]) &&
    Array.isArray(v["guards"]) &&
    (v["rows"] as unknown[]).every(isWeekRow) &&
    (v["guards"] as unknown[]).every(isGuardDay)
  );
}

export function isMonthSchedule(value: unknown): value is MonthSchedule {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["id"] === "string" &&
    typeof v["month"] === "number" &&
    typeof v["year"] === "number" &&
    typeof v["updatedAt"] === "string" &&
    Array.isArray(v["weeks"]) &&
    (v["weeks"] as unknown[]).every(isWeekSchedule)
  );
}

export function isStoredData(value: unknown): value is StoredData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["version"] === "number" &&
    Array.isArray(v["schedules"]) &&
    (v["schedules"] as unknown[]).every(isMonthSchedule)
  );
}
