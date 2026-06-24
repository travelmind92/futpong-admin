import type {
  Exercise,
  Routine,
  RoutineMapping,
  TrainingBlock,
  TrainingDay,
} from '../../types';
import type { Exercise_2 } from '../../types/types';

type DynamoItem = Record<string, unknown>;

export const EXERCISE_2_VERSION = 'v3';
export const EXERCISE_2_RESOURCE = 'exercises';

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

export function exercise2ToDynamoItem(exercise: Exercise_2): DynamoItem {
  const item: DynamoItem = {
    id: exercise.id,
    version: EXERCISE_2_VERSION,
    name: exercise.name,
    description: exercise.description,
    repType: exercise.repType,
    ages: exercise.ages,
    level: exercise.level,
    places: exercise.places,
    blockType: exercise.blockType,
    category: exercise.category,
  };
  if (exercise.period !== undefined) {
    item.period = exercise.period;
  }
  if (exercise.skill !== undefined) {
    item.skill = exercise.skill;
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
