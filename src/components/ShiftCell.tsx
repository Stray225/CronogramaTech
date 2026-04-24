"use client";

import { memo, useEffect, useRef, useState } from "react";
import { DayAssignment } from "@/types/schedule";
import { SHIFTS, getShift } from "@/config/shifts";

interface ShiftCellProps {
  date: string;
  employeeId: string;
  assignment: DayAssignment;
  onShiftChange: (employeeId: string, date: string, shift: string, note?: string) => void;
  dimmed?: boolean;
}

function ShiftCell({ date, employeeId, assignment, onShiftChange, dimmed = false }: ShiftCellProps) {
  const [open, setOpen]           = useState(false);
  const [noteInput, setNoteInput] = useState(assignment.note ?? "");
  const [showNote, setShowNote]   = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const shift = getShift(assignment.shift);

  useEffect(() => { setNoteInput(assignment.note ?? ""); }, [assignment.note]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNote(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSelect(code: string) {
    onShiftChange(employeeId, date, code, noteInput || undefined);
    if (code === "CUMPLEAÑOS" || code === "FERIADO") {
      setShowNote(true);
    } else {
      setOpen(false);
      setShowNote(false);
    }
  }

  function handleNoteSave() {
    onShiftChange(employeeId, date, assignment.shift, noteInput || undefined);
    setOpen(false);
    setShowNote(false);
  }

  const shiftLabel = shift.label;

  return (
    <td
      className={`relative p-0 border border-slate-100 dark:border-slate-700 ${dimmed ? "opacity-30" : ""}`}
    >
      {/* Cell content */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Turno: ${shiftLabel}${assignment.note ? `, nota: ${assignment.note}` : ""}. Clic para cambiar.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" || e.key === " " ? setOpen((v) => !v) : undefined}
        className={`
          ${shift.color} ${shift.textColor}
          text-xs font-bold text-center
          px-2 py-3.5 cursor-pointer select-none
          min-h-[56px] flex flex-col items-center justify-center gap-1
          transition-all duration-100
          hover:brightness-95 dark:hover:brightness-110
          ${open ? "ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500 brightness-95" : ""}
        `}
      >
        <span className="leading-tight">{shift.label}</span>
        {assignment.note && (
          <span className="text-[10px] font-normal opacity-80 truncate max-w-[110px] leading-none">
            {assignment.note}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={ref}
          role="listbox"
          aria-label="Seleccionar turno"
          className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl min-w-[168px] overflow-hidden animate-slide-down"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {SHIFTS.map((s) => (
              <button
                key={s.code}
                role="option"
                aria-selected={assignment.shift === s.code}
                onClick={() => handleSelect(s.code)}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs transition-colors
                  hover:bg-slate-50 dark:hover:bg-slate-700
                  ${assignment.shift === s.code
                    ? "font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700"
                    : "text-slate-700 dark:text-slate-300"}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color} border border-slate-300 dark:border-slate-500`} />
                {s.label}
                {s.hours > 0 && (
                  <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    {s.hours}h
                  </span>
                )}
              </button>
            ))}
          </div>

          {showNote && (
            <div className="border-t border-slate-200 dark:border-slate-600 p-2 flex gap-1.5">
              <input
                autoFocus
                type="text"
                aria-label="Nota para este día"
                placeholder="Nota opcional..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNoteSave()}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-slate-400"
              />
              <button
                onClick={handleNoteSave}
                aria-label="Guardar nota"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </td>
  );
}

export default memo(ShiftCell);
