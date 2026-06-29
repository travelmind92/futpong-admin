import { bulkRemove, bulkSave, remove, save } from './api';
import {
  ROUTINE_MAPPING_V3_WRITE_RESOURCE,
  ROUTINE_V3_RESOURCE,
  TRAINING_BLOCK_V3_RESOURCE,
  TRAINING_DAY_V3_RESOURCE,
  routineMappingV3ToDynamoItem,
  routineV3ToDynamoItem,
  trainingBlockV3ToDynamoItem,
  trainingDayV3ToDynamoItem,
} from '../dynamo/serialize';
import {
  RoutineMapping_V3,
  Routine_V3,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../../types/types';

type RoutineV3ImportSaveInput = {
  routine: Routine_V3;
  mapping: RoutineMapping_V3;
  days: TrainingDay_V3[];
  blocks: TrainingBlock_V3[];
  isUpdate: boolean;
  previousRoutine?: Routine_V3;
  previousMapping?: RoutineMapping_V3;
  oldDayIds: string[];
  oldBlockIds: string[];
  oldMappingIds: string[];
};

type SavedImportAttempt = {
  routine: boolean;
  mapping: boolean;
  dayIds: string[];
  blockIds: string[];
};

async function rollbackImportAttempt(
  input: RoutineV3ImportSaveInput,
  saved: SavedImportAttempt
): Promise<void> {
  const { routine, mapping, isUpdate, previousRoutine, previousMapping } = input;

  try {
    if (saved.blockIds.length > 0) {
      await bulkRemove(TRAINING_BLOCK_V3_RESOURCE, saved.blockIds);
    }
    if (saved.dayIds.length > 0) {
      await bulkRemove(TRAINING_DAY_V3_RESOURCE, saved.dayIds);
    }
    if (saved.mapping) {
      if (isUpdate && previousMapping) {
        await save(
          ROUTINE_MAPPING_V3_WRITE_RESOURCE,
          previousMapping.id,
          routineMappingV3ToDynamoItem(previousMapping)
        );
      } else {
        await remove(ROUTINE_MAPPING_V3_WRITE_RESOURCE, mapping.id);
      }
    }
    if (saved.routine) {
      if (isUpdate && previousRoutine) {
        await save(
          ROUTINE_V3_RESOURCE,
          previousRoutine.id,
          routineV3ToDynamoItem(previousRoutine)
        );
      } else {
        await remove(ROUTINE_V3_RESOURCE, routine.id);
      }
    }
  } catch (rollbackError) {
    console.error('Routine v3 import rollback failed', rollbackError);
  }
}

async function removeExistingRoutineImportData(
  input: RoutineV3ImportSaveInput
): Promise<void> {
  const { mapping, oldDayIds, oldBlockIds, oldMappingIds } = input;

  if (oldBlockIds.length > 0) {
    await bulkRemove(TRAINING_BLOCK_V3_RESOURCE, oldBlockIds);
  }
  if (oldDayIds.length > 0) {
    await bulkRemove(TRAINING_DAY_V3_RESOURCE, oldDayIds);
  }

  const mappingIdsToRemove = oldMappingIds.filter((id) => id !== mapping.id);
  await Promise.all(
    mappingIdsToRemove.map((id) => remove(ROUTINE_MAPPING_V3_WRITE_RESOURCE, id))
  );
}

export async function persistRoutineV3Import(
  input: RoutineV3ImportSaveInput
): Promise<void> {
  const { routine, mapping, days, blocks } = input;
  const saved: SavedImportAttempt = {
    routine: false,
    mapping: false,
    dayIds: [],
    blockIds: [],
  };

  try {
    if (input.isUpdate) {
      await removeExistingRoutineImportData(input);
    }

    await save(ROUTINE_V3_RESOURCE, routine.id, routineV3ToDynamoItem(routine));
    saved.routine = true;

    await save(
      ROUTINE_MAPPING_V3_WRITE_RESOURCE,
      mapping.id,
      routineMappingV3ToDynamoItem(mapping)
    );
    saved.mapping = true;

    if (days.length > 0) {
      await bulkSave(
        TRAINING_DAY_V3_RESOURCE,
        days.map((day) => trainingDayV3ToDynamoItem(day))
      );
      saved.dayIds = days.map((day) => day.id);
    }

    if (blocks.length > 0) {
      await bulkSave(
        TRAINING_BLOCK_V3_RESOURCE,
        blocks.map((block) => trainingBlockV3ToDynamoItem(block))
      );
      saved.blockIds = blocks.map((block) => block.id);
    }
  } catch (error) {
    await rollbackImportAttempt(input, saved);
    throw error;
  }
}
