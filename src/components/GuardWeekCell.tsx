"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Employee, GuardDay } from "@/types/schedule";
import { GUARD_TIME_WEEKDAY, GUARD_TIME_WEEKEND } from "@/constants/app";

interface GuardWeekCellProps {
  guards: readonly GuardDay[];
  employees: readonly Employee[];
  /** Called when the user selects an employee (or null = sin guardia) for the whole week. */
  onGuardChange: (employeeId: string | null) => void;
}

function GuardWeekCell({ guards, employees, onGuardChange }: GuardWeekCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Derive the assigned employee from any non-null guard in the week
  const assignedId = guards.find((g) => g.employeeId !== null)?.employeeId ?? null;
  const employee   = employees.find((e) => e.id === assignedId) ?? null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <td
      colSpan={7}
      className="relative p-0 border border-pink-200 dark:border-pink-900"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Guardia semanal: ${employee ? employee.name : "Sin asignar"}. Clic para cambiar.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)}
        className={`
          bg-pink-50 dark:bg-pink-950/60
          text-pink-900 dark:text-pink-100
          text-sm font-semibold
          px-4 py-3.5 cursor-pointer select-none
          min-h-[56px] flex items-center gap-3
          transition-all duration-100
          hover:bg-pink-100 dark:hover:bg-pink-900/50
          ${open ? "ring-2 ring-inset ring-pink-400" : ""}
        `}
      >
        {/* Icon */}
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-200 dark:bg-pink-800 flex-shrink-0">
          <svg className="w-3 h-3 text-pink-600 dark:text-pink-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </span>

        {employee ? (
          <>
            <span className="font-bold text-pink-950 dark:text-pink-100 text-sm">{employee.name}</span>
            <span className="text-xs font-normal text-pink-600 dark:text-pink-300">
              Lu-Vi {GUARD_TIME_WEEKDAY} · Sá-Do {GUARD_TIME_WEEKEND}
            </span>
          </>
        ) : (
          <span className="text-pink-500 dark:text-pink-500 font-normal italic text-sm">
            Sin guardia asignada — clic para asignar
          </span>
        )}

        <svg className="w-3.5 h-3.5 ml-auto text-pink-400 dark:text-pink-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {open && (
        <div
          ref={ref}
          role="listbox"
          aria-label="Seleccionar guardia semanal"
          className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl min-w-[200px] overflow-hidden animate-slide-down"
        >
          <div className="py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Guardia semanal
            </div>
            <button
              role="option"
              aria-selected={assignedId === null}
              onClick={() => { onGuardChange(null); setOpen(false); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 flex-shrink-0" />
              Sin guardia
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            {employees.map((emp) => (
              <button
                key={emp.id}
                role="option"
                aria-selected={assignedId === emp.id}
                onClick={() => { onGuardChange(emp.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs transition-colors
                  hover:bg-pink-50 dark:hover:bg-pink-900/30
                  ${assignedId === emp.id
                    ? "font-bold text-pink-800 dark:text-pink-200 bg-pink-50 dark:bg-pink-900/30"
                    : "text-slate-700 dark:text-slate-300"}`}
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-400 border border-pink-500 flex-shrink-0" />
                {emp.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </td>
  );
}

export default memo(GuardWeekCell);
