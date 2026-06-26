import { v4 as uuidv4 } from 'uuid';
import {
  Age_V3,
  BlockType_V3,
  ChallengeLevel_V3,
  Difficulty_V3,
  Element_V3,
  ExerciseCategory_V3,
  Impact_V3,
  Level_V3,
  Period_V3,
  Place_V3,
  RepType_V3,
  Skill_V3,
  WeightType_V3,
} from '../types/enums';
import {
  AgeLabel,
  BlockTypeLabel,
  ChallengeLevelLabel,
  DifficultyLabel,
  ElementLabel,
  ExerciseCategoryLabel,
  ExercisePropLabels,
  ImpactLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
  RepTypeLabel,
  SkillLabel,
  WeightTypeLabel,
} from '../types/labels';
import { Exercise_V3 } from '../types/types';
import { EXERCISE_2_VERSION } from '../services/dynamo/serialize';
import { stripAccents, normalizeImportValue } from './stripAccents';
import {
  CsvDelimiter,
  parseCsvRecords,
} from './parseCsvRecords';

const EXCLUDED_PROPS = ['id', 'videoUrl', 'imageUrl'] as const;

type ExcludedProp = (typeof EXCLUDED_PROPS)[number];
type ImportProp = Exclude<keyof Exercise_V3, ExcludedProp>;

export const EXERCISE_2_IMPORT_COLUMNS: ImportProp[] = [
  'name',
  'description',
  'repType',
  'ages',
  'level',
  'places',
  'period',
  'blockType',
  'category',
  'skill',
  'challengeLevel',
  'mainMuscle',
  'elements',
  'weightType',
  'impact',
  'difficulty',
  'sistituteGroup',
];

function labelToHeader(label: string): string {
  return stripAccents(label)
    .split(/\s+/)
    .filter((word) => word.toLowerCase() !== 'de')
    .join('_')
    .toUpperCase();
}

export const EXERCISE_2_IMPORT_HEADERS: string[] = EXERCISE_2_IMPORT_COLUMNS.map(
  (prop) => labelToHeader(ExercisePropLabels[prop])
);

export type ParsedExercise2Row = Omit<Exercise_V3, 'id' | 'videoUrl' | 'imageUrl'>;

export type ParseExercises2CsvResult =
  | { ok: true; rows: ParsedExercise2Row[] }
  | { ok: false; error: string };

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

const REP_TYPE_LOOKUP = buildEnumLookup(RepType_V3, RepTypeLabel);
const AGE_LOOKUP = buildEnumLookup(Age_V3, AgeLabel);
const LEVEL_LOOKUP = buildEnumLookup(Level_V3, LevelLabel);
const PLACE_LOOKUP = buildEnumLookup(Place_V3, PlaceLabel);
const PERIOD_LOOKUP = buildEnumLookup(Period_V3, PeriodLabel);
const BLOCK_TYPE_LOOKUP = buildEnumLookup(BlockType_V3, BlockTypeLabel);
const CATEGORY_LOOKUP = buildEnumLookup(ExerciseCategory_V3, ExerciseCategoryLabel);
const SKILL_LOOKUP = buildEnumLookup(Skill_V3, SkillLabel);
const CHALLENGE_LEVEL_LOOKUP = buildEnumLookup(
  ChallengeLevel_V3,
  ChallengeLevelLabel
);
const ELEMENT_LOOKUP = buildEnumLookup(Element_V3, ElementLabel);
const WEIGHT_TYPE_LOOKUP = buildEnumLookup(WeightType_V3, WeightTypeLabel);
const IMPACT_LOOKUP = buildEnumLookup(Impact_V3, ImpactLabel);
const DIFFICULTY_LOOKUP = buildEnumLookup(Difficulty_V3, DifficultyLabel);

function parseEnum<V>(lookup: Map<string, V>, raw: string): V | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return lookup.get(normalizeImportValue(trimmed)) ?? null;
}

