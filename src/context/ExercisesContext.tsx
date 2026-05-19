import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAll } from '../services/api/api';
import { normalizeExercise } from '../services/dynamo/normalize';
import { exerciseToDynamoItem } from '../services/dynamo/serialize';
import { EXERCISES_TABLE } from '../services/dynamo/tables';
import { useDynamoActions } from '../services/dynamo/dynamoActions';
import { Exercise } from '../types';
import { isExerciseIdUsedInTrainingBlocks } from '../utils/exerciseTrainingBlockRefs';
import { ServicesContext } from './servicesOutletContext';
import { useRoutines } from './RoutinesContext';

export type ExercisesContextValue = {
  exercises: Exercise[];
  addExercise: (exercise: Exercise) => Promise<void>;
  updateExercise: (exercise: Exercise) => Promise<void>;
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

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const { trainingBlocks } = useRoutines();
  const services = useContext(ServicesContext);
  const dynamoClient = services?.dynamoClient;
  const dynamoApi = useDynamoActions();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const raw = await getAll<Record<string, unknown>>('exercises');
        if (cancelled) return;
        const ex = raw
          .map((item) => normalizeExercise(item))
          .filter((x): x is Exercise => x !== null);
        ex.sort((a, b) => a.name.localeCompare(b.name));
        setExercises(ex);
      } catch (e) {
        if (!cancelled) {
          setDataError(
            e instanceof Error ? e.message : 'Failed to load exercises'
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

  const addExercise = useCallback(
    async (exercise: Exercise) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { save } = dynamoApi(dynamoClient);
      try {
        await save(EXERCISES_TABLE, [exerciseToDynamoItem(exercise)]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Failed to save exercise to the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setExercises((prev) => [exercise, ...prev]);
    },
    [dynamoApi, dynamoClient]
  );

  const updateExercise = useCallback(
    async (exercise: Exercise) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { save } = dynamoApi(dynamoClient);
      try {
        await save(EXERCISES_TABLE, [exerciseToDynamoItem(exercise)]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Failed to update exercise in the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setExercises((prev) =>
        prev.map((e) => (e.id === exercise.id ? exercise : e))
      );
    },
    [dynamoApi, dynamoClient]
  );

  const removeExercise = useCallback(
    async (id: string) => {
      if (isExerciseIdUsedInTrainingBlocks(id, trainingBlocks)) {
        const msg =
          'This exercise is still used in one or more training blocks. Remove it from those blocks before deleting.';
        setDataError(msg);
        throw new Error(msg);
      }
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { remove } = dynamoApi(dynamoClient);
      try {
        await remove(EXERCISES_TABLE, [id]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Failed to remove exercise from the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setExercises((prev) => prev.filter((e) => e.id !== id));
    },
    [dynamoApi, dynamoClient, trainingBlocks]
  );

  const value = useMemo(
    (): ExercisesContextValue => ({
      exercises,
      addExercise,
      updateExercise,
      removeExercise,
      dataLoading,
      dataError,
    }),
    [
      exercises,
      addExercise,
      updateExercise,
      removeExercise,
      dataLoading,
      dataError,
    ]
  );

  return (
    <ExercisesContext.Provider value={value}>{children}</ExercisesContext.Provider>
  );
}
