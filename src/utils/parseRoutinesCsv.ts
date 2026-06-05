import { v4 as uuidv4 } from 'uuid';
import {
  Exercise,
  ExerciseItem,
  Place,
  PlayerType,
  Routine,
  RoutineType,
  TrainingBlock,
  TrainingDay,
} from '../types';
import { matchdayForDay } from './matchdayForDay';
import { normalizeForSearch } from './textSearch';

const EXPECTED_HEADERS = [
  'NOMBRE',
  'PERFIL',
  'LUGAR',
  'PERIODO',
  'DIA',
  'BLOQUE_N',
  'BLOQUE_NOMBRE',
  'BLOQUE_SERIES',
  'EJERCICIO_N',
  'EJERCICIO_NOMBRE',
  'EJERCICIO_REPETICIONES',
] as const;

type CsvColumn = (typeof EXPECTED_HEADERS)[number];

const PLAYER_TYPE_BY_LABEL: Record<string, PlayerType> = {
  elite: PlayerType.ELITE,
  amateur: PlayerType.AMATEUR,
  juveniles: PlayerType.JUVENILES,
  infantiles: PlayerType.CHILDREN,
};

const PLACE_BY_LABEL: Record<string, Place> = {
  gimnasio: Place.GYM,
  plaza: Place.PARK,
  casa: Place.HOME,
  cancha: Place.FIELD,
};

const ROUTINE_TYPE_BY_LABEL: Record<string, RoutineType> = {
  competencia: RoutineType.COMPETENCE,
  pretemporada: RoutineType.PRESEASON,
};

export type RoutineImportPayload = {
  routine: Routine;
  days: TrainingDay[];
  blocks: TrainingBlock[];
};

export type ParseRoutinesCsvResult =
  | { ok: true; payload: RoutineImportPayload }
  | { ok: false; error: string; data?: string };

type RoutineMeta = {
  name: string;
  playerType: PlayerType;
  place: Place;
  type: RoutineType;
};

type BlockBuilder = {
  id: string;
  trainingDayId: string;
  index: number;
  name: string;
  series: string;
  exercises: ExerciseItem[];
};

type DayBuilder = {
  id: string;
  day: number;
  blocks: Map<number, BlockBuilder>;
};

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, '').trim().toUpperCase();
}

function normalizeLabelKey(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

type CsvDelimiter = ';' | ',';

const DELIMITERS: CsvDelimiter[] = [';', ','];

function splitCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  return line.split(delimiter).map((cell) => cell.trim());
}

function headersMatchExpected(headerCells: string[]): boolean {
  if (headerCells.length !== EXPECTED_HEADERS.length) {
    return false;
  }
  return EXPECTED_HEADERS.every(
    (expected, index) => headerCells[index] === expected
  );
}

