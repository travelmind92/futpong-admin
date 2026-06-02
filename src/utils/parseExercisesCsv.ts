import { v4 as uuidv4 } from 'uuid';
import { Exercise, RepType } from '../types';

const EXPECTED_HEADERS = [
  'NOMBRE',
  'DESCRIPCION',
  'TIPO_REPETICION',
  'GRUPO_REEMPLAZO',
] as const;

type CsvColumn = (typeof EXPECTED_HEADERS)[number];

const REP_TYPE_BY_LABEL: Record<string, RepType> = {
  Repeticiones: RepType.REPETITIONS,
  Repetitions: RepType.REPETITIONS,
  Segundos: RepType.SECONDS,
  Seconds: RepType.SECONDS,
};

export type ParsedExerciseRow = {
  name: string;
  description: string;
  repType: RepType;
  equivalenceGroup?: string;
};

export type ParseExercisesCsvResult =
  | { ok: true; rows: ParsedExerciseRow[] }
  | { ok: false; error: string };

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, '').trim().toUpperCase();
}

function parseRepType(raw: string): RepType | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const direct = REP_TYPE_BY_LABEL[trimmed];
  if (direct) {
    return direct;
  }
  const insensitive = Object.entries(REP_TYPE_BY_LABEL).find(
    ([label]) => label.toLowerCase() === trimmed.toLowerCase()
  );
  return insensitive?.[1] ?? null;
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

export function parseExercisesCsv(text: string): ParseExercisesCsvResult {
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
  const rows: ParsedExerciseRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = splitCsvLine(lines[lineIndex], delimiter);
    if (cells.length !== headers.length) {
      return { ok: false, error: 'invalidRow' };
    }

    const record = rowToRecord(headers, cells);
    const name = record.NOMBRE.trim();
    const description = record.DESCRIPCION.trim();
    const repType = parseRepType(record.TIPO_REPETICION);
    const equivalenceGroup = record.GRUPO_REEMPLAZO.trim();

    if (!name) {
      return { ok: false, error: 'missingName' };
    }
    if (!description) {
      return { ok: false, error: 'missingDescription' };
    }
    if (!repType) {
      return { ok: false, error: 'invalidRepType' };
    }

    rows.push({
      name,
      description,
      repType,
      ...(equivalenceGroup ? { equivalenceGroup } : {}),
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: 'noRows' };
  }

  const seenNames = new Set<string>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (seenNames.has(key)) {
      return { ok: false, error: 'duplicateNameInFile' };
    }
    seenNames.add(key);
  }

  return { ok: true, rows };
}

function exerciseFromImportRow(
  row: ParsedExerciseRow,
  existing?: Exercise
): Exercise {
  if (existing) {
    const exercise: Exercise = {
      id: existing.id,
      name: row.name,
      description: row.description,
      repType: row.repType,
    };
    const videoUrl = existing.videoUrl?.trim();
    if (videoUrl) {
      exercise.videoUrl = videoUrl;
    }
    const imageUrl = existing.imageUrl?.trim();
    if (imageUrl) {
      exercise.imageUrl = imageUrl;
    }
    if (row.equivalenceGroup) {
      exercise.equivalenceGroup = row.equivalenceGroup;
    }
    return exercise;
  }

  return {
    id: uuidv4(),
    name: row.name,
    description: row.description,
    repType: row.repType,
    ...(row.equivalenceGroup
      ? { equivalenceGroup: row.equivalenceGroup }
      : {}),
  };
}

export function parsedRowsToExercises(
  rows: ParsedExerciseRow[],
  existingExercises: Exercise[] = []
): Exercise[] {
  const existingByName = new Map(
    existingExercises.map((ex) => [ex.name.trim().toLowerCase(), ex])
  );

  return rows.map((row) =>
    exerciseFromImportRow(
      row,
      existingByName.get(row.name.trim().toLowerCase())
    )
  );
}
