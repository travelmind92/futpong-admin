import { Place, PlayerType, RepType, RoutineType } from '../types';
import type { TranslateOptions } from './translate';

type EnumNamespace = 'repType' | 'playerType' | 'place' | 'routineType';

type TranslateFn = (key: string, options?: TranslateOptions) => string;

function enumLabel(t: TranslateFn, ns: EnumNamespace, value: string): string {
  return t(`enums.${ns}.${value}`, { defaultValue: value });
}

export function translateRepType(t: TranslateFn, value: RepType): string {
  return enumLabel(t, 'repType', value);
}

export function translatePlayerType(t: TranslateFn, value: PlayerType): string {
  return enumLabel(t, 'playerType', value);
}

export function translatePlace(t: TranslateFn, value: Place): string {
  return enumLabel(t, 'place', value);
}

export function translateRoutineType(t: TranslateFn, value: RoutineType): string {
  return enumLabel(t, 'routineType', value);
}
