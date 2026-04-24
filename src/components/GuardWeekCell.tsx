"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Employee, GuardDay } from "@/types/schedule";
import { GUARD_TIME_WEEKDAY, GUARD_TIME_WEEKEND } from "@/constants/app";

interface GuardWeekFooterProps {
  guards:         readonly GuardDay[];
  employees:      readonly Employee[];
  onGuardChange:  (employeeId: string | null) => void;
}

/** Renders as a <div> footer below the week card table — not inside a <td>. */
function GuardWeekFooter({ guards, employees, onGuardChange }: GuardWeekFooterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const assignedId = guards.find((g) => g.employeeId !== null)?.employeeId ?? null;
  const employee   = employees.find((e) => e.id === assignedId) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative border-t-2 border-pink-200 dark:border-pink-900">
      {/* Trigger bar */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Guardia semanal: ${employee ? employee.name : "Sin asignar"}. Clic para cambiar.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)}
        className={`
          w-full flex items-center gap-3 px-4 py-3
          bg-pink-50 dark:bg-pink-950/50
          hover:bg-pink-100 dark:hover:bg-pink-900/40
          cursor-pointer select-none transition-colors
          ${open ? "ring-2 ring-inset ring-pink-400" : ""}
        `}
      >
        {/* Moon icon */}
        <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-pink-200 dark:bg-pink-900">
          <svg className="w-3.5 h-3.5 text-pink-600 dark:text-pink-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-none mb-0.5">
            Guardia nocturna
          </p>
          {employee ? (
            <p className="text-sm font-bold text-pink-900 dark:text-pink-100 leading-tight truncate">
              {employee.name}
              <span className="ml-2 text-xs font-normal text-pink-500 dark:text-pink-400">
                Lu–Vi {GUARD_TIME_WEEKDAY} · Sá–Do {GUARD_TIME_WEEKEND}
              </span>
            </p>
          ) : (
            <p className="text-xs italic text-pink-400 dark:text-pink-600 leading-tight">
              Sin asignar — clic para asignar
            </p>
          )}
        </div>

        <svg className="w-4 h-4 text-pink-400 dark:text-pink-600 flex-shrink-0 transition-transform duration-150" style={{ transform: open ? "rotate(180deg)" : "none" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {/* Dropdown — opens upward */}
      {open && (
        <div
          ref={ref}
          role="listbox"
          aria-label="Seleccionar guardia semanal"
          className="absolute z-50 bottom-full left-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-56 overflow-hidden animate-slide-down"
        >
          <div className="py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Guardia semanal
            </div>
            <button
              role="option"
              aria-selected={assignedId === null}
              onClick={() => { onGuardChange(null); setOpen(false); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="inline-block w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600 border border-slate-300 flex-shrink-0" />
              Sin guardia
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            {employees.map((emp) => (
              <button
                key={emp.id}
                role="option"
                aria-selected={assignedId === emp.id}
                onClick={() => { onGuardChange(emp.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors
                  hover:bg-pink-50 dark:hover:bg-pink-900/30
                  ${assignedId === emp.id
                    ? "font-bold text-pink-800 dark:text-pink-200 bg-pink-50 dark:bg-pink-900/30"
                    : "text-slate-700 dark:text-slate-300"}`}
              >
                <span className="inline-block w-3 h-3 rounded-full bg-pink-400 border border-pink-500 flex-shrink-0" />
                {emp.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(GuardWeekFooter);
