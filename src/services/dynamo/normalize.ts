import {
  Exercise,
  ExerciseItem,
  PlayerType,
  Place,
  RepType,
  Routine,
  RoutineMapping,
  RoutineType,
  TrainingBlock,
  TrainingDay,
} from '../../types';

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return fallback;
}

function isPlayerType(v: unknown): v is PlayerType {
  return typeof v === 'string' && Object.values(PlayerType).includes(v as PlayerType);
}

function isPlace(v: unknown): v is Place {
  return typeof v === 'string' && Object.values(Place).includes(v as Place);
}

function isRoutineType(v: unknown): v is RoutineType {
  return typeof v === 'string' && Object.values(RoutineType).includes(v as RoutineType);
}

function isRepType(v: unknown): v is RepType {
  return typeof v === 'string' && Object.values(RepType).includes(v as RepType);
}

export function normalizeExercise(raw: Record<string, unknown>): Exercise | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id) {
    return null;
  }
  const videoUrlRaw = raw.videoUrl;
  const videoUrl =
    typeof videoUrlRaw === 'string' && videoUrlRaw.trim() !== ''
      ? videoUrlRaw
      : undefined;

  const thumbnailUrlRaw = raw.thumbnailUrl;
  const thumbnailUrl =
    typeof thumbnailUrlRaw === 'string' && thumbnailUrlRaw.trim() !== ''
      ? thumbnailUrlRaw
      : undefined;

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    repType: isRepType(raw.repType) ? raw.repType : RepType.REPETITIONS,
    ...(videoUrl !== undefined ? { videoUrl } : {}),
    ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
    description: typeof raw.description === 'string' ? raw.description : '',
  };
}

export function normalizeRoutine(raw: Record<string, unknown>): Routine | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id) {
    return null;
  }
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    playerType: isPlayerType(raw.playerType) ? raw.playerType : PlayerType.AMATEUR,
    place: isPlace(raw.place) ? raw.place : Place.GYM,
    type: isRoutineType(raw.type) ? raw.type : RoutineType.COMPETENCE,
  };
}

export function normalizeRoutineMapping(
  raw: Record<string, unknown>
): RoutineMapping | null {
  const id = raw.id;
  const routineId = raw.routineId;
  if (typeof id !== 'string' || !id || typeof routineId !== 'string' || !routineId) {
    return null;
  }
  return {
    id,
    playerType: isPlayerType(raw.playerType) ? raw.playerType : PlayerType.AMATEUR,
    routineType: isRoutineType(raw.routineType)
      ? raw.routineType
      : RoutineType.COMPETENCE,
    place: isPlace(raw.place) ? raw.place : Place.GYM,
    routineId,
  };
}

function normalizeExerciseItem(raw: unknown): ExerciseItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const exerciseId = o.exerciseId;
  const reps = o.reps;
  return {
    index: num(o.index, 0),
    exerciseId: typeof exerciseId === 'string' ? exerciseId : '',
    reps: typeof reps === 'string' ? reps : reps != null ? String(reps) : '',
  };
}

export function normalizeTrainingDay(raw: Record<string, unknown>): TrainingDay | null {
  const id = raw.id;
  const routineId = raw.routineId;
  if (typeof id !== 'string' || !id || typeof routineId !== 'string' || !routineId) {
    return null;
  }
  const day = num(raw.day, 1);
  return {
    id,
    routineId,
    day: day >= 1 ? day : 1,
    name: typeof raw.name === 'string' ? raw.name : '',
    matchday: typeof raw.matchday === 'string' ? raw.matchday : '+1',
  };
}

export function normalizeTrainingBlock(raw: Record<string, unknown>): TrainingBlock | null {
  const id = raw.id;
  const trainingDayId = raw.trainingDayId;
  if (typeof id !== 'string' || !id || typeof trainingDayId !== 'string' || !trainingDayId) {
    return null;
  }
  const exercisesRaw = raw.exercises;
  const exercises: ExerciseItem[] = Array.isArray(exercisesRaw)
    ? exercisesRaw
        .map(normalizeExerciseItem)
        .filter((x): x is ExerciseItem => x !== null)
    : [];
  return {
    id,
    trainingDayId,
    index: num(raw.index, 0),
    name: typeof raw.name === 'string' ? raw.name : '',
    series: typeof raw.series === 'string' ? raw.series : '',
    exercises,
  };
}
