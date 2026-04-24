"use client";

import { memo, useEffect, useRef, useState } from "react";
import { DayAssignment } from "@/types/schedule";

// ── 3 primary shift blocks ───────────────────────────────────────────────────
export const PRIMARY_SHIFTS = [
  {
    code: "06:00-16:00", label: "06:00 – 16:00", tag: "Mañana", hours: "10h",
    cardBg:    "bg-emerald-50  dark:bg-emerald-900/50",
    cardBorder:"border-l-[3px] border-emerald-500 dark:border-emerald-400",
    cardText:  "text-emerald-900 dark:text-emerald-100",
    cardSub:   "text-emerald-600 dark:text-emerald-400",
    btnBg:     "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  {
    code: "09:00-17:00", label: "09:00 – 17:00", tag: "Media", hours: "8h",
    cardBg:    "bg-sky-50  dark:bg-sky-900/50",
    cardBorder:"border-l-[3px] border-sky-500 dark:border-sky-400",
    cardText:  "text-sky-900 dark:text-sky-100",
    cardSub:   "text-sky-600 dark:text-sky-400",
    btnBg:     "bg-sky-500 hover:bg-sky-600 text-white",
  },
  {
    code: "14:00-22:00", label: "14:00 – 22:00", tag: "Tarde", hours: "8h",
    cardBg:    "bg-amber-50  dark:bg-amber-900/50",
    cardBorder:"border-l-[3px] border-amber-500 dark:border-amber-400",
    cardText:  "text-amber-900 dark:text-amber-100",
    cardSub:   "text-amber-600 dark:text-amber-400",
    btnBg:     "bg-amber-500 hover:bg-amber-600 text-white",
  },
] as const;

