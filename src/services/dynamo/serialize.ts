import type {
  Exercise,
  Routine,
  RoutineMapping,
  TrainingBlock,
  TrainingDay,
} from '../../types';
import type { Exercise_V3, Routine_V3, RoutineMapping_V3, TrainingBlock_V3, TrainingDay_V3 } from '../../types/types';

type DynamoItem = Record<string, unknown>;

export const EXERCISE_2_VERSION = 'v3';
export const EXERCISE_2_RESOURCE = 'exercises';
export const ROUTINE_V3_RESOURCE = 'routines';
export const ROUTINE_MAPPING_V3_FETCH_RESOURCE = 'routine-mappings';
export const ROUTINE_MAPPING_V3_WRITE_RESOURCE = 'routines/mappings';
export const TRAINING_DAY_V3_RESOURCE = 'training-days';
export const TRAINING_BLOCK_V3_RESOURCE = 'training-blocks';

export function exerciseToDynamoItem(exercise: Exercise): DynamoItem {
  const item: DynamoItem = {
    id: exercise.id,
    name: exercise.name,
    repType: exercise.repType,
    description: exercise.description,
  };
  const v = exercise.videoUrl?.trim();
  if (v) {
    item.videoUrl = v;
  }
  const image = exercise.imageUrl?.trim();
  if (image) {
    item.imageUrl = image;
  }
  const g = exercise.equivalenceGroup?.trim();
  if (g) {
    item.equivalenceGroup = g;
  }
  return item;
}

export function exercise2ToDynamoItem(exercise: Exercise_V3): DynamoItem {
  const item: DynamoItem = {
    id: exercise.id,
    version: EXERCISE_2_VERSION,
    name: exercise.name,
    description: exercise.description,
    repType: exercise.repType,
    ages: exercise.ages,
    level: exercise.level,
    places: exercise.places,
    blockTypes: exercise.blockTypes,
    categories: exercise.categories,
  };
  if (exercise.periods !== undefined && exercise.periods.length > 0) {
    item.periods = exercise.periods;
  }
  if (exercise.skills !== undefined && exercise.skills.length > 0) {
    item.skills = exercise.skills;
  }
  if (exercise.challengeLevel !== undefined) {
    item.challengeLevel = exercise.challengeLevel;
  }
  const mainMuscle = exercise.mainMuscle?.trim();
  if (mainMuscle) {
    item.mainMuscle = mainMuscle;
  }
  if (exercise.elements !== undefined && exercise.elements.length > 0) {
    item.elements = exercise.elements;
  }
  if (exercise.weightType !== undefined) {
    item.weightType = exercise.weightType;
  }
  if (exercise.impact !== undefined) {
    item.impact = exercise.impact;
  }
  if (exercise.difficulty !== undefined) {
    item.difficulty = exercise.difficulty;
  }
  const sistituteGroup = exercise.sistituteGroup?.trim();
  if (sistituteGroup) {
    item.sistituteGroup = sistituteGroup;
  }
  const videoUrl = exercise.videoUrl?.trim();
  if (videoUrl) {
    item.videoUrl = videoUrl;
  }
  const imageUrl = exercise.imageUrl?.trim();
  if (imageUrl) {
    item.imageUrl = imageUrl;
  }
  return item;
}

export function routineV3ToDynamoItem(routine: Routine_V3): DynamoItem {
  return {
    id: routine.id,
    version: EXERCISE_2_VERSION,
    name: routine.name,
    age: routine.age,
    level: routine.level,
    place: routine.place,
    period: routine.period,
  };
}

export function routineMappingV3ToDynamoItem(mapping: RoutineMapping_V3): DynamoItem {
  return {
    id: mapping.id,
    version: EXERCISE_2_VERSION,
    age: mapping.age,
    level: mapping.level,
    place: mapping.place,
    period: mapping.period,
    routineId: mapping.routineId,
  };
}

export function trainingDayV3ToDynamoItem(day: TrainingDay_V3): DynamoItem {
  const item: DynamoItem = {
    id: day.id,
    version: EXERCISE_2_VERSION,
    routineId: day.routineId,
    session: day.session,
    name: day.name,
    minutes: day.minutes,
  };
  if (day.matchday !== undefined) {
    item.matchday = day.matchday;
  }
  if (day.tips !== undefined && day.tips.length > 0) {
    item.tips = day.tips;
  }
  return item;
}

export function trainingBlockV3ToDynamoItem(block: TrainingBlock_V3): DynamoItem {
  return {
    id: block.id,
    version: EXERCISE_2_VERSION,
    trainingDayId: block.trainingDayId,
    index: block.index,
    name: block.name,
    blockType: block.blockType,
    series: block.series,
    exercises: block.exercises,
  };
}

export function routineToDynamoItem(routine: Routine): DynamoItem {
  return {
    id: routine.id,
    name: routine.name,
    playerType: routine.playerType,
    place: routine.place,
    type: routine.type,
  };
}

export function routineMappingToDynamoItem(mapping: RoutineMapping): DynamoItem {
  return {
    id: mapping.id,
    playerType: mapping.playerType,
    routineType: mapping.routineType,
    place: mapping.place,
    routineId: mapping.routineId,
  };
}

export function trainingDayToDynamoItem(day: TrainingDay): DynamoItem {
  return {
    id: day.id,
    routineId: day.routineId,
    day: day.day,
    name: day.name,
    matchday: day.matchday,
  };
}

export function trainingBlockToDynamoItem(block: TrainingBlock): DynamoItem {
  return {
    id: block.id,
    trainingDayId: block.trainingDayId,
    index: block.index,
    name: block.name,
    series: block.series,
    exercises: block.exercises,
  };
}
