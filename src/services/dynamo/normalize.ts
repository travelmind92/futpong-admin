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
import {
  Age,
  BlockType,
  ChallengeLevel,
  Difficulty,
  Element,
  ExerciseCategory,
  Impact,
  Level,
  Period_2,
  Place_2,
  RepType_2,
  Skill,
  WeightType,
} from '../../types/enums';
import { Exercise_2 } from '../../types/types';

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

  const imageUrlRaw = raw.imageUrl;
  const imageUrl =
    typeof imageUrlRaw === 'string' && imageUrlRaw.trim() !== ''
      ? imageUrlRaw
      : undefined;

  const equivalenceGroupRaw = raw.equivalenceGroup;
  const equivalenceGroup =
    typeof equivalenceGroupRaw === 'string' &&
    equivalenceGroupRaw.trim() !== ''
      ? equivalenceGroupRaw.trim()
      : undefined;

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    repType: isRepType(raw.repType) ? raw.repType : RepType.REPETITIONS,
    ...(videoUrl !== undefined ? { videoUrl } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    ...(equivalenceGroup !== undefined ? { equivalenceGroup } : {}),
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

function isEnumValue<T extends Record<string, string>>(
  e: T,
  v: unknown
): v is T[keyof T] {
  return typeof v === 'string' && Object.values(e).includes(v as T[keyof T]);
}

function enumArray<T extends Record<string, string>>(
  e: T,
  v: unknown
): T[keyof T][] {
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is T[keyof T] => isEnumValue(e, x));
}

function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

export function normalizeExercise2(
  raw: Record<string, unknown>
): Exercise_2 | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id) {
    return null;
  }

  const period = isEnumValue(Period_2, raw.period) ? raw.period : undefined;
  const skill = isEnumValue(Skill, raw.skill) ? raw.skill : undefined;
  const challengeLevel = isEnumValue(ChallengeLevel, raw.challengeLevel)
    ? raw.challengeLevel
    : undefined;
  const weightType = isEnumValue(WeightType, raw.weightType)
    ? raw.weightType
    : undefined;
  const impact = isEnumValue(Impact, raw.impact) ? raw.impact : undefined;
  const difficulty = isEnumValue(Difficulty, raw.difficulty)
    ? raw.difficulty
    : undefined;
  const mainMuscle = optionalString(raw.mainMuscle);
  const sistituteGroup = optionalString(raw.sistituteGroup);
  const videoUrl = optionalString(raw.videoUrl);
  const imageUrl = optionalString(raw.imageUrl);
  const elements = enumArray(Element, raw.elements);

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    repType: isEnumValue(RepType_2, raw.repType)
      ? raw.repType
      : RepType_2.REPETITIONS,
    ages: enumArray(Age, raw.ages),
    level: isEnumValue(Level, raw.level) ? raw.level : Level.RECREATIONAL,
    places: enumArray(Place_2, raw.places),
    blockType: isEnumValue(BlockType, raw.blockType)
      ? raw.blockType
      : BlockType.GENERAL_ACTIVATION,
    category: isEnumValue(ExerciseCategory, raw.category)
      ? raw.category
      : ExerciseCategory.WARM_UP,
    ...(period !== undefined ? { period } : {}),
    ...(skill !== undefined ? { skill } : {}),
    ...(challengeLevel !== undefined ? { challengeLevel } : {}),
    ...(mainMuscle !== undefined ? { mainMuscle } : {}),
    ...(elements.length > 0 ? { elements } : {}),
    ...(weightType !== undefined ? { weightType } : {}),
    ...(impact !== undefined ? { impact } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(sistituteGroup !== undefined ? { sistituteGroup } : {}),
    ...(videoUrl !== undefined ? { videoUrl } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
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
