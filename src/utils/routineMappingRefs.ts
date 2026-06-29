import type { RoutineMapping } from '../types';
import type { RoutineMapping_V3 } from '../types/types';

type MappingWithRoutineId =
  | Pick<RoutineMapping, 'routineId'>
  | Pick<RoutineMapping_V3, 'routineId'>;

/** True if any mapping references this routine id. */
export function isRoutineIdUsedInMappings(
  routineId: string,
  mappings: MappingWithRoutineId[]
): boolean {
  const target = routineId.trim();
  if (!target) {
    return false;
  }
  return mappings.some(
    (mapping) => (mapping.routineId ?? '').trim() === target
  );
}
