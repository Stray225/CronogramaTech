"use client";

import { memo, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { DayAssignment } from "@/types/schedule";

// ── Per-employee card palette ─────────────────────────────────────────────────
export const EMP_CARD_COLORS = [
  {
    cardBg:     "bg-sky-100 dark:bg-sky-900/60",
    cardBorder: "border-l-[3px] border-sky-500 dark:border-sky-400",
    cardText:   "text-sky-950 dark:text-sky-50",
    cardSub:    "text-sky-600 dark:text-sky-400",
  },
  {
    cardBg:     "bg-teal-100 dark:bg-teal-900/60",
    cardBorder: "border-l-[3px] border-teal-500 dark:border-teal-400",
    cardText:   "text-teal-950 dark:text-teal-50",
    cardSub:    "text-teal-600 dark:text-teal-400",
  },
  {
    cardBg:     "bg-violet-100 dark:bg-violet-900/60",
    cardBorder: "border-l-[3px] border-violet-500 dark:border-violet-400",
    cardText:   "text-violet-950 dark:text-violet-50",
    cardSub:    "text-violet-600 dark:text-violet-400",
  },
  {
    cardBg:     "bg-orange-100 dark:bg-orange-900/60",
    cardBorder: "border-l-[3px] border-orange-500 dark:border-orange-400",
    cardText:   "text-orange-950 dark:text-orange-50",
    cardSub:    "text-orange-600 dark:text-orange-400",
  },
  {
    cardBg:     "bg-rose-100 dark:bg-rose-900/60",
    cardBorder: "border-l-[3px] border-rose-500 dark:border-rose-400",
    cardText:   "text-rose-950 dark:text-rose-50",
    cardSub:    "text-rose-600 dark:text-rose-400",
  },
] as const;

// ── Special shift colors ──────────────────────────────────────────────────────
const SPECIAL_COLORS: Record<string, { cardBg: string; cardBorder: string; cardText: string; cardSub: string }> = {
  FERIADO:    { cardBg: "bg-red-100 dark:bg-red-900/50",    cardBorder: "border-l-[3px] border-red-500",    cardText: "text-red-950 dark:text-red-100",    cardSub: "text-red-600 dark:text-red-400" },
  VACACIONES: { cardBg: "bg-cyan-100 dark:bg-cyan-900/50",  cardBorder: "border-l-[3px] border-cyan-500",   cardText: "text-cyan-950 dark:text-cyan-100",  cardSub: "text-cyan-600 dark:text-cyan-400" },
  CUMPLEAÑOS: { cardBg: "bg-pink-100 dark:bg-pink-900/50",  cardBorder: "border-l-[3px] border-pink-500",   cardText: "text-pink-950 dark:text-pink-100",  cardSub: "text-pink-600 dark:text-pink-400" },
  GUARDIA:    { cardBg: "bg-purple-100 dark:bg-purple-900/50",cardBorder:"border-l-[3px] border-purple-500",cardText:"text-purple-950 dark:text-purple-100",cardSub:"text-purple-600 dark:text-purple-400"},
};

export const PRIMARY_SHIFTS = [
  { code: "06:00-14:00", label: "06:00 – 14:00", tag: "Mañana", hours: "8h" },
  { code: "09:00-17:00", label: "09:00 – 17:00", tag: "Media",  hours: "8h" },
  { code: "14:00-22:00", label: "14:00 – 22:00", tag: "Tarde",  hours: "8h" },
] as const;

function isSpecial(code: string) { return code in SPECIAL_COLORS; }

// ── Props ─────────────────────────────────────────────────────────────────────
interface ShiftCardCellProps {
  date:          string;
  employeeId:    string;
  empColorIdx:   number;
  assignment:    DayAssignment;
  isWeekend:     boolean;
  dimmed?:       boolean;
  onShiftChange: (employeeId: string, date: string, shift: string, note?: string) => void;
}

function ShiftCardCell({
  date, employeeId, empColorIdx, assignment, isWeekend, dimmed = false, onShiftChange,
}: ShiftCardCellProps) {
  const [open,      setOpen]      = useState(false);
  const [noteInput, setNoteInput] = useState(assignment.note ?? "");
  const [showNote,  setShowNote]  = useState(false);

  // Position of the dropdown (fixed, calculated from trigger bounding rect)
  const [dropPos, setDropPos] = useState<{
    top?: number; bottom?: number; left: number; openDown: boolean;
  } | null>(null);
  const DROPDOWN_H = 300; // approximate height in px

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);

  useEffect(() => { setNoteInput(assignment.note ?? ""); }, [assignment.note]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropRef.current   && !dropRef.current.contains(target)
      ) {
        setOpen(false);
        setShowNote(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on scroll so the dropdown doesn't drift
  useEffect(() => {
    if (!open) return;
    const onScroll = () => { setOpen(false); setShowNote(false); };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect      = triggerRef.current.getBoundingClientRect();
    const spaceDown = window.innerHeight - rect.bottom;
    const spaceUp   = rect.top;
    const openDown  = spaceDown >= DROPDOWN_H || spaceDown >= spaceUp;
    setDropPos(
      openDown
        ? { top: rect.bottom + 4, left: rect.left, openDown: true }
        : { bottom: window.innerHeight - rect.top + 4, left: rect.left, openDown: false },
    );
    setOpen((v) => !v);
  }, [DROPDOWN_H]);

  function pick(code: string) {
    onShiftChange(employeeId, date, code, noteInput || undefined);
    if (code === "CUMPLEAÑOS" || code === "FERIADO") setShowNote(true);
    else { setOpen(false); setShowNote(false); }
  }

  function saveNote() {
    onShiftChange(employeeId, date, assignment.shift, noteInput || undefined);
    setOpen(false);
    setShowNote(false);
  }

  const isFranco  = assignment.shift === "FRANCO";
  const special   = isSpecial(assignment.shift) ? SPECIAL_COLORS[assignment.shift] : null;
  const empColor  = EMP_CARD_COLORS[empColorIdx % EMP_CARD_COLORS.length];
  const cardColor = special ?? (isFranco ? null : empColor);

  const display = /^\d\d:/.test(assignment.shift)
    ? assignment.shift.replace("-", " – ")
    : assignment.shift;

  return (
    <td
      className={`relative p-1.5 border-r border-b border-slate-100 dark:border-slate-700/60 last:border-r-0
        ${isWeekend ? "bg-slate-50/80 dark:bg-slate-700/20" : "bg-white dark:bg-slate-800"}
        ${dimmed ? "opacity-30" : ""}
      `}
    >
      {/* ── Shift card or empty zone ── */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={`${assignment.shift} — clic para cambiar`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={openDropdown}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDropdown()}
        className={`
          min-h-[52px] rounded-lg w-full cursor-pointer transition-all duration-100 select-none
          ${cardColor
            ? `${cardColor.cardBg} ${cardColor.cardBorder} px-2.5 py-2 flex flex-col justify-center gap-0.5
               hover:brightness-[0.94] dark:hover:brightness-110`
            : "flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700/50"}
          ${open ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-800" : ""}
        `}
      >
        {cardColor ? (
          <>
            <span className={`text-xs font-bold leading-tight ${cardColor.cardText}`}>{display}</span>
            {assignment.note && (
              <span className={`text-[10px] leading-none truncate ${cardColor.cardSub}`}>{assignment.note}</span>
            )}
          </>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">+</span>
        )}
      </div>

      {/* ── Dropdown — rendered via portal so it never overlaps table rows ── */}
      {open && dropPos && typeof document !== "undefined" && createPortal(
        <div
          ref={dropRef}
          role="listbox"
          style={{
            position: "fixed",
            ...(dropPos.openDown
              ? { top:    dropPos.top }
              : { bottom: dropPos.bottom }),
            left:   dropPos.left,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-64 overflow-hidden animate-slide-down"
        >
          {/* Primary shifts */}
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Turno</p>
            {PRIMARY_SHIFTS.map((s) => {
              const active = assignment.shift === s.code;
              return (
                <button
                  key={s.code}
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(s.code)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${active
                      ? `${empColor.cardBg} ${empColor.cardBorder}`
                      : "hover:bg-slate-50 dark:hover:bg-slate-700"}
                  `}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-bold leading-tight ${active ? empColor.cardText : "text-slate-800 dark:text-slate-200"}`}>{s.label}</p>
                    <p className={`text-[11px] ${active ? empColor.cardSub : "text-slate-400 dark:text-slate-500"}`}>{s.tag} · {s.hours}</p>
                  </div>
                  {active && (
                    <svg className={`w-4 h-4 flex-shrink-0 ${empColor.cardText}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Special options */}
          <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Especiales</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { code: "FRANCO",      label: "Libre",        cls: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" },
                { code: "08:00-20:00", label: "08–20 (Wknd)", cls: "bg-blue-50   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300" },
                { code: "FERIADO",     label: "Feriado",      cls: "bg-red-50    dark:bg-red-900/40    text-red-700    dark:text-red-300" },
                { code: "VACACIONES",  label: "Vacaciones",   cls: "bg-cyan-50   dark:bg-cyan-900/40   text-cyan-700   dark:text-cyan-300" },
                { code: "CUMPLEAÑOS",  label: "Cumpleaños",   cls: "bg-pink-50   dark:bg-pink-900/40   text-pink-700   dark:text-pink-300" },
                { code: "06:00-14:00", label: "06–14 extra",  cls: "bg-slate-100 dark:bg-slate-700     text-slate-600  dark:text-slate-300" },
              ].map((opt) => (
                <button
                  key={opt.code}
                  role="option"
                  aria-selected={assignment.shift === opt.code}
                  onClick={() => pick(opt.code)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${opt.cls}
                    ${assignment.shift === opt.code ? "ring-2 ring-indigo-400" : "hover:brightness-95 dark:hover:brightness-110"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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
              <button
                onClick={saveNote}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </td>
  );
}

export default memo(ShiftCardCell);
