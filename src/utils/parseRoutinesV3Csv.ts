import { v4 as uuidv4 } from 'uuid';
import {
  Age_V3,
  BlockType_V3,
  Level_V3,
  Period_V3,
  Place_V3,
} from '../types/enums';
import {
  AgeLabel,
  BlockTypeLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
} from '../types/labels';
import {
  ExerciseItem_V3,
  Exercise_V3,
  RoutineMapping_V3,
  Routine_V3,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../types/types';
import { EXERCISE_2_VERSION } from '../services/dynamo/serialize';
import { matchdayForDay } from './matchdayForDay';
import { normalizeForSearch } from './textSearch';
import { normalizeImportValue } from './stripAccents';
import { CsvDelimiter, parseCsvRecords } from './parseCsvRecords';

const EXPECTED_HEADERS = [
  'NOMBRE',
  'EDAD',
  'NIVEL',
  'LUGAR',
  'PERIODO',
  'DIA_SESION',
  'DIA_NOMBRE',
  'DIA_MINUTOS',
  'BLOQUE_N',
  'BLOQUE_NOMBRE',
  'BLOQUE_TIPO',
  'BLOQUE_SERIES',
  'EJ_N',
  'EJ_NOMBRE',
  'EJ_REPETICIONES',
  'EJ_SEGUNDOS_DESCANSO',
] as const;

type CsvColumn = (typeof EXPECTED_HEADERS)[number];

type RoutineMeta = {
  name: string;
  age: Age_V3;
  level: Level_V3;
  place: Place_V3;
  period: Period_V3;
};

type BlockBuilder = {
  id: string;
  trainingDayId: string;
  index: number;
  name: string;
  blockType: BlockType_V3;
  series: number;
  exercises: ExerciseItem_V3[];
};

type DayBuilder = {
  id: string;
  session: number;
  name: string;
  minutes: number;
  blocks: Map<number, BlockBuilder>;
};

export type RoutineV3ImportPayload = {
  routine: Routine_V3;
  mapping: RoutineMapping_V3;
  days: TrainingDay_V3[];
  blocks: TrainingBlock_V3[];
};

export type ParseRoutinesV3CsvResult =
  | { ok: true; payload: RoutineV3ImportPayload }
  | { ok: false; error: string; data?: string };

function buildEnumLookup<T extends Record<string, string>>(
  enumObj: T,
  labelMap: Record<T[keyof T], string>
): Map<string, T[keyof T]> {
  const lookup = new Map<string, T[keyof T]>();
  for (const value of Object.values(enumObj) as T[keyof T][]) {
    lookup.set(normalizeImportValue(value), value);
    const label = labelMap[value];
    if (label) {
      lookup.set(normalizeImportValue(label), value);
    }
  }
  return lookup;
}

const AGE_LOOKUP = buildEnumLookup(Age_V3, AgeLabel);
const LEVEL_LOOKUP = buildEnumLookup(Level_V3, LevelLabel);
const PLACE_LOOKUP = buildEnumLookup(Place_V3, PlaceLabel);
const PERIOD_LOOKUP = buildEnumLookup(Period_V3, PeriodLabel);
const BLOCK_TYPE_LOOKUP = buildEnumLookup(BlockType_V3, BlockTypeLabel);

const DELIMITERS: CsvDelimiter[] = [';', ','];

function normalizeHeader(value: string): string {
  return normalizeImportValue(value.replace(/^\uFEFF/, ''));
}

function headersMatchExpected(headerCells: string[]): boolean {
  if (headerCells.length !== EXPECTED_HEADERS.length) {
    return false;
  }
  return EXPECTED_HEADERS.every(
    (expected, index) => headerCells[index] === normalizeImportValue(expected)
  );
}

function detectDelimiter(text: string): CsvDelimiter | null {
  for (const delimiter of DELIMITERS) {
    const { records, malformed } = parseCsvRecords(text, delimiter);
    if (malformed || records.length === 0) {
      continue;
    }
    const headerCells = records[0].map((cell) => normalizeHeader(cell.trim()));
    if (headersMatchExpected(headerCells)) {
      return delimiter;
    }
  }
  return null;
}

function rowToRecord(
  headers: CsvColumn[],
  cells: string[]
): Record<CsvColumn, string> {
  const record = {} as Record<CsvColumn, string>;
  for (let i = 0; i < headers.length; i += 1) {
    record[headers[i]] = cells[i]?.trim() ?? '';
  }
  return record;
}

function parseEnum<V>(lookup: Map<string, V>, raw: string): V | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return lookup.get(normalizeImportValue(trimmed)) ?? null;
}

function parsePositiveInt(raw: string): number | null {
  const v = raw.trim();
  if (!v || !/^\d+$/.test(v)) {
    return null;
  }
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return n;
}

