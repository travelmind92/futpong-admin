/** Stable code for exercise-in-use errors (language-independent checks). */
export const EXERCISE_IN_USE_ERROR_CODE = 'EXERCISE_IN_USE';

/** Stable code for routine-in-use errors (language-independent checks). */
export const ROUTINE_IN_USE_ERROR_CODE = 'ROUTINE_IN_USE';

export function isExerciseInUseError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === EXERCISE_IN_USE_ERROR_CODE
  );
}

export function isRoutineInUseError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === ROUTINE_IN_USE_ERROR_CODE
  );
}
