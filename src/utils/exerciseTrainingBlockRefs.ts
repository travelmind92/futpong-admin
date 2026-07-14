import type { TrainingBlock_V3 } from '../types/types';

/** True if any exercise row in any block references this exercise id. */
export function isExerciseIdUsedInTrainingBlocks(
  exerciseId: string,
  blocks: Pick<TrainingBlock_V3, 'exercises'>[]
): boolean {
  const target = exerciseId.trim();
  if (!target) {
    return false;
  }
  for (const block of blocks) {
    for (const row of block.exercises ?? []) {
      if ((row.exerciseId ?? '').trim() === target) {
        return true;
      }
    }
  }
  return false;
}
