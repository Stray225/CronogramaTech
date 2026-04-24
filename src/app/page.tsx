"use client";

import { useState } from "react";
import { EMPLOYEES } from "@/config/employees";
import { calculateStats } from "@/lib/scheduleRules";
import { getMonthLabel } from "@/lib/dateUtils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useToast } from "@/hooks/useToast";
import { useSchedule } from "@/hooks/useSchedule";
import MonthSelector from "@/components/MonthSelector";
import MonthQuickNav from "@/components/MonthQuickNav";
import ScheduleTable from "@/components/ScheduleTable";
import SummaryPanel from "@/components/SummaryPanel";
import HistoryPanel from "@/components/HistoryPanel";
import ExportButton from "@/components/ExportButton";
import { Toast } from "@/hooks/useToast";

// ── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  );
}

// ── Toast item ────────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { id, type, msg } = toast;
  const colorCls =
    type === "success"
      ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
      : type === "error"
      ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
      : "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`animate-toast-in pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-xs border ${colorCls}`}
    >
      <span className="text-base leading-none mt-0.5" aria-hidden="true">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      <span className="leading-snug">{msg}</span>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Cerrar notificación"
        className="ml-auto opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
      >
        ×
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());

  const { dark, toggle: toggleDark, mounted } = useDarkMode();
  const { toasts, show: showToast, dismiss } = useToast();
  const {
    schedule,
    history,
    errorLabel,
    clearError,
    updateShift,
    updateWeekGuard,
    applySuggestion,
    reset,
  } = useSchedule(year, month, EMPLOYEES);

  // Surface storage errors via toast, then clear them
  if (errorLabel) {
    showToast("error", errorLabel);
    clearError();
  }

  if (!schedule) return null;

  const stats = calculateStats(schedule, EMPLOYEES);

  function handleSuggest() {
    applySuggestion();
    showToast("info", "Asignación sugerida aplicada. Podés editar cualquier celda.");
  }

  function handleReset() {
    if (!confirm("¿Borrar el cronograma actual y empezar en blanco?")) return;
    reset();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── Header ── */}
      <header className="bg-slate-800 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight tracking-wide">
                Cronograma Tech Support
              </h1>
              <p className="text-slate-400 text-[11px] leading-tight">
                {getMonthLabel(month, year)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <MonthSelector
              month={month}
              year={year}
              onChange={(m, y) => { setMonth(m); setYear(y); }}
            />

            <div className="h-6 w-px bg-slate-600 hidden sm:block" aria-hidden="true" />

            <button
              onClick={handleSuggest}
              aria-label="Sugerir asignación automática para el mes"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 shadow-sm hover:shadow"
            >
              <BoltIcon />
              Sugerir asignación
            </button>

            <ExportButton
              schedule={schedule}
              employees={EMPLOYEES}
              history={history}
              onSuccess={() => showToast("success", "Cronograma exportado correctamente.")}
              onError={() => showToast("error", "Error al exportar. Intentá de nuevo.")}
            />

            <div className="h-6 w-px bg-slate-600 hidden sm:block" aria-hidden="true" />

            <button
              onClick={handleReset}
              title="Limpiar cronograma"
              aria-label="Limpiar cronograma y empezar en blanco"
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <TrashIcon />
            </button>

            {mounted && (
              <button
                onClick={toggleDark}
                title={dark ? "Modo claro" : "Modo oscuro"}
                aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                aria-pressed={dark}
                className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700"
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <ScheduleTable
            schedule={schedule}
            employees={EMPLOYEES}
            onShiftChange={updateShift}
            onGuardChange={updateWeekGuard}
          />
        </div>

        <div className="w-full xl:w-72 flex-shrink-0 space-y-4">
          <SummaryPanel stats={stats} employees={EMPLOYEES} />
          <HistoryPanel history={history} employees={EMPLOYEES} />
        </div>
      </main>

      {/* ── Month quick nav ── */}
      <MonthQuickNav month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

      {/* ── Toast container ── */}
      <div
        role="region"
        aria-label="Notificaciones"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  );
}
