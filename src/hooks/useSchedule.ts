"use client";

import { useCallback, useEffect, useState } from "react";
import { MonthSchedule } from "@/types/schedule";
import { Employee } from "@/types/schedule";
import { AppError, ERROR_LABELS } from "@/lib/errors";
import { getSchedule, saveSchedule, getRecentHistory } from "@/lib/storage";
import { suggestMonth, emptyMonth } from "@/lib/suggestions";
import { HISTORY_DISPLAY_MONTHS } from "@/constants/app";

export interface UseScheduleReturn {
  /** The current month's schedule, or null while initializing. */
  readonly schedule: MonthSchedule | null;
  /** Recent prior months, newest first. */
  readonly history: readonly MonthSchedule[];
  /** Non-null when the last storage operation produced an error. */
  readonly error: AppError | null;
  /** Human-readable label for the current error, suitable for a toast. */
  readonly errorLabel: string | null;
  clearError: () => void;
  updateShift: (
    weekIndex: number,
    employeeId: string,
    date: string,
    shift: string,
    note?: string,
  ) => void;
  /** Set the guard for an entire week — all 7 days assigned to the same person. */
  updateWeekGuard: (
    weekIndex: number,
    employeeId: string | null,
  ) => void;
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

  // ── Load on month/year change ───────────────────────────────────────────────
  useEffect(() => {
    const schedResult = getSchedule(year, month);
    const histResult  = getRecentHistory(year, month, HISTORY_DISPLAY_MONTHS);

    if (!schedResult.ok) {
      setError(schedResult.error);
      setSchedule(emptyMonth(year, month, employees));
    } else {
      setSchedule(schedResult.value ?? emptyMonth(year, month, employees));
    }

    if (!histResult.ok) {
      setError(histResult.error);
      setHistory([]);
    } else {
      setHistory(histResult.value);
    }
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist on every change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!schedule) return;
    const result = saveSchedule(schedule);
    if (!result.ok) setError(result.error);
  }, [schedule]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateShift = useCallback(
    (
      weekIndex: number,
      employeeId: string,
      date: string,
      shift: string,
      note?: string,
    ) => {
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
                      : {
                          ...row,
                          days: { ...row.days, [date]: { shift, note } },
                        },
                  ),
                },
          ),
        };
      });
    },
    [],
  );

  /** Assign one employee to ALL guard days in the week (or null to clear). */
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
              : {
                  ...week,
                  guards: week.guards.map((g) => ({ ...g, employeeId })),
                },
          ),
        };
      });
    },
    [],
  );

  const applySuggestion = useCallback(() => {
    const histResult = getRecentHistory(year, month, HISTORY_DISPLAY_MONTHS);
    const hist = histResult.ok ? histResult.value : [];
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
