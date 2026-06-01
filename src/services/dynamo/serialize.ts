import type {
  Exercise,
  Routine,
  RoutineMapping,
  TrainingBlock,
  TrainingDay,
} from '../../types';

type DynamoItem = Record<string, unknown>;

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
