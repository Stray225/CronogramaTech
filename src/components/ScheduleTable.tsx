"use client";

import { memo } from "react";
import { Employee, MonthSchedule, WeekSchedule } from "@/types/schedule";
import { getDatesInWeek, formatDate, parseLocalDate } from "@/lib/dateUtils";
import ShiftCardCell from "./ShiftCardCell";
import GuardWeekFooter from "./GuardWeekCell";

// ── Employee avatar styles (per position) ─────────────────────────────────────
const EMP_AVATAR = [
  { ring: "bg-sky-500",    text: "text-white" },
  { ring: "bg-teal-500",   text: "text-white" },
  { ring: "bg-violet-500", text: "text-white" },
  { ring: "bg-orange-500", text: "text-white" },
  { ring: "bg-rose-500",   text: "text-white" },
] as const;

const DAY_SHORT  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── ScheduleTable ─────────────────────────────────────────────────────────────
interface ScheduleTableProps {
  schedule:      MonthSchedule;
  employees:     readonly Employee[];
  onShiftChange: (wi: number, empId: string, date: string, shift: string, note?: string) => void;
  onGuardChange: (wi: number, empId: string | null) => void;
}

function ScheduleTable({ schedule, employees, onShiftChange, onGuardChange }: ScheduleTableProps) {
  return (
    <div className="space-y-6">
      {schedule.weeks.map((week, wi) => (
        <WeekBlock
          key={week.startDate}
          week={week}
          weekIndex={wi}
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

  const inMonth    = dates.filter((d) => !isOutside(d));
  const rangeLabel = inMonth.length
    ? `${inMonth[0].getDate()}/${inMonth[0].getMonth()+1} — ${inMonth[inMonth.length-1].getDate()}/${inMonth[inMonth.length-1].getMonth()+1}`
    : "";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800">

      {/* ── Week header ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 border-b border-slate-600/40">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500 text-white text-sm font-black select-none shadow-sm flex-shrink-0">
          {weekIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-white font-bold text-sm">Semana {weekIndex + 1}</span>
          <span className="ml-3 text-slate-400 text-xs">{rangeLabel}</span>
        </div>
      </div>

      {/* ── Main table: employees = rows, days = columns ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: "820px" }}>

          {/* Day column headers */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {/* Employee column header */}
              <th
                className="py-2.5 px-4 text-left bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none"
                style={{ width: "164px", minWidth: "164px" }}
              >
                Integrante
              </th>
              {dates.map((date, i) => {
                const isWknd  = date.getDay() === 0 || date.getDay() === 6;
                const outside = isOutside(date);
                return (
                  <th
                    key={i}
                    className={`py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 select-none
                      ${isWknd ? "bg-indigo-50/60 dark:bg-indigo-900/20" : "bg-slate-50 dark:bg-slate-900"}
                      ${outside ? "opacity-40" : ""}
                    `}
                    style={{ minWidth: "110px" }}
                  >
                    <div className={`text-sm font-bold ${isWknd ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {DAY_SHORT[i]}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {date.getDate()}/{date.getMonth()+1}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Employee rows */}
          <tbody>
            {employees.map((emp, ei) => {
              const row    = week.rows.find((r) => r.employeeId === emp.id);
              const avatar = EMP_AVATAR[ei % EMP_AVATAR.length];

              return (
                <tr
                  key={emp.id}
                  className="border-b border-slate-100 dark:border-slate-700/60 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  {/* Employee info cell */}
                  <td className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 text-sm font-black select-none shadow-sm ${avatar.ring} ${avatar.text}`}>
                        {initials(emp.name)}
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {emp.name}
                      </span>
                    </div>
                  </td>

                  {/* Shift card cells — one per day */}
                  {dates.map((date) => {
                    const dateStr    = formatDate(date);
                    const assignment = row?.days[dateStr] ?? { shift: "FRANCO" };
                    return (
                      <ShiftCardCell
                        key={dateStr}
                        date={dateStr}
                        employeeId={emp.id}
                        empColorIdx={ei}
                        assignment={assignment}
                        isWeekend={date.getDay() === 0 || date.getDay() === 6}
                        dimmed={isOutside(date)}
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

      {/* ── Guard section — completely separate from the table ── */}
      <GuardWeekFooter
        guards={week.guards}
        employees={employees}
        onGuardChange={(empId) => onGuardChange(weekIndex, empId)}
      />
    </div>
  );
}
