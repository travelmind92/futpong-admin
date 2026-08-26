import {
  AgeLabel,
  BlockTypeLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
} from '../types/labels';
import {
  Exercise_V3,
  Routine_V3,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../types/types';
import { EXPECTED_HEADERS } from './parseRoutinesV3Csv';

const CSV_DELIMITER = ',' as const;

type CsvColumn = (typeof EXPECTED_HEADERS)[number];

export type RoutineV3CsvExportInput = {
  routine: Routine_V3;
  days: TrainingDay_V3[];
  blocksByDayId: Map<string, TrainingBlock_V3[]>;
  exerciseById: Map<string, Exercise_V3>;
};

function formatCsvCell(value: string): string {
  if (
    value.includes('"') ||
    value.includes(CSV_DELIMITER) ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exerciseNameFor(
  exerciseId: string,
  exerciseById: Map<string, Exercise_V3>
): string {
  return exerciseById.get(exerciseId)?.name ?? exerciseId;
}

/**
 * Serializes a routine (with its days, blocks, and exercises) into the same CSV
 * shape produced by the import template: routine metadata appears only on the
 * first row, day fields only on the first row of each session, and block fields
 * only on the first row of each block. Enum values use their Spanish labels so
 * the output round-trips through {@link parseRoutinesV3Csv}.
 */
export function routineToRoutinesV3Csv(input: RoutineV3CsvExportInput): string {
  const { routine, days, blocksByDayId, exerciseById } = input;

  const sortedDays = [...days].sort((a, b) => a.session - b.session);
  const rows: string[][] = [];
  let isFirstRow = true;

  for (const day of sortedDays) {
    const blocks = [...(blocksByDayId.get(day.id) ?? [])].sort(
      (a, b) => a.index - b.index
    );
    let isFirstRowOfDay = true;

    for (const block of blocks) {
      const exercises = [...block.exercises].sort((a, b) => a.index - b.index);
      let isFirstRowOfBlock = true;

      for (const item of exercises) {
        const cells: Record<CsvColumn, string> = {
          NOMBRE: isFirstRow ? routine.name : '',
          EDAD: isFirstRow ? AgeLabel[routine.age] : '',
          NIVEL: isFirstRow ? LevelLabel[routine.level] : '',
          LUGAR: isFirstRow ? PlaceLabel[routine.place] : '',
          PERIODO: isFirstRow ? PeriodLabel[routine.period] : '',
          DIA_SESION: isFirstRowOfDay ? String(day.session) : '',
          DIA_NOMBRE: isFirstRowOfDay ? day.name : '',
          DIA_MINUTOS: isFirstRowOfDay ? String(day.minutes) : '',
          DIA_FRASE_INICIAL: isFirstRowOfDay ? day.openingPhrase : '',
          DIA_FRASE_FINAL: isFirstRowOfDay ? day.closingPhrase : '',
          BLOQUE_N: isFirstRowOfBlock ? String(block.index) : '',
          BLOQUE_NOMBRE: isFirstRowOfBlock ? block.name : '',
          BLOQUE_TIPO: isFirstRowOfBlock ? BlockTypeLabel[block.blockType] : '',
          BLOQUE_SERIES: isFirstRowOfBlock ? String(block.series) : '',
          EJ_N: String(item.index),
          EJ_NOMBRE: exerciseNameFor(item.exerciseId, exerciseById),
          EJ_REPETICIONES: item.reps,
          EJ_SEGUNDOS_DESCANSO:
            item.restSeconds != null ? String(item.restSeconds) : '',
        };

        rows.push(EXPECTED_HEADERS.map((header) => formatCsvCell(cells[header])));
        isFirstRow = false;
        isFirstRowOfDay = false;
        isFirstRowOfBlock = false;
      }
    }
  }

  const lines = [
    EXPECTED_HEADERS.join(CSV_DELIMITER),
    ...rows.map((row) => row.join(CSV_DELIMITER)),
  ];
  return `${lines.join('\n')}\n`;
}

export function routineV3CsvFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${slug || 'rutina'}.csv`;
}
