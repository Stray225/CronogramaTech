"use client";

import { memo } from "react";
import { Employee, MonthSchedule, WeekSchedule } from "@/types/schedule";
import { getDatesInWeek, formatDate, parseLocalDate } from "@/lib/dateUtils";
import ShiftCell from "./ShiftCell";
import GuardWeekFooter from "./GuardWeekCell";

const DAY_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

/** High-contrast per-employee column color. */
export const EMPLOYEE_COLORS = [
  { bg: "bg-sky-100 dark:bg-sky-900/70",     text: "text-sky-950 dark:text-sky-50",     border: "border-sky-500 dark:border-sky-400",    dot: "bg-sky-500 dark:bg-sky-400",    cellBg: "bg-sky-50/60 dark:bg-sky-950/40"    },
  { bg: "bg-teal-100 dark:bg-teal-900/70",   text: "text-teal-950 dark:text-teal-50",   border: "border-teal-500 dark:border-teal-400",  dot: "bg-teal-500 dark:bg-teal-400",  cellBg: "bg-teal-50/60 dark:bg-teal-950/40"  },
  { bg: "bg-violet-100 dark:bg-violet-900/70",text:"text-violet-950 dark:text-violet-50",border:"border-violet-500 dark:border-violet-400",dot:"bg-violet-500 dark:bg-violet-400",cellBg:"bg-violet-50/60 dark:bg-violet-950/40"},
  { bg: "bg-orange-100 dark:bg-orange-900/70",text:"text-orange-950 dark:text-orange-50",border:"border-orange-500 dark:border-orange-400",dot:"bg-orange-500 dark:bg-orange-400",cellBg:"bg-orange-50/60 dark:bg-orange-950/40"},
  { bg: "bg-rose-100 dark:bg-rose-900/70",   text: "text-rose-950 dark:text-rose-50",   border: "border-rose-500 dark:border-rose-400",  dot: "bg-rose-500 dark:bg-rose-400",  cellBg: "bg-rose-50/60 dark:bg-rose-950/40"  },
] as const;

interface ScheduleTableProps {
  schedule:      MonthSchedule;
  employees:     readonly Employee[];
  onShiftChange: (wi: number, empId: string, date: string, shift: string, note?: string) => void;
  onGuardChange: (wi: number, empId: string | null) => void;
}

function ScheduleTable({ schedule, employees, onShiftChange, onGuardChange }: ScheduleTableProps) {
  return (
    /* 2 weeks per row on xl screens — halves vertical scroll */
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {schedule.weeks.map((week, weekIndex) => (
        <WeekCard
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

// ── Week Card ─────────────────────────────────────────────────────────────────

interface WeekCardProps {
  week:          WeekSchedule;
  weekIndex:     number;
  employees:     readonly Employee[];
  month:         number;
  onShiftChange: (wi: number, empId: string, date: string, shift: string, note?: string) => void;
  onGuardChange: (wi: number, empId: string | null) => void;
}

function WeekCard({ week, weekIndex, employees, month, onShiftChange, onGuardChange }: WeekCardProps) {
  const weekStart = parseLocalDate(week.startDate);
  const dates     = getDatesInWeek(weekStart);

  const isOutside = (d: Date) => d.getMonth() + 1 !== month;

  // Compact date range from in-month days only
  const inMonth     = dates.filter((d) => !isOutside(d));
  const rangeFirst  = inMonth[0];
  const rangeLast   = inMonth[inMonth.length - 1];
  const rangeLabel  = rangeFirst && rangeLast
    ? `${rangeFirst.getDate()}/${rangeFirst.getMonth()+1} — ${rangeLast.getDate()}/${rangeLast.getMonth()+1}`
    : "";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500 text-white text-sm font-black flex-shrink-0 select-none shadow-sm">
          {weekIndex + 1}
        </span>
        <div>
          <p className="text-white text-sm font-bold leading-tight">Semana {weekIndex + 1}</p>
          <p className="text-slate-400 text-xs leading-tight">{rangeLabel}</p>
        </div>
      </div>

      {/* ── Table: days as rows, employees as columns ── */}
      <div className="flex-1 overflow-x-auto bg-white dark:bg-slate-800">
        <table className="w-full border-collapse">

          {/* Employee column headers */}
          <thead>
            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
              {/* Day label column */}
              <th className="w-[72px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700" />

              {/* One column per employee */}
              {employees.map((emp, ei) => {
                const c = EMPLOYEE_COLORS[ei % EMPLOYEE_COLORS.length];
                return (
                  <th
                    key={emp.id}
                    className={`py-3 px-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${c.bg}`}
                  >
                    <span className={`flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap ${c.text}`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} aria-hidden="true" />
                      {emp.name}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* One row per day */}
          <tbody>
            {dates.map((date, di) => {
              const dateStr = formatDate(date);
              const isWknd  = date.getDay() === 0 || date.getDay() === 6;
              const outside = isOutside(date);

              return (
                <tr
                  key={dateStr}
                  className={`
                    border-b border-slate-100 dark:border-slate-700/60 last:border-b-0
                    ${isWknd ? "bg-slate-50/80 dark:bg-slate-700/30" : ""}
                    ${outside ? "opacity-30" : ""}
                  `}
                >
                  {/* Day label */}
                  <td className={`
                    px-3 py-2 border-r border-slate-200 dark:border-slate-700 select-none
                    bg-slate-50 dark:bg-slate-900 w-[72px]
                  `}>
                    <div className={`text-xs font-bold leading-tight ${isWknd ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {DAY_SHORT[di]}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight font-medium">
                      {date.getDate()}/{date.getMonth()+1}
                    </div>
                  </td>

                  {/* Shift cell per employee */}
                  {employees.map((emp) => {
                    const row        = week.rows.find((r) => r.employeeId === emp.id);
                    const assignment = row?.days[dateStr] ?? { shift: "FRANCO" };
                    return (
                      <ShiftCell
                        key={emp.id}
                        date={dateStr}
                        employeeId={emp.id}
                        assignment={assignment}
                        dimmed={false}
                        onShiftChange={(eId, d, s, n) => onShiftChange(weekIndex, eId, d, s, n)}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Guard footer ── */}
      <GuardWeekFooter
        guards={week.guards}
        employees={employees}
        onGuardChange={(empId) => onGuardChange(weekIndex, empId)}
      />
    </div>
  );
}
