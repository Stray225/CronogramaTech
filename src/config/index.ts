/**
 * Centralized config re-exports.
 * Import from "@/config" instead of specific config files where possible.
 */
export { EMPLOYEES } from "./employees";
export {
  SHIFTS,
  WEEK_PATTERNS,
  PATTERN_NAMES,
  GUARD_HOURS_WEEKDAY,
  GUARD_HOURS_WEEKEND,
  getShift,
} from "./shifts";
