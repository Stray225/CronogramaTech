"use client";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const inputCls = `
    border border-slate-600 dark:border-slate-600
    rounded-lg px-3 py-1.5 text-xs font-medium
    text-slate-200 bg-slate-700 dark:bg-slate-700
    focus:outline-none focus:ring-2 focus:ring-indigo-400
    transition-colors
  `;

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
        className={inputCls}
      >
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      <input
        type="number"
        value={year}
        min={2024}
        max={2030}
        onChange={(e) => onChange(month, Number(e.target.value))}
        className={`${inputCls} w-20 text-center`}
      />
    </div>
  );
}
