"use client";

import { memo } from "react";
import { Employee, MonthSchedule, WeekSchedule } from "@/types/schedule";
import { getDatesInWeek, formatDate, parseLocalDate } from "@/lib/dateUtils";
import ShiftCell from "./ShiftCell";
import GuardWeekCell from "./GuardWeekCell";

const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

/** High-contrast color accent per employee position. */
const EMPLOYEE_COLORS = [
  {
    bg:     "bg-sky-100   dark:bg-sky-900/70",
    text:   "text-sky-950  dark:text-sky-50",
    border: "border-l-4 border-sky-500  dark:border-sky-400",
    dot:    "bg-sky-500  dark:bg-sky-400",
    hdr:    "bg-sky-200  dark:bg-sky-900",
  },
  {
    bg:     "bg-teal-100  dark:bg-teal-900/70",
    text:   "text-teal-950 dark:text-teal-50",
    border: "border-l-4 border-teal-500 dark:border-teal-400",
    dot:    "bg-teal-500 dark:bg-teal-400",
    hdr:    "bg-teal-200 dark:bg-teal-900",
  },
  {
    bg:     "bg-violet-100 dark:bg-violet-900/70",
    text:   "text-violet-950 dark:text-violet-50",
    border: "border-l-4 border-violet-500 dark:border-violet-400",
    dot:    "bg-violet-500 dark:bg-violet-400",
    hdr:    "bg-violet-200 dark:bg-violet-900",
  },
  {
    bg:     "bg-orange-100 dark:bg-orange-900/70",
    text:   "text-orange-950 dark:text-orange-50",
    border: "border-l-4 border-orange-500 dark:border-orange-400",
    dot:    "bg-orange-500 dark:bg-orange-400",
    hdr:    "bg-orange-200 dark:bg-orange-900",
  },
  {
    bg:     "bg-rose-100  dark:bg-rose-900/70",
    text:   "text-rose-950  dark:text-rose-50",
    border: "border-l-4 border-rose-500  dark:border-rose-400",
    dot:    "bg-rose-500  dark:bg-rose-400",
    hdr:    "bg-rose-200  dark:bg-rose-900",
  },
] as const;

interface ScheduleTableProps {
  schedule:      MonthSchedule;
  employees:     readonly Employee[];
  onShiftChange: (wi: number, empId: string, date: string, shift: string, note?: string) => void;
  onGuardChange: (wi: number, empId: string | null) => void;
}

function ScheduleTable({ schedule, employees, onShiftChange, onGuardChange }: ScheduleTableProps) {
  return (
    <div className="space-y-8">
      {schedule.weeks.map((week, weekIndex) => (
        <WeekBlock
          key={week.startDate}
          week={week}
          weekIndex={weekIndex}
          employees={employees}
          month={schedule.month}
          onShiftChange={onShiftChange}
          onGuardChange={onGuardChange}
        />
      ))}
    </div>
  );
}

export default memo(ScheduleTable);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDay(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ── WeekBlock ─────────────────────────────────────────────────────────────────

interface WeekBlockProps {
  week:          WeekSchedule;
  weekIndex:     number;
  employees:     readonly Employee[];
  month:         number;
  onShiftChange: (wi: number, empId: string, date: string, shift: string, note?: string) => void;
  onGuardChange: (wi: number, empId: string | null) => void;
}

function WeekBlock({ week, weekIndex, employees, month, onShiftChange, onGuardChange }: WeekBlockProps) {
  const weekStart = parseLocalDate(week.startDate);
  const dates     = getDatesInWeek(weekStart);

  const isOutside = (d: Date) => d.getMonth() + 1 !== month;

  // Date display for header (only days within the month)
  const firstIn = dates.find((d) => !isOutside(d));
  const lastIn  = [...dates].reverse().find((d) => !isOutside(d));
  const rangeLabel =
    firstIn && lastIn
      ? `${fmtDay(firstIn)} — ${fmtDay(lastIn)}`
      : `${fmtDay(dates[0])} — ${fmtDay(dates[6])}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">

      {/* ── Week header bar ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 px-5 py-3.5 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500 text-white text-sm font-black select-none">
            {weekIndex + 1}
          </span>
          <span className="text-white text-base font-bold tracking-wide">
            Semana {weekIndex + 1}
          </span>
        </div>
        <div className="h-5 w-px bg-slate-600 dark:bg-slate-700" aria-hidden="true" />
        <span className="text-slate-300 text-sm font-medium">{rangeLabel}</span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-slate-800" style={{ minWidth: "900px" }}>

          {/* Column headers */}
          <thead>
            <tr className="bg-slate-600 dark:bg-slate-700 border-b-2 border-slate-500 dark:border-slate-600">
              <th
                className="py-3 px-4 text-left text-sm font-bold text-white border-r border-slate-500 dark:border-slate-600 select-none"
                style={{ minWidth: "148px" }}
              >
                Integrante
              </th>
              {dates.map((date, i) => {
                const isWknd  = date.getDay() === 0 || date.getDay() === 6;
                const outside = isOutside(date);
                return (
                  <th
                    key={i}
                    className={`py-3 px-2 text-center border-r border-slate-500 dark:border-slate-600 last:border-r-0 select-none
                      ${isWknd ? "bg-slate-500 dark:bg-slate-600" : ""}
                      ${outside ? "opacity-30" : ""}`}
                    style={{ minWidth: "130px" }}
                  >
                    <div className="text-white text-sm font-bold">{DAY_NAMES[i]}</div>
                    <div className="text-slate-300 dark:text-slate-400 text-xs font-normal mt-0.5">{fmtDay(date)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Employee rows */}
          <tbody>
            {employees.map((emp, empIdx) => {
              const row    = week.rows.find((r) => r.employeeId === emp.id);
              const colors = EMPLOYEE_COLORS[empIdx % EMPLOYEE_COLORS.length];

              return (
                <tr
                  key={emp.id}
                  className="border-b border-slate-150 dark:border-slate-700"
                >
                  {/* Name cell */}
                  <td className={`py-3 px-4 select-none border-r border-slate-200 dark:border-slate-700 ${colors.bg} ${colors.border}`}>
                    <span className={`flex items-center gap-2.5 text-sm font-bold whitespace-nowrap ${colors.text}`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} aria-hidden="true" />
                      {emp.name}
                    </span>
                  </td>

                  {/* Day cells */}
                  {dates.map((date) => {
                    const dateStr    = formatDate(date);
                    const assignment = row?.days[dateStr] ?? { shift: "FRANCO" };
                    return (
                      <ShiftCell
                        key={dateStr}
                        date={dateStr}
                        employeeId={emp.id}
                        assignment={assignment}
                        dimmed={isOutside(date)}
                        onShiftChange={(eId, d, s, n) => onShiftChange(weekIndex, eId, d, s, n)}
                      />
                    );
                  })}
                </tr>
              );
            })}

            {/* Guard row */}
            <tr>
              <td className="py-3 px-4 select-none border-r border-pink-200 dark:border-pink-900 bg-pink-100 dark:bg-pink-950/60 border-l-4 border-l-pink-500 dark:border-l-pink-500 whitespace-nowrap">
                <span className="flex items-center gap-2.5 text-sm font-bold text-pink-800 dark:text-pink-200">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 dark:bg-pink-400 flex-shrink-0" aria-hidden="true" />
                  Guardia nocturna
                </span>
              </td>
              <GuardWeekCell
                guards={week.guards}
                employees={employees}
                onGuardChange={(empId) => onGuardChange(weekIndex, empId)}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
