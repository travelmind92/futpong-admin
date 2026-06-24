import { v4 as uuidv4 } from 'uuid';
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
import { Exercise_2 } from '../types/types';
import { EXERCISE_2_VERSION } from '../services/dynamo/serialize';
import { stripAccents, normalizeImportValue } from './stripAccents';

const EXCLUDED_PROPS = ['id', 'videoUrl', 'imageUrl'] as const;

type ExcludedProp = (typeof EXCLUDED_PROPS)[number];
type ImportProp = Exclude<keyof Exercise_2, ExcludedProp>;

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

export type ParsedExercise2Row = Omit<Exercise_2, 'id' | 'videoUrl' | 'imageUrl'>;

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

const REP_TYPE_LOOKUP = buildEnumLookup(RepType_2, RepTypeLabel);
const AGE_LOOKUP = buildEnumLookup(Age, AgeLabel);
const LEVEL_LOOKUP = buildEnumLookup(Level, LevelLabel);
const PLACE_LOOKUP = buildEnumLookup(Place_2, PlaceLabel);
const PERIOD_LOOKUP = buildEnumLookup(Period_2, PeriodLabel);
const BLOCK_TYPE_LOOKUP = buildEnumLookup(BlockType, BlockTypeLabel);
const CATEGORY_LOOKUP = buildEnumLookup(ExerciseCategory, ExerciseCategoryLabel);
const SKILL_LOOKUP = buildEnumLookup(Skill, SkillLabel);
const CHALLENGE_LEVEL_LOOKUP = buildEnumLookup(
  ChallengeLevel,
  ChallengeLevelLabel
);
const ELEMENT_LOOKUP = buildEnumLookup(Element, ElementLabel);
const WEIGHT_TYPE_LOOKUP = buildEnumLookup(WeightType, WeightTypeLabel);
const IMPACT_LOOKUP = buildEnumLookup(Impact, ImpactLabel);
const DIFFICULTY_LOOKUP = buildEnumLookup(Difficulty, DifficultyLabel);

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

type CsvDelimiter = ';' | ',';

const DELIMITERS: CsvDelimiter[] = [';', ','];

function splitCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  return line.split(delimiter).map((cell) => cell.trim());
}

function headersMatchExpected(headerCells: string[]): boolean {
  if (headerCells.length !== EXERCISE_2_IMPORT_HEADERS.length) {
    return false;
  }
  return EXERCISE_2_IMPORT_HEADERS.every(
    (expected, index) => headerCells[index] === normalizeImportValue(expected)
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

  const rows: ParsedExercise2Row[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = splitCsvLine(lines[lineIndex], delimiter);
    if (cells.length !== EXERCISE_2_IMPORT_COLUMNS.length) {
      return { ok: false, error: 'invalidRow' };
    }
    const parsed = parseRow(cells);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    rows.push(parsed.row);
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

function exercise2FromImportRow(
  row: ParsedExercise2Row,
  existing?: Exercise_2
): Exercise_2 {
  const exercise: Exercise_2 = {
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
  existingExercises: Exercise_2[] = []
): Exercise_2[] {
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
