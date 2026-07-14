import {
  Age_V3,
  BlockType_V3,
  ChallengeLevel_V3,
  Difficulty_V3,
  ElementName_V3,
  ExerciseCategory_V3,
  Impact_V3,
  Level_V3,
  Period_V3,
  Place_V3,
  RepType_V3,
  Skill_V3,
  TipCategory,
  WeightType_V3,
} from '../../types/enums';
import {
  ExerciseItem_V3,
  Exercise_V3,
  RoutineMapping_V3,
  Routine_V3,
  Tip,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../../types/types';

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

export function normalizeRoutineV3(raw: Record<string, unknown>): Routine_V3 | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id) {
    return null;
  }
  const custom =
    typeof raw.custom === 'boolean' ? raw.custom : undefined;
  const userId =
    typeof raw.userId === 'string' && raw.userId ? raw.userId : undefined;

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    age: isEnumValue(Age_V3, raw.age) ? raw.age : Age_V3.ADULT,
    level: isEnumValue(Level_V3, raw.level) ? raw.level : Level_V3.RECREATIONAL,
    place: isEnumValue(Place_V3, raw.place) ? raw.place : Place_V3.GYM,
    period: isEnumValue(Period_V3, raw.period)
      ? raw.period
      : Period_V3.COMPETITION,
    ...(custom !== undefined ? { custom } : {}),
    ...(userId !== undefined ? { userId } : {}),
  };
}

export function normalizeRoutineMappingV3(
  raw: Record<string, unknown>
): RoutineMapping_V3 | null {
  const id = raw.id;
  const routineId = raw.routineId;
  if (typeof id !== 'string' || !id || typeof routineId !== 'string' || !routineId) {
    return null;
  }
  return {
    id,
    age: isEnumValue(Age_V3, raw.age) ? raw.age : Age_V3.ADULT,
    level: isEnumValue(Level_V3, raw.level) ? raw.level : Level_V3.RECREATIONAL,
    place: isEnumValue(Place_V3, raw.place) ? raw.place : Place_V3.GYM,
    period: isEnumValue(Period_V3, raw.period)
      ? raw.period
      : Period_V3.COMPETITION,
    routineId,
  };
}

export function normalizeTrainingDayV3(
  raw: Record<string, unknown>
): TrainingDay_V3 | null {
  const id = raw.id;
  const routineId = raw.routineId;
  if (typeof id !== 'string' || !id || typeof routineId !== 'string' || !routineId) {
    return null;
  }
  const session = num(raw.session, 1);
  const minutes = num(raw.minutes, 0);
  const matchdayRaw = raw.matchday;
  const matchday =
    typeof matchdayRaw === 'string' && matchdayRaw.trim() !== ''
      ? matchdayRaw
      : undefined;
  const tipsRaw = raw.tips;
  const tips = Array.isArray(tipsRaw)
    ? tipsRaw
        .map(normalizeTipV3)
        .filter((tip): tip is Tip => tip !== null)
    : undefined;

  return {
    id,
    routineId,
    session: session >= 1 ? session : 1,
    name: typeof raw.name === 'string' ? raw.name : '',
    ...(matchday !== undefined ? { matchday } : {}),
    minutes: minutes >= 0 ? minutes : 0,
    ...(tips !== undefined && tips.length > 0 ? { tips } : {}),
  };
}

function normalizeTipV3(raw: unknown): Tip | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  if (!text || !isEnumValue(TipCategory, o.category)) {
    return null;
  }
  return {
    category: o.category,
    text,
  };
}

function normalizeExerciseItemV3(raw: unknown): ExerciseItem_V3 | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const exerciseId = o.exerciseId;
  const reps = o.reps;
  const restSecondsRaw = o.restSeconds;
  const restSeconds =
    typeof restSecondsRaw === 'number' && Number.isFinite(restSecondsRaw)
      ? restSecondsRaw
      : undefined;

  return {
    index: num(o.index, 0),
    exerciseId: typeof exerciseId === 'string' ? exerciseId : '',
    reps: typeof reps === 'string' ? reps : reps != null ? String(reps) : '',
    ...(restSeconds !== undefined ? { restSeconds } : {}),
  };
}

export function normalizeTrainingBlockV3(
  raw: Record<string, unknown>
): TrainingBlock_V3 | null {
  const id = raw.id;
  const trainingDayId = raw.trainingDayId;
  if (typeof id !== 'string' || !id || typeof trainingDayId !== 'string' || !trainingDayId) {
    return null;
  }
  const exercisesRaw = raw.exercises;
  const exercises: ExerciseItem_V3[] = Array.isArray(exercisesRaw)
    ? exercisesRaw
        .map(normalizeExerciseItemV3)
        .filter((x): x is ExerciseItem_V3 => x !== null)
    : [];

  return {
    id,
    trainingDayId,
    index: num(raw.index, 0),
    name: typeof raw.name === 'string' ? raw.name : '',
    blockType: isEnumValue(BlockType_V3, raw.blockType)
      ? raw.blockType
      : BlockType_V3.GENERAL_ACTIVATION,
    series: num(raw.series, 1),
    exercises,
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
): Exercise_V3 | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id) {
    return null;
  }

  const periods = enumArray(Period_V3, raw.periods);
  const skills = enumArray(Skill_V3, raw.skills);
  const challengeLevel = isEnumValue(ChallengeLevel_V3, raw.challengeLevel)
    ? raw.challengeLevel
    : undefined;
  const weightType = isEnumValue(WeightType_V3, raw.weightType)
    ? raw.weightType
    : undefined;
  const impact = isEnumValue(Impact_V3, raw.impact) ? raw.impact : undefined;
  const difficulty = isEnumValue(Difficulty_V3, raw.difficulty)
    ? raw.difficulty
    : undefined;
  const mainMuscle = optionalString(raw.mainMuscle);
  const sistituteGroup = optionalString(raw.sistituteGroup);
  const videoUrl = optionalString(raw.videoUrl);
  const imageUrl = optionalString(raw.imageUrl);
  const elements = enumArray(ElementName_V3, raw.elements);
  const version = optionalString(raw.version);

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    repType: isEnumValue(RepType_V3, raw.repType)
      ? raw.repType
      : RepType_V3.REPETITIONS,
    ages: enumArray(Age_V3, raw.ages),
    levels: enumArray(Level_V3, raw.levels),
    places: enumArray(Place_V3, raw.places),
    blockTypes: enumArray(BlockType_V3, raw.blockTypes),
    categories: enumArray(ExerciseCategory_V3, raw.categories),
    ...(periods.length > 0 ? { periods } : {}),
    ...(skills.length > 0 ? { skills } : {}),
    ...(challengeLevel !== undefined ? { challengeLevel } : {}),
    ...(mainMuscle !== undefined ? { mainMuscle } : {}),
    ...(elements.length > 0 ? { elements } : {}),
    ...(weightType !== undefined ? { weightType } : {}),
    ...(impact !== undefined ? { impact } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(sistituteGroup !== undefined ? { sistituteGroup } : {}),
    ...(version !== undefined ? { version } : {}),
    ...(videoUrl !== undefined ? { videoUrl } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
  };
}
