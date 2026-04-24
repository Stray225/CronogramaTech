"use client";

import { Employee, EmployeeStats } from "@/types/schedule";

// One accent color per employee slot (up to 4)
const ACCENTS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

// ── Shared card tokens ──────────────────────────────────────────────────────
export const CARD_CLS    = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm";
export const CARD_HDR    = "text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4";
export const CARD_DIVIDER = "border-t border-slate-100 dark:border-slate-700";

interface SummaryPanelProps {
  stats: EmployeeStats[];
  employees: Employee[];
}

function HoursBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1 mt-1">
      <div className={`${color} h-1 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SummaryPanel({ stats, employees }: SummaryPanelProps) {
  const maxHours = Math.max(...stats.map((s) => s.totalHours), 1);

  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className={CARD_HDR}>Resumen mensual</h2>

      <div className="space-y-4">
        {stats.map((s, idx) => {
          const emp    = employees.find((e) => e.id === s.employeeId);
          const accent = ACCENTS[idx % ACCENTS.length];
          return (
            <div key={s.employeeId}>
              {/* Name + hours */}
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${accent} flex-shrink-0`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {emp?.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                  {s.totalHours}h
                </span>
              </div>

              <HoursBar value={s.totalHours} max={maxHours} color={accent} />

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <StatBadge
                  value={s.guardCount}
                  label="guar."
                  activeClass="bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300"
                />
                <StatBadge
                  value={s.holidayCount}
                  label="feriado"
                  activeClass="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                />
                <StatBadge
                  value={s.weekendDaysWorked}
                  label="fin sem."
                  activeClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                />
                <StatBadge
                  value={s.francoCount}
                  label="franco"
                  activeClass="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  alwaysShow
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`mt-5 pt-4 ${CARD_DIVIDER}`}>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
          Referencia
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {LEGEND_ITEMS.map(({ bg, label }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${bg} border border-slate-200 dark:border-slate-600 flex-shrink-0`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  value,
  label,
  activeClass,
  alwaysShow = false,
}: {
  value: number;
  label: string;
  activeClass: string;
  alwaysShow?: boolean;
}) {
  if (!alwaysShow && value === 0) return null;
  const cls = value > 0 ? activeClass : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>
      {value}
      <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}

const LEGEND_ITEMS = [
  { bg: "bg-green-200 dark:bg-green-900",   label: "Mañana"  },
  { bg: "bg-orange-200 dark:bg-orange-900", label: "Tarde"   },
  { bg: "bg-blue-200 dark:bg-blue-900",     label: "Larga"   },
  { bg: "bg-slate-100 dark:bg-slate-700",   label: "Franco"  },
  { bg: "bg-pink-200 dark:bg-pink-900",     label: "Guardia" },
  { bg: "bg-red-200 dark:bg-red-900",       label: "Feriado" },
  { bg: "bg-violet-200 dark:bg-violet-900", label: "Cumple"  },
  { bg: "bg-sky-200 dark:bg-sky-900",       label: "Vacac."  },
];
