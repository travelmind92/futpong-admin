import type { RoutineMapping_V3 } from '../types/types';

/** True if any mapping references this routine id. */
export function isRoutineIdUsedInMappings(
  routineId: string,
  mappings: Pick<RoutineMapping_V3, 'routineId'>[]
): boolean {
  const target = routineId.trim();
  if (!target) {
    return false;
  }
  return mappings.some(
    (mapping) => (mapping.routineId ?? '').trim() === target
  );
}