// Card style for any shift code (including non-primary ones)
function cardStyle(code: string) {
  if (code === "FRANCO")      return null; // empty cell
  if (code.startsWith("06:")) return PRIMARY_SHIFTS[0];
  if (code.startsWith("09:")) return PRIMARY_SHIFTS[1];
  if (code === "14:00-22:00" || code === "13:00-22:00")
                               return PRIMARY_SHIFTS[2];
  if (code === "08:00-20:00") return { cardBg: "bg-blue-50 dark:bg-blue-900/50",   cardBorder: "border-l-[3px] border-blue-500",   cardText: "text-blue-900 dark:text-blue-100",   cardSub: "text-blue-600 dark:text-blue-400" };
  if (code === "08:00-02:00") return { cardBg: "bg-purple-50 dark:bg-purple-900/50",cardBorder:"border-l-[3px] border-purple-500",  cardText: "text-purple-900 dark:text-purple-100",cardSub:"text-purple-600 dark:text-purple-400"};
  if (code === "FERIADO")     return { cardBg: "bg-red-50 dark:bg-red-900/50",      cardBorder: "border-l-[3px] border-red-500",    cardText: "text-red-900 dark:text-red-100",     cardSub: "text-red-600 dark:text-red-400" };
  if (code === "VACACIONES")  return { cardBg: "bg-cyan-50 dark:bg-cyan-900/50",    cardBorder: "border-l-[3px] border-cyan-500",   cardText: "text-cyan-900 dark:text-cyan-100",   cardSub: "text-cyan-600 dark:text-cyan-400" };
  if (code === "CUMPLEAÑOS")  return { cardBg: "bg-violet-50 dark:bg-violet-900/50",cardBorder:"border-l-[3px] border-violet-500",  cardText: "text-violet-900 dark:text-violet-100",cardSub:"text-violet-600 dark:text-violet-400"};
  return { cardBg: "bg-slate-100 dark:bg-slate-700", cardBorder: "border-l-[3px] border-slate-400", cardText: "text-slate-800 dark:text-slate-200", cardSub: "text-slate-500 dark:text-slate-400" };
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ShiftCardCellProps {
  date:          string;
  employeeId:    string;
  assignment:    DayAssignment;
  isWeekend:     boolean;
  dimmed?:       boolean;
  onShiftChange: (employeeId: string, date: string, shift: string, note?: string) => void;
}

function ShiftCardCell({ date, employeeId, assignment, isWeekend, dimmed = false, onShiftChange }: ShiftCardCellProps) {
  const [open,      setOpen]      = useState(false);
  const [noteInput, setNoteInput] = useState(assignment.note ?? "");
  const [showNote,  setShowNote]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setNoteInput(assignment.note ?? ""); }, [assignment.note]);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowNote(false); }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  function pick(code: string) {
    onShiftChange(employeeId, date, code, noteInput || undefined);
    if (code === "CUMPLEAÑOS" || code === "FERIADO") { setShowNote(true); }
    else { setOpen(false); setShowNote(false); }
  }
  function saveNote() {
    onShiftChange(employeeId, date, assignment.shift, noteInput || undefined);
    setOpen(false); setShowNote(false);
  }

  const style   = cardStyle(assignment.shift);
  const isFranco = !style;
  const display  = assignment.shift.startsWith("0") || assignment.shift.startsWith("1")
    ? assignment.shift.replace("-", " – ")
    : assignment.shift;

  return (
    <td
      className={`relative p-1.5 border-r border-b border-slate-100 dark:border-slate-700/60 last:border-r-0
        ${isWeekend ? "bg-slate-50/80 dark:bg-slate-700/20" : "bg-white dark:bg-slate-800"}
        ${dimmed ? "opacity-30" : ""}
      `}
    >
      {/* ── Shift card (or empty click zone) ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${assignment.shift} — clic para cambiar`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)}
        className={`
          min-h-[52px] rounded-lg w-full cursor-pointer transition-all duration-100 select-none
          ${style
            ? `${style.cardBg} ${style.cardBorder} px-2 py-2 flex flex-col justify-center gap-0.5 hover:brightness-95 dark:hover:brightness-110`
            : "hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-center"
          }
          ${open ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
        `}
      >
        {style ? (
          <>
            <span className={`text-xs font-bold leading-tight ${style.cardText}`}>{display}</span>
            {assignment.note && (
              <span className={`text-[10px] leading-none truncate ${style.cardSub}`}>{assignment.note}</span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium select-none">+</span>
        )}
      </div>

      {/* ── Selector popup — opens UPWARD ── */}
      {open && (
        <div
          ref={ref}
          role="listbox"
          className="absolute z-50 bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-64 overflow-hidden animate-slide-down"
        >
          {/* 3 primary blocks */}
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Turno</p>
            {PRIMARY_SHIFTS.map((s) => (
              <button
                key={s.code}
                role="option"
                aria-selected={assignment.shift === s.code}
                onClick={() => pick(s.code)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${assignment.shift === s.code
                    ? `${s.cardBg} ${s.cardBorder} ring-1 ring-inset ring-current/20`
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"}
                `}
              >
                <div className={`flex-1 ${s.cardText}`}>
                  <p className="text-sm font-bold leading-tight">{s.label}</p>
                  <p className={`text-[11px] ${s.cardSub}`}>{s.tag} · {s.hours}</p>
                </div>
                {assignment.shift === s.code && (
                  <svg className={`w-4 h-4 ${s.cardText}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                )}
              </button>
            ))}
          </div>

          {/* Special options */}
          <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Especiales</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { code: "FRANCO",     label: "Libre",       bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300" },
                { code: "08:00-20:00",label: "08–20 (Wknd)",bg: "bg-blue-50 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
                { code: "FERIADO",    label: "Feriado",     bg: "bg-red-50 dark:bg-red-900/40",   text: "text-red-700 dark:text-red-300" },
                { code: "VACACIONES", label: "Vacaciones",  bg: "bg-cyan-50 dark:bg-cyan-900/40", text: "text-cyan-700 dark:text-cyan-300" },
                { code: "CUMPLEAÑOS", label: "Cumpleaños",  bg: "bg-violet-50 dark:bg-violet-900/40",text:"text-violet-700 dark:text-violet-300"},
                { code: "13:00-22:00",label: "13–22",       bg: "bg-amber-50 dark:bg-amber-900/40",text:"text-amber-700 dark:text-amber-300"},
              ].map((opt) => (
                <button
                  key={opt.code}
                  role="option"
                  aria-selected={assignment.shift === opt.code}
                  onClick={() => pick(opt.code)}
                  className={`
                    px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all
                    ${opt.bg} ${opt.text}
                    ${assignment.shift === opt.code ? "ring-2 ring-indigo-400" : "hover:brightness-95 dark:hover:brightness-110"}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note input (for FERIADO / CUMPLEAÑOS) */}
          {showNote && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex gap-2">
              <input
                autoFocus
                type="text"
                aria-label="Nota"
                placeholder="Nota opcional..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNote()}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={saveNote} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors">OK</button>
            </div>
          )}
        </div>
      )}
    </td>
  );
}

export default memo(ShiftCardCell);
