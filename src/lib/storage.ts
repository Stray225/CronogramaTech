import { MonthSchedule, StoredData, isStoredData } from "@/types/schedule";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  MAX_HISTORY_MONTHS,
} from "@/constants/app";
import { Result, Ok, Err } from "./result";
import { makeError, fromUnknown, AppError } from "./errors";
import { monthId } from "./dateUtils";

// ── Internal helpers ─────────────────────────────────────────────────────────

function load(): Result<StoredData, AppError> {
  if (typeof window === "undefined") {
    return Ok({ schedules: [], version: STORAGE_VERSION });
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Ok({ schedules: [], version: STORAGE_VERSION });

    const parsed: unknown = JSON.parse(raw);
    if (!isStoredData(parsed)) {
      return Err(
        makeError(
          "STORAGE_PARSE_FAILED",
          "Stored data failed validation — shape mismatch.",
          parsed,
        ),
      );
    }
    return Ok(parsed);
  } catch (cause) {
    return Err(fromUnknown(cause, "STORAGE_READ_FAILED"));
  }
}

function persist(data: StoredData): Result<void, AppError> {
  if (typeof window === "undefined") return Ok(undefined);
  try {
    // Enforce max history before writing
    const sorted = [...data.schedules].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const trimmed = sorted.slice(-MAX_HISTORY_MONTHS);
    const payload: StoredData = { schedules: trimmed, version: STORAGE_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return Ok(undefined);
  } catch (cause) {
    return Err(fromUnknown(cause, "STORAGE_WRITE_FAILED"));
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Retrieve the schedule for a specific month.
 * Returns Ok(null) when no schedule is saved for that month.
 * Returns Err when storage is unreadable or data is corrupt.
 */
export function getSchedule(
  year: number,
  month: number,
): Result<MonthSchedule | null, AppError> {
  const result = load();
  if (!result.ok) return result;
  const id = monthId(year, month);
  return Ok(result.value.schedules.find((s) => s.id === id) ?? null);
}

/**
 * Persist a schedule. Merges with existing data and enforces MAX_HISTORY_MONTHS.
 */
export function saveSchedule(
  schedule: MonthSchedule,
): Result<void, AppError> {
  const loadResult = load();
  if (!loadResult.ok) return loadResult;

  const data = loadResult.value;
  const existing = data.schedules.filter((s) => s.id !== schedule.id);
  return persist({ schedules: [...existing, schedule], version: data.version });
}

/**
 * Returns up to `count` months of history strictly before the given month,
 * ordered newest first.
 */
export function getRecentHistory(
  year: number,
  month: number,
  count = 2,
): Result<readonly MonthSchedule[], AppError> {
  const result = load();
  if (!result.ok) return result;
  const currentId = monthId(year, month);
  const history = result.value.schedules
    .filter((s) => s.id < currentId)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, count);
  return Ok(history);
}

/** Returns all stored schedules — used for diagnostics. */
export function getAllSchedules(): Result<readonly MonthSchedule[], AppError> {
  const result = load();
  if (!result.ok) return result;
  return Ok(result.value.schedules);
}
