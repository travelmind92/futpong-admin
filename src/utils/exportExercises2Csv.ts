import {
  AgeLabel,
  BlockTypeLabel,
  ChallengeLevelLabel,
  DifficultyLabel,
  ElementLabel,
  ExerciseCategoryLabel,
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
import {
  EXERCISE_2_IMPORT_COLUMNS,
  EXERCISE_2_IMPORT_HEADERS,
} from './parseExercises2Csv';

const CSV_DELIMITER = ',' as const;

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

function formatArrayCell<T extends string>(
  values: T[] | undefined,
  labelMap: Record<T, string>
): string {
  if (!values || values.length === 0) {
    return '';
  }
  const labels = values.map((value) => labelMap[value]);
  if (labels.length === 1) {
    return labels[0];
  }
  return labels.join(' / ');
}

function formatEnumCell<T extends string>(
  value: T | undefined,
  labelMap: Record<T, string>
): string {
  if (!value) {
    return '';
  }
  return labelMap[value];
}

function exerciseToCsvCells(exercise: Exercise_V3): string[] {
  const cellFor = (prop: (typeof EXERCISE_2_IMPORT_COLUMNS)[number]): string => {
    switch (prop) {
      case 'name':
        return exercise.name;
      case 'description':
        return exercise.description;
      case 'repType':
        return formatEnumCell(exercise.repType, RepTypeLabel);
      case 'ages':
        return formatArrayCell(exercise.ages, AgeLabel);
      case 'levels':
        return formatArrayCell(exercise.levels, LevelLabel);
      case 'places':
        return formatArrayCell(exercise.places, PlaceLabel);
      case 'periods':
        return formatArrayCell(exercise.periods, PeriodLabel);
      case 'blockTypes':
        return formatArrayCell(exercise.blockTypes, BlockTypeLabel);
      case 'categories':
        return formatArrayCell(exercise.categories, ExerciseCategoryLabel);
      case 'skills':
        return formatArrayCell(exercise.skills, SkillLabel);
      case 'challengeLevel':
        return formatEnumCell(exercise.challengeLevel, ChallengeLevelLabel);
      case 'mainMuscle':
        return exercise.mainMuscle ?? '';
      case 'elements':
        return formatArrayCell(exercise.elements, ElementLabel);
      case 'weightType':
        return formatEnumCell(exercise.weightType, WeightTypeLabel);
      case 'impact':
        return formatEnumCell(exercise.impact, ImpactLabel);
      case 'difficulty':
        return formatEnumCell(exercise.difficulty, DifficultyLabel);
      case 'sistituteGroup':
        return exercise.sistituteGroup ?? '';
      default:
        return '';
    }
  };

  return EXERCISE_2_IMPORT_COLUMNS.map((prop) =>
    formatCsvCell(cellFor(prop))
  );
}

export function exercisesToExercises2Csv(exercises: Exercise_V3[]): string {
  const v3Exercises = exercises.filter(
    (exercise) => exercise.version === EXERCISE_2_VERSION
  );
  const rows = [
    EXERCISE_2_IMPORT_HEADERS.join(CSV_DELIMITER),
    ...v3Exercises.map((exercise) => exerciseToCsvCells(exercise).join(CSV_DELIMITER)),
  ];
  return `${rows.join('\n')}\n`;
}
