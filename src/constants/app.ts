/**
 * Application-wide constants.
 * Import from here — never hardcode these values inline.
 */

// ── Storage ───────────────────────────────────────────────────────────────────
export const STORAGE_KEY        = "cronograma_tech_support_v1" as const;
export const STORAGE_VERSION    = 1 as const;
export const MAX_HISTORY_MONTHS = 12 as const;

// ── Display ───────────────────────────────────────────────────────────────────
export const HISTORY_DISPLAY_MONTHS = 2 as const;

// ── Guard hours ───────────────────────────────────────────────────────────────
export const GUARD_HOURS_WEEKDAY = 8  as const;
export const GUARD_HOURS_WEEKEND = 12 as const;

/** Formatted time ranges shown in the UI and export. */
export const GUARD_TIME_WEEKDAY = "22:00-06:00" as const;
export const GUARD_TIME_WEEKEND = "20:00-08:00" as const;

// ── Calendar ─────────────────────────────────────────────────────────────────
export const MIN_YEAR = 2024 as const;
export const MAX_YEAR = 2030 as const;

/** Week starts on Monday (ISO 8601). Sunday = 0 in JS, Saturday = 6. */
export const WEEKEND_DAYS = new Set([0, 6] as const);

// ── UI ────────────────────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 3_500 as const;

// ── Export ───────────────────────────────────────────────────────────────────
export const EXPORT_API_PATH    = "/api/export" as const;
export const EXPORT_TIMEOUT_MS  = 30_000 as const;

// ── Theme ────────────────────────────────────────────────────────────────────
export const THEME_STORAGE_KEY = "theme" as const;
export const THEME_DARK        = "dark"  as const;
export const THEME_LIGHT       = "light" as const;
