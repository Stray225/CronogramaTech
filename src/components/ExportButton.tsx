"use client";

import { useState } from "react";
import { Employee, MonthSchedule } from "@/types/schedule";
import { EXPORT_API_PATH } from "@/constants/app";

interface ExportButtonProps {
  schedule: MonthSchedule;
  employees: readonly Employee[];
  history?: readonly MonthSchedule[];
  onSuccess?: () => void;
  onError?: (message?: string) => void;
}

export default function ExportButton({
  schedule,
  employees,
  history = [],
  onSuccess,
  onError,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(EXPORT_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule, employees, history }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        onError?.(json.message);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const m    = String(schedule.month).padStart(2, "0");
      a.href     = url;
      a.download = `Cronograma_${schedule.year}-${m}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      onSuccess?.();
    } catch {
      onError?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      aria-label={loading ? "Generando archivo Excel..." : "Exportar cronograma a Excel"}
      aria-busy={loading}
      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 shadow-sm hover:shadow"
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3"/>
          </svg>
          Exportar Excel
        </>
      )}
    </button>
  );
}