function detectDelimiter(headerLine: string): CsvDelimiter | null {
  for (const delimiter of DELIMITERS) {
    const headerCells = splitCsvLine(headerLine, delimiter).map(normalizeHeader);
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

function parsePlayerType(raw: string): PlayerType | null {
  if (!raw.trim()) {
    return null;
  }
  return PLAYER_TYPE_BY_LABEL[normalizeLabelKey(raw)] ?? null;
}

function parsePlace(raw: string): Place | null {
  if (!raw.trim()) {
    return null;
  }
  return PLACE_BY_LABEL[normalizeLabelKey(raw)] ?? null;
}

function parseRoutineType(raw: string): RoutineType | null {
  if (!raw.trim()) {
    return null;
  }
  return ROUTINE_TYPE_BY_LABEL[normalizeLabelKey(raw)] ?? null;
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

function findExerciseByName(
  name: string,
  exercises: Exercise[]
): Exercise | undefined {
  const key = normalizeForSearch(name);
  if (!key) {
    return undefined;
  }
  const matches = exercises.filter(
    (e) => normalizeForSearch(e.name) === key
  );
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

export function parseRoutinesCsv(
  text: string,
  existingRoutines: Routine[],
  existingExercises: Exercise[]
): ParseRoutinesCsvResult {

  const normalized = text.replace(/^\uFEFF/, '').trim();
  if (!normalized) {
    return { ok: false, error: 'emptyFile' };
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: 'emptyFile' };
  }

  const delimiter = detectDelimiter(lines[0]);
  if (!delimiter) {
    return { ok: false, error: 'invalidHeaders' };
  }

  const headers = [...EXPECTED_HEADERS];
  let routineMeta: RoutineMeta | null = null;
  const daysByIndex = new Map<number, DayBuilder>();
  let routineId = uuidv4();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = splitCsvLine(lines[lineIndex], delimiter);
    if (cells.length !== headers.length) {
      return { ok: false, error: 'invalidRow' };
    }

    const record = rowToRecord(headers, cells);

    const nameCell = record.NOMBRE.trim();
    if (nameCell) {
      if (routineMeta && routineMeta.name !== nameCell) {
        return { ok: false, error: 'multipleRoutineNames' };
      }
      const playerType = parsePlayerType(record.PERFIL);
      const place = parsePlace(record.LUGAR);
      const type = parseRoutineType(record.PERIODO);
      if (!playerType) {
        return { ok: false, error: 'invalidPlayerType' };
      }
      if (!place) {
        return { ok: false, error: 'invalidPlace' };
      }
      if (!type) {
        return { ok: false, error: 'invalidRoutineType' };
      }
      routineMeta = { name: nameCell, playerType, place, type };
    }

    if (!routineMeta) {
      return { ok: false, error: 'missingRoutineName' };
    }

    const dayIndex = parsePositiveInt(record.DIA);
    if (dayIndex == null) {
      return { ok: false, error: 'invalidDay' };
    }

    const blockIndex = parsePositiveInt(record.BLOQUE_N);
    if (blockIndex == null) {
      return { ok: false, error: 'invalidBlockIndex' };
    }

    let dayBuilder = daysByIndex.get(dayIndex);
    if (!dayBuilder) {
      dayBuilder = {
        id: uuidv4(),
        day: dayIndex,
        blocks: new Map(),
      };
      daysByIndex.set(dayIndex, dayBuilder);
    }

    let blockBuilder = dayBuilder.blocks.get(blockIndex);
    const blockNameCell = record.BLOQUE_NOMBRE.trim();
    const blockSeriesCell = record.BLOQUE_SERIES.trim();

    if (!blockBuilder) {
      if (!blockNameCell) {
        return { ok: false, error: 'missingBlockName' };
      }
      if (!blockSeriesCell) {
        return { ok: false, error: 'missingBlockSeries' };
      }
      blockBuilder = {
        id: uuidv4(),
        trainingDayId: dayBuilder.id,
        index: blockIndex,
        name: blockNameCell,
        series: blockSeriesCell,
        exercises: [],
      };
      dayBuilder.blocks.set(blockIndex, blockBuilder);
    } else {
      if (blockNameCell) {
        blockBuilder.name = blockNameCell;
      }
      if (blockSeriesCell) {
        blockBuilder.series = blockSeriesCell;
      }
    }

    const exerciseIndex = parsePositiveInt(record.EJERCICIO_N);
    const exerciseName = record.EJERCICIO_NOMBRE.trim();
    const reps = record.EJERCICIO_REPETICIONES.trim();

    if (exerciseIndex == null) {
      return { ok: false, error: 'invalidExerciseIndex' };
    }
    if (!exerciseName) {
      return { ok: false, error: 'missingExerciseName' };
    }
    if (!reps) {
      return { ok: false, error: 'missingExerciseReps' };
    }

    const foundExercise = findExerciseByName(exerciseName, existingExercises);
    if (!foundExercise) {
      return { ok: false, error: 'exerciseNotFound', data: exerciseName };
    }

    if (
      blockBuilder.exercises.some((ex) => ex.index === exerciseIndex)
    ) {
      return { ok: false, error: 'duplicateExerciseIndexInBlock' };
    }

    blockBuilder.exercises.push({
      index: exerciseIndex,
      exerciseId: foundExercise.id,
      reps,
    });
  }

  if (!routineMeta) {
    return { ok: false, error: 'missingRoutineName' };
  }

  if (daysByIndex.size === 0) {
    return { ok: false, error: 'noRows' };
  }

  const existingRoutine = existingRoutines.find(
    (r) => r.name.trim().toLowerCase() === routineMeta!.name.trim().toLowerCase()
  );
  if (existingRoutine) {
    routineId = existingRoutine.id;
  }

  for (const dayBuilder of Array.from(daysByIndex.values())) {
    for (const blockBuilder of Array.from(dayBuilder.blocks.values())) {
      if (!blockBuilder.name.trim()) {
        return { ok: false, error: 'missingBlockName' };
      }
      if (!blockBuilder.series.trim()) {
        return { ok: false, error: 'missingBlockSeries' };
      }
      if (blockBuilder.exercises.length === 0) {
        return { ok: false, error: 'blockWithoutExercises' };
      }
      blockBuilder.exercises.sort((a, b) => a.index - b.index);
    }
  }

  const sortedDayIndices = Array.from(daysByIndex.keys()).sort((a, b) => a - b);
  const days: TrainingDay[] = sortedDayIndices.map((dayIndex) => {
    const dayBuilder = daysByIndex.get(dayIndex)!;
    return {
      id: dayBuilder.id,
      routineId,
      day: dayIndex,
      name: `Dia ${dayIndex}`,
      matchday: matchdayForDay(dayIndex),
    };
  });

  const blocks: TrainingBlock[] = [];
  for (const dayIndex of sortedDayIndices) {
    const dayBuilder = daysByIndex.get(dayIndex)!;
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
        series: blockBuilder.series.trim(),
        exercises: blockBuilder.exercises,
      });
    }
  }

  const routine: Routine = {
    id: routineId,
    name: routineMeta.name.trim(),
    playerType: routineMeta.playerType,
    place: routineMeta.place,
    type: routineMeta.type,
  };

  return {
    ok: true,
    payload: { routine, days, blocks },
  };
}
