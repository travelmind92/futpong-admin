import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { getAll, remove, save } from '../services/api/api';
import {
  buildExerciseV3FormData,
  parseSavedExerciseV3Body,
  type SaveExerciseV3Input,
} from '../services/api/exerciseV3Save';
import { normalizeExercise2, normalizeTrainingBlockV3 } from '../services/dynamo/normalize';
import {
  EXERCISE_2_RESOURCE,
  EXERCISE_2_VERSION,
  TRAINING_BLOCK_V3_RESOURCE,
  exercise2ToDynamoItem,
} from '../services/dynamo/serialize';
import { Exercise_V3, TrainingBlock_V3 } from '../types/types';
import { isExerciseIdUsedInTrainingBlocks } from '../utils/exerciseTrainingBlockRefs';
import { EXERCISE_IN_USE_ERROR_CODE } from '../i18n/errorCodes';
import { translate } from '../i18n/translate';

export type { SaveExerciseV3Input } from '../services/api/exerciseV3Save';

export type Exercises2ContextValue = {
  exercises: Exercise_V3[];
  setExercises: React.Dispatch<React.SetStateAction<Exercise_V3[]>>;
  dataLoading: boolean;
  dataError: string | null;
  setDataError: React.Dispatch<React.SetStateAction<string | null>>;
  updateExercise: (input: SaveExerciseV3Input) => Promise<void>;
  removeExercise: (id: string) => Promise<void>;
};

async function persistExerciseV3(input: SaveExerciseV3Input): Promise<Exercise_V3> {
  const hasMedia = input.media !== undefined;
  const body = hasMedia
    ? buildExerciseV3FormData(input)
    : exercise2ToDynamoItem(input.exercise);

  const responseBody = await save(EXERCISE_2_RESOURCE, input.exercise.id, body);
  return (
    parseSavedExerciseV3Body(responseBody) ?? input.exercise
  );
}

function isV3Item(item: Record<string, unknown>): boolean {
  return item.version === EXERCISE_2_VERSION;
}

export function ExercisesV3Layout() {
  const [exercises, setExercises] = useState<Exercise_V3[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const trainingBlocksRef = useRef<TrainingBlock_V3[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [rawExercises, rawBlocks] = await Promise.all([
          getAll<Record<string, unknown>>(EXERCISE_2_RESOURCE, true),
          getAll<Record<string, unknown>>(TRAINING_BLOCK_V3_RESOURCE, true),
        ]);
        if (cancelled) return;
        const ex = rawExercises
          .filter(isV3Item)
          .map((item) => normalizeExercise2(item))
          .filter((x): x is Exercise_V3 => x !== null);
        ex.sort((a, b) => a.name.localeCompare(b.name));
        setExercises(ex);

        trainingBlocksRef.current = rawBlocks
          .filter(isV3Item)
          .map((item) => normalizeTrainingBlockV3(item))
          .filter((x): x is TrainingBlock_V3 => x !== null);
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

  const removeExercise = useCallback(async (id: string) => {
    if (isExerciseIdUsedInTrainingBlocks(id, trainingBlocksRef.current)) {
      const msg = translate('errors.exerciseInUse');
      const err = new Error(msg) as Error & { code: string };
      err.code = EXERCISE_IN_USE_ERROR_CODE;
      setDataError(msg);
      throw err;
    }
    try {
      await remove(EXERCISE_2_RESOURCE, id);
      setDataError(null);
      setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate('errors.removeExercise');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const updateExercise = useCallback(async (input: SaveExerciseV3Input) => {
    try {
      const saved = await persistExerciseV3(input);
      setDataError(null);
      setExercises((prev) => {
        const next = prev.map((exercise) =>
          exercise.id === saved.id ? saved : exercise
        );
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate('errors.updateExercise');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const outletContext = useMemo(
    (): Exercises2ContextValue => ({
      exercises,
      setExercises,
      dataLoading,
      dataError,
      setDataError,
      updateExercise,
      removeExercise,
    }),
    [exercises, dataLoading, dataError, updateExercise, removeExercise]
  );

  return <Outlet context={outletContext} />;
}