function splitArrayCell(raw: string): string[] {
  return raw
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseEnumArray<V>(
  lookup: Map<string, V>,
  raw: string
): { ok: true; values: V[] } | { ok: false } {
  const parts = splitArrayCell(raw);
  const values: V[] = [];
  for (const part of parts) {
    const value = lookup.get(normalizeImportValue(part));
    if (!value) {
      return { ok: false };
    }
    values.push(value);
  }
  return { ok: true, values };
}

function normalizeHeader(value: string): string {
  return normalizeImportValue(value.replace(/^\uFEFF/, ''));
}

const DELIMITERS: CsvDelimiter[] = [';', ','];

function headersMatchExpected(headerCells: string[]): boolean {
  if (headerCells.length !== EXERCISE_2_IMPORT_HEADERS.length) {
    return false;
  }
  return EXERCISE_2_IMPORT_HEADERS.every(
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

function parseRow(
  cells: string[]
): { ok: true; row: ParsedExercise2Row } | { ok: false; error: string } {
  const cellFor = (prop: ImportProp): string => {
    const index = EXERCISE_2_IMPORT_COLUMNS.indexOf(prop);
    return cells[index]?.trim() ?? '';
  };

  const name = cellFor('name');
  if (!name) {
    return { ok: false, error: 'missingName' };
  }
  const description = cellFor('description');
  if (!description) {
    return { ok: false, error: 'missingDescription' };
  }

  const repType = parseEnum(REP_TYPE_LOOKUP, cellFor('repType'));
  if (!repType) {
    return { ok: false, error: 'invalidRepType' };
  }

  const ages = parseEnumArray(AGE_LOOKUP, cellFor('ages'));
  if (!ages.ok || ages.values.length === 0) {
    return { ok: false, error: 'invalidAges' };
  }

  const level = parseEnum(LEVEL_LOOKUP, cellFor('level'));
  if (!level) {
    return { ok: false, error: 'invalidLevel' };
  }

  const places = parseEnumArray(PLACE_LOOKUP, cellFor('places'));
  if (!places.ok || places.values.length === 0) {
    return { ok: false, error: 'invalidPlaces' };
  }

  const blockType = parseEnum(BLOCK_TYPE_LOOKUP, cellFor('blockType'));
  if (!blockType) {
    return { ok: false, error: 'invalidBlockType' };
  }

  const category = parseEnum(CATEGORY_LOOKUP, cellFor('category'));
  if (!category) {
    return { ok: false, error: 'invalidCategory' };
  }

  const row: ParsedExercise2Row = {
    name,
    description,
    repType,
    ages: ages.values,
    level,
    places: places.values,
    blockType,
    category,
  };

  const periodRaw = cellFor('period');
  if (periodRaw) {
    const period = parseEnum(PERIOD_LOOKUP, periodRaw);
    if (!period) {
      return { ok: false, error: 'invalidPeriod' };
    }
    row.period = period;
  }

  const skillRaw = cellFor('skill');
  if (skillRaw) {
    const skill = parseEnum(SKILL_LOOKUP, skillRaw);
    if (!skill) {
      return { ok: false, error: 'invalidSkill' };
    }
    row.skill = skill;
  }

  const challengeLevelRaw = cellFor('challengeLevel');
  if (challengeLevelRaw) {
    const challengeLevel = parseEnum(CHALLENGE_LEVEL_LOOKUP, challengeLevelRaw);
    if (!challengeLevel) {
      return { ok: false, error: 'invalidChallengeLevel' };
    }
    row.challengeLevel = challengeLevel;
  }

  const mainMuscle = cellFor('mainMuscle');
  if (mainMuscle) {
    row.mainMuscle = mainMuscle;
  }

  const elementsRaw = cellFor('elements');
  if (elementsRaw) {
    const elements = parseEnumArray(ELEMENT_LOOKUP, elementsRaw);
    if (!elements.ok) {
      return { ok: false, error: 'invalidElements' };
    }
    if (elements.values.length > 0) {
      row.elements = elements.values;
    }
  }

  const weightTypeRaw = cellFor('weightType');
  if (weightTypeRaw) {
    const weightType = parseEnum(WEIGHT_TYPE_LOOKUP, weightTypeRaw);
    if (!weightType) {
      return { ok: false, error: 'invalidWeightType' };
    }
    row.weightType = weightType;
  }

  const impactRaw = cellFor('impact');
  if (impactRaw) {
    const impact = parseEnum(IMPACT_LOOKUP, impactRaw);
    if (!impact) {
      return { ok: false, error: 'invalidImpact' };
    }
    row.impact = impact;
  }

  const difficultyRaw = cellFor('difficulty');
  if (difficultyRaw) {
    const difficulty = parseEnum(DIFFICULTY_LOOKUP, difficultyRaw);
    if (!difficulty) {
      return { ok: false, error: 'invalidDifficulty' };
    }
    row.difficulty = difficulty;
  }

  const sistituteGroup = cellFor('sistituteGroup');
  if (sistituteGroup) {
    row.sistituteGroup = sistituteGroup;
  }

  return { ok: true, row };
}

export function parseExercises2Csv(text: string): ParseExercises2CsvResult {
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

  const dataRecords = records.slice(1).filter((record) =>
    record.some((cell) => cell.trim().length > 0)
  );

  if (dataRecords.length === 0) {
    return { ok: false, error: 'noRows' };
  }

  const rows: ParsedExercise2Row[] = [];

  for (const record of dataRecords) {
    const cells = record.map((cell) => cell.trim());
    if (cells.length !== EXERCISE_2_IMPORT_COLUMNS.length) {
      return { ok: false, error: 'invalidRow' };
    }
    const parsed = parseRow(cells);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    rows.push(parsed.row);
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

function exercise2FromImportRow(
  row: ParsedExercise2Row,
  existing?: Exercise_V3
): Exercise_V3 {
  const exercise: Exercise_V3 = {
    id: existing?.id ?? uuidv4(),
    ...row,
    version: EXERCISE_2_VERSION,
  };
  if (existing) {
    const videoUrl = existing.videoUrl?.trim();
    if (videoUrl) {
      exercise.videoUrl = videoUrl;
    }
    const imageUrl = existing.imageUrl?.trim();
    if (imageUrl) {
      exercise.imageUrl = imageUrl;
    }
  }
  return exercise;
}

export function parsedRowsToExercises2(
  rows: ParsedExercise2Row[],
  existingExercises: Exercise_V3[] = []
): Exercise_V3[] {
  const existingByName = new Map(
    existingExercises.map((ex) => [ex.name.trim().toLowerCase(), ex])
  );

  return rows.map((row) =>
    exercise2FromImportRow(
      row,
      existingByName.get(row.name.trim().toLowerCase())
    )
  );
}
