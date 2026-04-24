"use client";

import { Employee, MonthSchedule } from "@/types/schedule";
import { getMonthLabel } from "@/lib/dateUtils";
import { calculateStats } from "@/lib/scheduleRules";
import { CARD_CLS, CARD_HDR, CARD_DIVIDER } from "./SummaryPanel";

interface HistoryPanelProps {
  history: readonly MonthSchedule[];
  employees: readonly Employee[];
}

export default function HistoryPanel({ history, employees }: HistoryPanelProps) {
  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className={CARD_HDR}>Historial reciente</h2>

      {history.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-600 italic">
          Sin datos de meses anteriores.
        </p>
      ) : (
        <div className="space-y-5">
          {history.map((schedule, si) => {
            const stats = calculateStats(schedule, employees);
            const label = getMonthLabel(schedule.month, schedule.year);

            return (
              <div key={schedule.id}>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  {label}
                </p>
                <div className="space-y-2">
                  {employees.map((emp) => {
                    const s = stats.find((x) => x.employeeId === emp.id);
                    if (!s) return null;
                    return (
                      <div key={emp.id} className="flex items-center gap-2">
                        <span className="w-24 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate shrink-0">
                          {emp.name}
                        </span>

                        <GuardBadge count={s.guardCount} />

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                          {s.totalHours}h
                        </span>

                        {s.holidayCount > 0 && (
                          <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                            {s.holidayCount}F
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {si < history.length - 1 && (
                  <div className={`mt-4 ${CARD_DIVIDER}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={`mt-4 pt-3 ${CARD_DIVIDER}`}>
        <p className="text-[10px] text-slate-400 dark:text-slate-600">
          g = guardias · h = horas · F = feriados
        </p>
      </div>
    </div>
  );
}

function GuardBadge({ count }: { count: number }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
        count > 0
          ? "bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300"
          : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-600"
      }`}
    >
      {count}g
    </span>
  );
}
