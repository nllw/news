export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error?: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(error: string, fieldErrors?: FieldErrors): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export function fromZodError<T = undefined>(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] };
}): ActionResult<T> {
  const flat = error.flatten();
  return {
    ok: false,
    error: flat.formErrors[0] ?? "Please fix the highlighted fields.",
    fieldErrors: flat.fieldErrors,
  };
}
