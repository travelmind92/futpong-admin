/** Stable code for exercise-in-use errors (language-independent checks). */
export const EXERCISE_IN_USE_ERROR_CODE = 'EXERCISE_IN_USE';

export function isExerciseInUseError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === EXERCISE_IN_USE_ERROR_CODE
  );
}
