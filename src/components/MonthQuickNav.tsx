"use client";

import { useState } from "react";
import { MIN_YEAR, MAX_YEAR } from "@/constants/app";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const MONTHS_SHORT = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

interface MonthQuickNavProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthQuickNav({ month, year, onChange }: MonthQuickNavProps) {
  const [open, setOpen] = useState(true);

  const today       = new Date();
  const todayMonth  = today.getMonth() + 1;
  const todayYear   = today.getFullYear();

  return (
    <>
      {/* Spacer so page content isn't hidden behind the bar */}
      <div className={open ? "h-16" : "h-8"} aria-hidden="true" />

      {/* Fixed bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">

        {/* ── Toggle tab ── */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Ocultar barra de meses" : "Mostrar barra de meses"}
            className={`
              flex items-center gap-1.5 px-5 py-1 rounded-t-lg text-[11px] font-semibold
              border border-b-0 transition-all duration-150
              ${open
                ? "bg-slate-700 dark:bg-slate-900 border-slate-600 dark:border-slate-700 text-slate-300"
                : "bg-slate-800 dark:bg-slate-950 border-slate-600 dark:border-slate-700 text-slate-400 hover:text-white"}
            `}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
            </svg>
            {open ? "Ocultar meses" : `${MONTHS_SHORT[month - 1]} ${year}`}
          </button>
        </div>

        {/* ── Main bar ── */}
        <div
          className={`
            overflow-hidden transition-all duration-200 ease-in-out
            ${open ? "max-h-20 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
          `}
        >
          <div className="bg-slate-800 dark:bg-slate-950 border-t border-slate-600 dark:border-slate-700 shadow-2xl w-full px-4">
            <div className="max-w-screen-2xl mx-auto flex items-center gap-2 h-14">

              {/* Year back */}
              <button
                onClick={() => year > MIN_YEAR && onChange(month, year - 1)}
                disabled={year <= MIN_YEAR}
                aria-label="Año anterior"
                className="flex-shrink-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              {/* Year label */}
              <span className="flex-shrink-0 text-slate-300 text-xs font-bold w-10 text-center tabular-nums select-none">
                {year}
              </span>

              {/* Year forward */}
              <button
                onClick={() => year < MAX_YEAR && onChange(month, year + 1)}
                disabled={year >= MAX_YEAR}
                aria-label="Año siguiente"
                className="flex-shrink-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-600 mx-1 flex-shrink-0" aria-hidden="true" />

              {/* Month pills — fill remaining space evenly */}
              <div className="flex-1 grid grid-cols-12 gap-1">
                {MONTHS.map((name, i) => {
                  const m          = i + 1;
                  const isSelected = m === month && year === year;
                  const isToday    = m === todayMonth && year === todayYear;

                  return (
                    <button
                      key={m}
                      onClick={() => onChange(m, year)}
                      aria-label={`Ir a ${name} ${year}`}
                      aria-pressed={isSelected}
                      className={`
                        relative flex flex-col items-center justify-center gap-0.5
                        rounded-lg py-1.5 text-center transition-all duration-100 select-none
                        ${isSelected
                          ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-800"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"}
                      `}
                    >
                      <span className={`text-[11px] font-bold leading-none ${isSelected ? "text-white" : ""}`}>
                        {MONTHS_SHORT[i]}
                      </span>

                      {/* "Hoy" indicator — always visible dot */}
                      {isToday && (
                        <span
                          className={`block w-1 h-1 rounded-full ${isSelected ? "bg-emerald-300" : "bg-emerald-400"}`}
                          aria-label="Mes actual"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
