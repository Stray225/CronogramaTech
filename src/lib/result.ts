/**
 * Result<T, E> — discriminated union for explicit error handling.
 * Use Ok(value) for success paths and Err(error) for failure paths.
 * Never throw inside functions that return Result.
 */

export type Result<T, E = import("./errors").AppError> =
  | { readonly ok: true;  readonly value: T }
  | { readonly ok: false; readonly error: E };

export function Ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

export function Err<E>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}

/** Unwrap or throw — only for cases where failure is truly unexpected. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

/** Map over a successful Result without changing the error type. */
export function mapOk<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}