function parseOptionalNonNegativeInt(raw: string): number | null | undefined {
  const v = raw.trim();
  if (!v) {
    return undefined;
  }
  if (!/^\d+$/.test(v)) {
    return null;
  }
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

function findExerciseByName(
  name: string,
  exercises: Exercise_V3[]
): Exercise_V3 | undefined {
  const key = normalizeForSearch(name);
  if (!key) {
    return undefined;
  }
  const matches = exercises.filter(
    (exercise) => normalizeForSearch(exercise.name) === key
  );
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

export function parseRoutinesV3Csv(
  text: string,
  existingRoutines: Routine_V3[],
  existingExercises: Exercise_V3[]
): ParseRoutinesV3CsvResult {
  const normalized = text.replace(/^\uFEFF/, '').trim();
  if (!normalized) {
    return { ok: false, error: 'emptyFile' };
  }

  const delimiter = detectDelimiter(normalized);
  if (!delimiter) {
    return { ok: false, error: 'invalidHeaders' };
  }

  const { records, malformed } = parseCsvRecords(normalized, delimiter);
  if (malformed || records.length === 0) {
    return { ok: false, error: 'invalidRow' };
  }

  const headers = [...EXPECTED_HEADERS];
  const dataRecords = records.slice(1).filter((record) =>
    record.some((cell) => cell.trim().length > 0)
  );

  if (dataRecords.length === 0) {
    return { ok: false, error: 'noRows' };
  }

  let routineMeta: RoutineMeta | null = null;
  let routineId = uuidv4();
  const daysBySession = new Map<number, DayBuilder>();
  let currentDay: DayBuilder | null = null;
  let currentBlock: BlockBuilder | null = null;

  for (const record of dataRecords) {
    const cells = record.map((cell) => cell.trim());
    if (cells.length !== headers.length) {
      return { ok: false, error: 'invalidRow' };
    }

    const row = rowToRecord(headers, cells);

    const nameCell = row.NOMBRE.trim();
    if (nameCell) {
      if (routineMeta && routineMeta.name !== nameCell) {
        return { ok: false, error: 'multipleRoutineNames' };
      }
      const age = parseEnum(AGE_LOOKUP, row.EDAD);
      const level = parseEnum(LEVEL_LOOKUP, row.NIVEL);
      const place = parseEnum(PLACE_LOOKUP, row.LUGAR);
      const period = parseEnum(PERIOD_LOOKUP, row.PERIODO);
      if (!age) {
        return { ok: false, error: 'invalidAge' };
      }
      if (!level) {
        return { ok: false, error: 'invalidLevel' };
      }
      if (!place) {
        return { ok: false, error: 'invalidPlace' };
      }
      if (!period) {
        return { ok: false, error: 'invalidPeriod' };
      }
      routineMeta = { name: nameCell, age, level, place, period };
    }

    if (!routineMeta) {
      return { ok: false, error: 'missingRoutineName' };
    }

    const sessionCell = row.DIA_SESION.trim();
    if (sessionCell) {
      const session = parsePositiveInt(sessionCell);
      if (session == null) {
        return { ok: false, error: 'invalidSession' };
      }

      const dayName = row.DIA_NOMBRE.trim();
      if (!dayName) {
        return { ok: false, error: 'missingDayName' };
      }

      const minutes = parsePositiveInt(row.DIA_MINUTOS);
      if (minutes == null) {
        return { ok: false, error: 'invalidDayMinutes' };
      }

      let dayBuilder = daysBySession.get(session);
      if (!dayBuilder) {
        dayBuilder = {
          id: uuidv4(),
          session,
          name: dayName,
          minutes,
          blocks: new Map(),
        };
        daysBySession.set(session, dayBuilder);
      } else {
        dayBuilder.name = dayName;
        dayBuilder.minutes = minutes;
      }

      currentDay = dayBuilder;
      currentBlock = null;
    } else if (!currentDay) {
      return { ok: false, error: 'missingSession' };
    }

    const blockIndexCell = row.BLOQUE_N.trim();
    if (blockIndexCell) {
      const blockIndex = parsePositiveInt(blockIndexCell);
      if (blockIndex == null) {
        return { ok: false, error: 'invalidBlockIndex' };
      }

      const blockNameCell = row.BLOQUE_NOMBRE.trim();
      const blockTypeCell = row.BLOQUE_TIPO.trim();
      const blockSeriesCell = row.BLOQUE_SERIES.trim();

      let blockBuilder = currentDay!.blocks.get(blockIndex);
      if (!blockBuilder) {
        if (!blockNameCell) {
          return { ok: false, error: 'missingBlockName' };
        }
        const blockType = parseEnum(BLOCK_TYPE_LOOKUP, blockTypeCell);
        if (!blockType) {
          return { ok: false, error: 'invalidBlockType' };
        }
        const series = parsePositiveInt(blockSeriesCell);
        if (series == null) {
          return { ok: false, error: 'missingBlockSeries' };
        }
        blockBuilder = {
          id: uuidv4(),
          trainingDayId: currentDay!.id,
          index: blockIndex,
          name: blockNameCell,
          blockType,
          series,
          exercises: [],
        };
        currentDay!.blocks.set(blockIndex, blockBuilder);
      } else {
        if (blockNameCell) {
          blockBuilder.name = blockNameCell;
        }
        if (blockTypeCell) {
          const blockType = parseEnum(BLOCK_TYPE_LOOKUP, blockTypeCell);
          if (!blockType) {
            return { ok: false, error: 'invalidBlockType' };
          }
          blockBuilder.blockType = blockType;
        }
        if (blockSeriesCell) {
          const series = parsePositiveInt(blockSeriesCell);
          if (series == null) {
            return { ok: false, error: 'missingBlockSeries' };
          }
          blockBuilder.series = series;
        }
      }

      currentBlock = blockBuilder;
    } else if (!currentBlock) {
      return { ok: false, error: 'missingBlockIndex' };
    }

    const exerciseIndex = parsePositiveInt(row.EJ_N);
    const exerciseName = row.EJ_NOMBRE.trim();
    const reps = row.EJ_REPETICIONES.trim();
    const restSecondsRaw = parseOptionalNonNegativeInt(row.EJ_SEGUNDOS_DESCANSO);

    if (exerciseIndex == null) {
      return { ok: false, error: 'invalidExerciseIndex' };
    }
    if (!exerciseName) {
      return { ok: false, error: 'missingExerciseName' };
    }
    if (!reps) {
      return { ok: false, error: 'missingExerciseReps' };
    }
    if (restSecondsRaw === null) {
      return { ok: false, error: 'invalidRestSeconds' };
    }

    const foundExercise = findExerciseByName(exerciseName, existingExercises);
    if (!foundExercise) {
      return { ok: false, error: 'exerciseNotFound', data: exerciseName };
    }

    if (currentBlock!.exercises.some((item) => item.index === exerciseIndex)) {
      return { ok: false, error: 'duplicateExerciseIndexInBlock' };
    }

    const exerciseItem: ExerciseItem_V3 = {
      index: exerciseIndex,
      exerciseId: foundExercise.id,
      reps,
      ...(restSecondsRaw !== undefined ? { restSeconds: restSecondsRaw } : {}),
    };
    currentBlock!.exercises.push(exerciseItem);
  }

  if (daysBySession.size === 0) {
    return { ok: false, error: 'noRows' };
  }

  if (!routineMeta) {
    return { ok: false, error: 'missingRoutineName' };
  }

  const meta = routineMeta;

  const existingRoutine = existingRoutines.find(
    (routine) =>
      normalizeForSearch(routine.name) === normalizeForSearch(meta.name)
  );
  if (existingRoutine) {
    routineId = existingRoutine.id;
  }

  for (const dayBuilder of Array.from(daysBySession.values())) {
    for (const blockBuilder of Array.from(dayBuilder.blocks.values())) {
      if (!blockBuilder.name.trim()) {
        return { ok: false, error: 'missingBlockName' };
      }
      if (blockBuilder.series < 1) {
        return { ok: false, error: 'missingBlockSeries' };
      }
      if (blockBuilder.exercises.length === 0) {
        return { ok: false, error: 'blockWithoutExercises' };
      }
      blockBuilder.exercises.sort((a, b) => a.index - b.index);
    }
  }

  const sortedSessions = Array.from(daysBySession.keys()).sort((a, b) => a - b);
  const days: TrainingDay_V3[] = sortedSessions.map((session) => {
    const dayBuilder = daysBySession.get(session)!;
    return {
      id: dayBuilder.id,
      routineId,
      session: dayBuilder.session,
      name: dayBuilder.name.trim(),
      matchday: matchdayForDay(dayBuilder.session),
      minutes: dayBuilder.minutes,
    };
  });

  const blocks: TrainingBlock_V3[] = [];
  for (const session of sortedSessions) {
    const dayBuilder = daysBySession.get(session)!;
    const sortedBlockIndices = Array.from(dayBuilder.blocks.keys()).sort(
      (a, b) => a - b
    );
    for (const blockIndex of sortedBlockIndices) {
      const blockBuilder = dayBuilder.blocks.get(blockIndex)!;
      blocks.push({
        id: blockBuilder.id,
        trainingDayId: blockBuilder.trainingDayId,
        index: blockBuilder.index,
        name: blockBuilder.name.trim(),
        blockType: blockBuilder.blockType,
        series: blockBuilder.series,
        exercises: blockBuilder.exercises,
      });
    }
  }

  const routine: Routine_V3 = {
    id: routineId,
    name: meta.name.trim(),
    age: meta.age,
    level: meta.level,
    place: meta.place,
    period: meta.period,
    version: EXERCISE_2_VERSION,
  };

  const mapping: RoutineMapping_V3 = {
    id: uuidv4(),
    age: meta.age,
    level: meta.level,
    place: meta.place,
    period: meta.period,
    routineId,
  };

  return {
    ok: true,
    payload: { routine, mapping, days, blocks },
  };
}
