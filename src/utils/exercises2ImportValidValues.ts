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
import { stripAccents } from './stripAccents';

function formatValidValues(
  fieldLabel: string,
  labelMap: Record<string, string>
): string {
  const values = Object.values(labelMap)
    .map((value) => `"${stripAccents(value)}"`)
    .join(' / ');
  return `${stripAccents(fieldLabel)}: ${values}`;
}

export const EXERCISE_2_IMPORT_VALID_VALUES: string[] = [
  formatValidValues(ExercisePropLabels.repType, RepTypeLabel),
  formatValidValues(ExercisePropLabels.ages, AgeLabel),
  formatValidValues(ExercisePropLabels.level, LevelLabel),
  formatValidValues(ExercisePropLabels.places, PlaceLabel),
  formatValidValues(ExercisePropLabels.period, PeriodLabel),
  formatValidValues(ExercisePropLabels.blockType, BlockTypeLabel),
  formatValidValues(ExercisePropLabels.category, ExerciseCategoryLabel),
  formatValidValues(ExercisePropLabels.skill, SkillLabel),
  formatValidValues(ExercisePropLabels.challengeLevel, ChallengeLevelLabel),
  formatValidValues(ExercisePropLabels.elements, ElementLabel),
  formatValidValues(ExercisePropLabels.weightType, WeightTypeLabel),
  formatValidValues(ExercisePropLabels.impact, ImpactLabel),
  formatValidValues(ExercisePropLabels.difficulty, DifficultyLabel),
];
