"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Employee, GuardDay } from "@/types/schedule";
import { isWeekend, parseLocalDate } from "@/lib/dateUtils";

interface GuardCellProps {
  guard: GuardDay;
  employees: Employee[];
  onGuardChange: (date: string, employeeId: string | null) => void;
  dimmed?: boolean;
}

function GuardCell({ guard, employees, onGuardChange, dimmed = false }: GuardCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const employee  = employees.find((e) => e.id === guard.employeeId);
  const date      = parseLocalDate(guard.date);
  const isWknd    = isWeekend(date);
  const guardHours = isWknd ? "20:00-08:00" : "22:00-06:00";

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
      className={`relative p-0 border border-pink-200 dark:border-pink-900 ${dimmed ? "opacity-35" : ""}`}
      style={{ minWidth: "96px" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Guardia: ${employee ? employee.name : "Sin asignar"} (${guardHours}). Clic para cambiar.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" || e.key === " " ? setOpen((v) => !v) : undefined}
        title={guardHours}
        className={`
          bg-pink-100 dark:bg-pink-900/40
          text-pink-800 dark:text-pink-300
          text-[11px] font-semibold text-center
          px-1 py-2.5 cursor-pointer select-none
          min-h-[44px] flex flex-col items-center justify-center gap-0.5
          transition-all duration-100
          hover:bg-pink-200 dark:hover:bg-pink-900/60
          ${open ? "ring-2 ring-inset ring-pink-400" : ""}
        `}
      >
        {employee ? (
          <>
            <span>{employee.name}</span>
            <span className="text-[9px] font-normal opacity-60 leading-none">{guardHours}</span>
          </>
        ) : (
          <span className="text-pink-300 dark:text-pink-700 font-normal text-base leading-none">—</span>
        )}
      </div>

      {open && (
        <div
          ref={ref}
          role="listbox"
          aria-label="Seleccionar guardia"
          className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl min-w-[152px] overflow-hidden animate-slide-down"
        >
          <div className="py-1">
            <button
              role="option"
              aria-selected={guard.employeeId === null}
              onClick={() => { onGuardChange(guard.date, null); setOpen(false); }}
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
                aria-selected={guard.employeeId === emp.id}
                onClick={() => { onGuardChange(guard.date, emp.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs transition-colors
                  hover:bg-pink-50 dark:hover:bg-pink-900/30
                  ${guard.employeeId === emp.id
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

export default memo(GuardCell);
