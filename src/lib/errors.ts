/**
 * AppError — discriminated union for all application-level errors.
 * Every error surface in the app should use one of these codes.
 */

export type AppErrorCode =
  | "STORAGE_READ_FAILED"
  | "STORAGE_WRITE_FAILED"
  | "STORAGE_PARSE_FAILED"
  | "EXPORT_NETWORK_FAILED"
  | "EXPORT_SERVER_FAILED"
  | "EXPORT_VALIDATION_FAILED"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

/** Construct an AppError with an optional underlying cause. */
export function makeError(
  code: AppErrorCode,
  message: string,
  cause?: unknown,
): AppError {
  return { code, message, cause };
}

/** Wrap any unknown thrown value into an AppError. */
export function fromUnknown(cause: unknown, code: AppErrorCode = "UNKNOWN"): AppError {
  const message =
    cause instanceof Error
      ? cause.message
      : typeof cause === "string"
      ? cause
      : "An unexpected error occurred";
  return { code, message, cause };
}

/** Human-readable labels for each error code (for toasts / UI). */
export const ERROR_LABELS: Record<AppErrorCode, string> = {
  STORAGE_READ_FAILED:     "No se pudo leer el almacenamiento local.",
  STORAGE_WRITE_FAILED:    "No se pudo guardar el cronograma.",
  STORAGE_PARSE_FAILED:    "Los datos guardados están corruptos y fueron ignorados.",
  EXPORT_NETWORK_FAILED:   "Error de conexión al exportar. Verificá tu red.",
  EXPORT_SERVER_FAILED:    "El servidor no pudo generar el archivo.",
  EXPORT_VALIDATION_FAILED:"Datos inválidos enviados al exportador.",
  VALIDATION_ERROR:        "Datos de entrada inválidos.",
  UNKNOWN:                 "Ocurrió un error inesperado.",
};
