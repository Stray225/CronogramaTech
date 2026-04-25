import { ShiftDefinition } from "@/types/schedule";

export const SHIFTS: ShiftDefinition[] = [
  {
    code: "FRANCO",
    label: "FRANCO",
    hours: 0,
    color: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-400 dark:text-slate-500",
    exportColor: "FFE2E8F0",
  },
  {
    code: "06:00-16:00",
    label: "06:00-16:00",
    hours: 10,
    color: "bg-green-200 dark:bg-green-900",
    textColor: "text-green-800 dark:text-green-300",
    exportColor: "FFD1FAE5",
  },
  {
    code: "06:00-14:00",
    label: "06:00-14:00",
    hours: 8,
    color: "bg-green-100 dark:bg-green-950",
    textColor: "text-green-700 dark:text-green-400",
    exportColor: "FFECFDF5",
  },
  {
    code: "09:00-17:00",
    label: "09:00-17:00",
    hours: 8,
    color: "bg-teal-100 dark:bg-teal-900",
    textColor: "text-teal-700 dark:text-teal-300",
    exportColor: "FFCCFBF1",
  },
  {
    code: "14:00-22:00",
    label: "14:00-22:00",
    hours: 8,
    color: "bg-orange-200 dark:bg-orange-900",
    textColor: "text-orange-800 dark:text-orange-300",
    exportColor: "FFFED7AA",
  },
  {
    code: "13:00-22:00",
    label: "13:00-22:00",
    hours: 9,
    color: "bg-amber-200 dark:bg-amber-900",
    textColor: "text-amber-800 dark:text-amber-300",
    exportColor: "FFFDE68A",
  },
  {
    code: "08:00-20:00",
    label: "08:00-20:00",
    hours: 12,
    color: "bg-blue-200 dark:bg-blue-900",
    textColor: "text-blue-800 dark:text-blue-300",
    exportColor: "FFBFDBFE",
  },
  {
    code: "08:00-02:00",
    label: "08:00-02:00",
    hours: 18,
    color: "bg-purple-200 dark:bg-purple-900",
    textColor: "text-purple-800 dark:text-purple-300",
    exportColor: "FFE9D5FF",
  },
  {
    code: "GUARDIA",
    label: "GUARDIA",
    hours: 8,
    color: "bg-pink-200 dark:bg-pink-900",
    textColor: "text-pink-800 dark:text-pink-300",
    exportColor: "FFFECDD3",
  },
  {
    code: "FERIADO",
    label: "FERIADO",
    hours: 0,
    color: "bg-red-200 dark:bg-red-900",
    textColor: "text-red-700 dark:text-red-300",
    exportColor: "FFFECACA",
  },
  {
    code: "CUMPLEAÑOS",
    label: "CUMPLEAÑOS",
    hours: 0,
    color: "bg-violet-200 dark:bg-violet-900",
    textColor: "text-violet-800 dark:text-violet-300",
    exportColor: "FFDDD6FE",
  },
  {
    code: "VACACIONES",
    label: "VACACIONES",
    hours: 0,
    color: "bg-sky-200 dark:bg-sky-900",
    textColor: "text-sky-800 dark:text-sky-300",
    exportColor: "FFE0F2FE",
  },
];

// Re-exported from constants for backward compatibility
export { GUARD_HOURS_WEEKDAY, GUARD_HOURS_WEEKEND } from "@/constants/app";

export function getShift(code: string): ShiftDefinition {
  return (
    SHIFTS.find((s) => s.code === code) ?? {
      code,
      label: code,
      hours: 0,
      color: "bg-gray-200 dark:bg-slate-800",
      textColor: "text-gray-700 dark:text-slate-400",
      exportColor: "FFE5E7EB",
    }
  );
}

export const WEEK_PATTERNS: Record<string, Record<string, string>> = {
  MAÑANA: {
    monday: "06:00-14:00",
    tuesday: "06:00-14:00",
    wednesday: "06:00-14:00",
    thursday: "06:00-14:00",
    friday: "06:00-14:00",
    saturday: "FRANCO",
    sunday: "FRANCO",
  },
  MEDIA: {
    monday: "09:00-17:00",
    tuesday: "09:00-17:00",
    wednesday: "09:00-17:00",
    thursday: "09:00-17:00",
    friday: "09:00-17:00",
    saturday: "FRANCO",
    sunday: "FRANCO",
  },
  TARDE: {
    monday: "FRANCO",
    tuesday: "FRANCO",
    wednesday: "14:00-22:00",
    thursday: "14:00-22:00",
    friday: "14:00-22:00",
    saturday: "08:00-20:00",
    sunday: "08:00-20:00",
  },
};

export const PATTERN_NAMES = ["MAÑANA", "MEDIA", "TARDE"] as const;
