import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  bulkSave,
  getAll,
  remove,
  save,
} from '../services/api/api';
import {
  buildExerciseFormData,
  parseSavedExerciseBody,
  type SaveExerciseInput,
} from '../services/api/exerciseSave';
import { normalizeExercise } from '../services/dynamo/normalize';
import { exerciseToDynamoItem } from '../services/dynamo/serialize';
import { Exercise } from '../types';
import { isExerciseIdUsedInTrainingBlocks } from '../utils/exerciseTrainingBlockRefs';
import { translate } from '../i18n/translate';
import { EXERCISE_IN_USE_ERROR_CODE } from '../i18n/errorCodes';
import { useRoutines } from './RoutinesContext';

export type { SaveExerciseInput } from '../services/api/exerciseSave';

export type ExercisesContextValue = {
  exercises: Exercise[];
  addExercise: (input: SaveExerciseInput) => Promise<void>;
  updateExercise: (input: SaveExerciseInput) => Promise<void>;
  importExercises: (items: Exercise[]) => Promise<void>;
  removeExercise: (id: string) => Promise<void>;
  dataLoading: boolean;
  dataError: string | null;
};

const ExercisesContext = createContext<ExercisesContextValue | null>(null);

export function useExercises(): ExercisesContextValue {
  const v = useContext(ExercisesContext);
  if (!v) {
    throw new Error('useExercises must be used within ExercisesProvider');
  }
  return v;
}

function resolveSavedExercise(
  body: unknown,
  fallback: Exercise
): Exercise {
  return parseSavedExerciseBody(body) ?? fallback;
}

async function persistExercise(input: SaveExerciseInput): Promise<Exercise> {
  const hasMedia = input.media !== undefined;

  const body = hasMedia
    ? buildExerciseFormData(input)
    : exerciseToDynamoItem(input.exercise);

  const responseBody = await save('exercises', input.exercise.id, body);
  return resolveSavedExercise(responseBody, input.exercise);
}

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const { trainingBlocks } = useRoutines();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const raw = await getAll<Record<string, unknown>>('exercises', true);
        if (cancelled) return;
        const ex = raw
          .map((item) => normalizeExercise(item))
          .filter((x): x is Exercise => x !== null);
        ex.sort((a, b) => a.name.localeCompare(b.name));
        setExercises(ex);
      } catch (e) {
        if (!cancelled) {
          setDataError(
            e instanceof Error ? e.message : translate('errors.loadExercises')
          );
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addExercise = useCallback(async (input: SaveExerciseInput) => {
    try {
      const saved = await persistExercise(input);
      setDataError(null);
      setExercises((prev) => [saved, ...prev]);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : translate('errors.saveExercise');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const updateExercise = useCallback(async (input: SaveExerciseInput) => {
    try {
      const saved = await persistExercise(input);
      setDataError(null);
      setExercises((prev) =>
        prev.map((e) => (e.id === saved.id ? saved : e))
      );
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : translate('errors.updateExercise');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const importExercises = useCallback(async (items: Exercise[]) => {
    if (items.length === 0) {
      return;
    }
    try {
      await bulkSave(
        'exercises',
        items.map((exercise) => exerciseToDynamoItem(exercise))
      );
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : translate('errors.importExercises');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
    setDataError(null);
    setExercises((prev) => {
      const byId = new Map(prev.map((exercise) => [exercise.id, exercise]));
      for (const item of items) {
        byId.set(item.id, item);
      }
      const merged = Array.from(byId.values());
      merged.sort((a, b) => a.name.localeCompare(b.name));
      return merged;
    });
  }, []);

  const removeExercise = useCallback(
    async (id: string) => {
      if (isExerciseIdUsedInTrainingBlocks(id, trainingBlocks)) {
        const msg = translate('errors.exerciseInUse');
        const err = new Error(msg) as Error & { code: string };
        err.code = EXERCISE_IN_USE_ERROR_CODE;
        setDataError(msg);
        throw err;
      }
      try {
        await remove('exercises', id);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : translate('errors.removeExercise');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setExercises((prev) => prev.filter((e) => e.id !== id));
    },
    [trainingBlocks]
  );

  const value = useMemo(
    (): ExercisesContextValue => ({
      exercises,
      addExercise,
      updateExercise,
      importExercises,
      removeExercise,
      dataLoading,
      dataError,
    }),
    [
      exercises,
      addExercise,
      updateExercise,
      importExercises,
      removeExercise,
      dataLoading,
      dataError,
    ]
  );

  return (
    <ExercisesContext.Provider value={value}>{children}</ExercisesContext.Provider>
  );
}
