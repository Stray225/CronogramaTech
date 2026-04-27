"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonthSchedule, Employee, isMonthSchedule } from "@/types/schedule";
import { AppError, ERROR_LABELS } from "@/lib/errors";
import { getSchedule, saveSchedule, getRecentHistory } from "@/lib/storage";
import { suggestMonth, emptyMonth } from "@/lib/suggestions";
import { parseLocalDate } from "@/lib/dateUtils";
import { HISTORY_DISPLAY_MONTHS } from "@/constants/app";
import { monthId } from "@/lib/dateUtils";

// ── Client-side API helpers ──────────────────────────────────────────────────

async function apiFetch(year: number, month: number): Promise<MonthSchedule | null> {
  try {
    const res = await fetch(`/api/schedule/${monthId(year, month)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return isMonthSchedule(data) ? data : null;
  } catch {
    return null;
  }
}

async function apiPut(schedule: MonthSchedule): Promise<void> {
  try {
    await fetch(`/api/schedule/${schedule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
  } catch {
    // Background sync — swallow error, localStorage is the safety net
  }
}

// ── Cross-month sync helper ───────────────────────────────────────────────────
/** Update a single day in an adjacent month's schedule (for cross-week days). */
function patchDayInSchedule(
  schedule: MonthSchedule,
  employeeId: string,
  date: string,
  shift: string,
  note?: string,
  coverage?: string,
): MonthSchedule {
  let changed = false;
  const weeks = schedule.weeks.map((week) => {
    if (!week.rows.some((r) => date in r.days)) return week;
    changed = true;
    return {
      ...week,
      rows: week.rows.map((row) =>
        row.employeeId !== employeeId
          ? row
          : { ...row, days: { ...row.days, [date]: { shift, note, coverage } } },
      ),
    };
  });
  if (!changed) return schedule;
  return { ...schedule, weeks, updatedAt: new Date().toISOString() };
}

// ── Hook public interface ─────────────────────────────────────────────────────

export interface UseScheduleReturn {
  readonly schedule: MonthSchedule | null;
  readonly history: readonly MonthSchedule[];
  readonly error: AppError | null;
  readonly errorLabel: string | null;
  clearError: () => void;
  updateShift: (
    weekIndex: number,
    employeeId: string,
    date: string,
    shift: string,
    note?: string,
    coverage?: string,
  ) => void;
  updateWeekGuard: (weekIndex: number, employeeId: string | null) => void;
  applySuggestion: () => void;
  reset: () => void;
}

export function useSchedule(
  year: number,
  month: number,
  employees: readonly Employee[],
): UseScheduleReturn {
  const [schedule, setSchedule] = useState<MonthSchedule | null>(null);
  const [history,  setHistory]  = useState<readonly MonthSchedule[]>([]);
  const [error,    setError]    = useState<AppError | null>(null);

  // Avoid writing back data we just loaded from API
  const skipSaveRef = useRef(false);

  // ── Load on month/year change ─────────────────────────────────────────────
  useEffect(() => {
    // 1. Immediate render: use localStorage (synchronous, zero-flash)
    const localRes = getSchedule(year, month);
    const histRes  = getRecentHistory(year, month, HISTORY_DISPLAY_MONTHS);

    const localSched = localRes.ok
      ? (localRes.value ?? emptyMonth(year, month, employees))
      : emptyMonth(year, month, employees);

    if (!localRes.ok) setError(localRes.error);

    skipSaveRef.current = true;
    setSchedule(localSched);

    if (histRes.ok) setHistory(histRes.value);
    else setError(histRes.error);

    // 2. Background: fetch from DB — use if newer or absent locally
    apiFetch(year, month).then((apiSched) => {
      if (!apiSched) return;
      // Prefer the DB copy if it is newer
      if (!localRes.ok || !localRes.value || apiSched.updatedAt >= localSched.updatedAt) {
        skipSaveRef.current = true;
        setSchedule(apiSched);
        saveSchedule(apiSched); // keep local cache in sync
      }
    });
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist on every change ───────────────────────────────────────────────
  useEffect(() => {
    if (!schedule) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }

    const result = saveSchedule(schedule);
    if (!result.ok) setError(result.error);

    // Background sync to DB
    apiPut(schedule);
  }, [schedule]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const updateShift = useCallback(
    (
      weekIndex: number,
      employeeId: string,
      date: string,
      shift: string,
      note?: string,
      coverage?: string,
    ) => {
      // Update current month's state
      setSchedule((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          weeks: prev.weeks.map((week, wi) =>
            wi !== weekIndex
              ? week
              : {
                  ...week,
                  rows: week.rows.map((row) =>
                    row.employeeId !== employeeId
                      ? row
                      : { ...row, days: { ...row.days, [date]: { shift, note, coverage } } },
                  ),
                },
          ),
        };
      });

      // Cross-month sync: if date belongs to adjacent month, sync there too
      const dateObj = parseLocalDate(date);
      const dateMth = dateObj.getMonth() + 1;
      const dateYr  = dateObj.getFullYear();

      if (dateMth !== month || dateYr !== year) {
        const adjRes  = getSchedule(dateYr, dateMth);
        if (adjRes.ok) {
          const adjBase = adjRes.value ?? emptyMonth(dateYr, dateMth, employees);
          const patched = patchDayInSchedule(adjBase, employeeId, date, shift, note, coverage);
          saveSchedule(patched);
          apiPut(patched);
        }
      }
    },
    [month, year, employees],
  );

  const updateWeekGuard = useCallback(
    (weekIndex: number, employeeId: string | null) => {
      setSchedule((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          weeks: prev.weeks.map((week, wi) =>
            wi !== weekIndex
              ? week
              : { ...week, guards: week.guards.map((g) => ({ ...g, employeeId })) },
          ),
        };
      });
    },
    [],
  );

  const applySuggestion = useCallback(() => {
    const histRes = getRecentHistory(year, month, HISTORY_DISPLAY_MONTHS);
    const hist    = histRes.ok ? histRes.value : [];
    setSchedule(suggestMonth(year, month, employees, hist));
  }, [year, month, employees]);

  const reset = useCallback(() => {
    setSchedule(emptyMonth(year, month, employees));
  }, [year, month, employees]);

  const clearError = useCallback(() => setError(null), []);

  return {
    schedule,
    history,
    error,
    errorLabel: error ? (ERROR_LABELS[error.code] ?? ERROR_LABELS.UNKNOWN) : null,
    clearError,
    updateShift,
    updateWeekGuard,
    applySuggestion,
    reset,
  };
}
