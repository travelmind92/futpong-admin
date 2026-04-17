import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import type {
  Exercise,
  Routine,
  RoutineMapping,
  TrainingBlock,
  TrainingDay,
} from '../../types';

type DynamoItem = Record<string, NativeAttributeValue>;

export function exerciseToDynamoItem(exercise: Exercise): DynamoItem {
  return {
    id: exercise.id,
    name: exercise.name,
    repType: exercise.repType,
    videoUrl: exercise.videoUrl,
    description: exercise.description,
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
    exercises: block.exercises as unknown as NativeAttributeValue,
  };
}
