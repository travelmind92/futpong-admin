import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  normalizeRoutine,
  normalizeRoutineMapping,
  normalizeTrainingBlock,
  normalizeTrainingDay,
} from '../services/dynamo/normalize';
import {
  ROUTINE_MAPPINGS_TABLE,
  ROUTINES_TABLE,
  TRAINING_BLOCKS_TABLE,
  TRAINING_DAYS_TABLE,
} from '../services/dynamo/tables';
import { useDynamoActions } from '../services/dynamo/dynamoActions';
import {
  routineMappingToDynamoItem,
  routineToDynamoItem,
  trainingBlockToDynamoItem,
  trainingDayToDynamoItem,
} from '../services/dynamo/serialize';
import { Routine, RoutineMapping, TrainingBlock, TrainingDay } from '../types';
import { ServicesContext } from './servicesOutletContext';

export type RoutinesContextValue = {
  routines: Routine[];
  routineMappings: RoutineMapping[];
  trainingDays: TrainingDay[];
  trainingBlocks: TrainingBlock[];
  addRoutine: (
    routine: Routine,
    days: TrainingDay[],
    blocks: TrainingBlock[]
  ) => Promise<void>;
  updateRoutine: (
    routine: Routine,
    days: TrainingDay[],
    blocks: TrainingBlock[]
  ) => Promise<void>;
  removeRoutine: (routineId: string) => Promise<void>;
  upsertRoutineMapping: (mapping: RoutineMapping) => Promise<void>;
  removeRoutineMapping: (mappingId: string) => Promise<void>;
  dataLoading: boolean;
  dataError: string | null;
};

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function useRoutines(): RoutinesContextValue {
  const v = useContext(RoutinesContext);
  if (!v) {
    throw new Error('useRoutines must be used within RoutinesProvider');
  }
  return v;
}

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const services = useContext(ServicesContext);
  const dynamoClient = services?.dynamoClient;
  const dynamoApi = useDynamoActions();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineMappings, setRoutineMappings] = useState<RoutineMapping[]>([]);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const trainingDaysRef = useRef(trainingDays);
  const trainingBlocksRef = useRef(trainingBlocks);
  const routineMappingsRef = useRef(routineMappings);

  useEffect(() => {
    trainingDaysRef.current = trainingDays;
  }, [trainingDays]);

  useEffect(() => {
    trainingBlocksRef.current = trainingBlocks;
  }, [trainingBlocks]);

  useEffect(() => {
    routineMappingsRef.current = routineMappings;
  }, [routineMappings]);

  useEffect(() => {
    if (!dynamoClient) {
      return;
    }
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const { getAll } = dynamoApi(dynamoClient);
        const [rawRoutines, rawMappings, rawDays, rawBlocks] = await Promise.all([
          getAll(ROUTINES_TABLE),
          getAll(ROUTINE_MAPPINGS_TABLE),
          getAll(TRAINING_DAYS_TABLE),
          getAll(TRAINING_BLOCKS_TABLE),
        ]);
        if (cancelled) return;
        const rt = (rawRoutines ?? [])
          .map((item) => normalizeRoutine(item as Record<string, unknown>))
          .filter((x): x is Routine => x !== null);
        rt.sort((a, b) => a.name.localeCompare(b.name));
        setRoutines(rt);

        const rm = (rawMappings ?? [])
          .map((item) => normalizeRoutineMapping(item as Record<string, unknown>))
          .filter((x): x is RoutineMapping => x !== null);
        rm.sort((a, b) => {
          const byPlayer = a.playerType.localeCompare(b.playerType);
          if (byPlayer !== 0) return byPlayer;
          const byType = a.routineType.localeCompare(b.routineType);
          if (byType !== 0) return byType;
          const byPlace = a.place.localeCompare(b.place);
          if (byPlace !== 0) return byPlace;
          return a.routineId.localeCompare(b.routineId);
        });
        setRoutineMappings(rm);

        const td = (rawDays ?? [])
          .map((item) => normalizeTrainingDay(item as Record<string, unknown>))
          .filter((x): x is TrainingDay => x !== null);
        td.sort((a, b) => {
          const byRoutine = a.routineId.localeCompare(b.routineId);
          if (byRoutine !== 0) return byRoutine;
          return a.day - b.day;
        });
        setTrainingDays(td);

        const tb = (rawBlocks ?? [])
          .map((item) => normalizeTrainingBlock(item as Record<string, unknown>))
          .filter((x): x is TrainingBlock => x !== null);
        tb.sort((a, b) => {
          const byDay = a.trainingDayId.localeCompare(b.trainingDayId);
          if (byDay !== 0) return byDay;
          return a.index - b.index;
        });
        setTrainingBlocks(tb);
      } catch (e) {
        if (!cancelled) {
          setDataError(
            e instanceof Error ? e.message : 'Failed to load routines'
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
  }, [dynamoClient, dynamoApi]);

  const addRoutine = useCallback(
    async (routine: Routine, days: TrainingDay[], blocks: TrainingBlock[]) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { save } = dynamoApi(dynamoClient);
      try {
        await save(ROUTINES_TABLE, [routineToDynamoItem(routine)]);
        if (days.length > 0) {
          await save(TRAINING_DAYS_TABLE, days.map(trainingDayToDynamoItem));
        }
        if (blocks.length > 0) {
          await save(TRAINING_BLOCKS_TABLE, blocks.map(trainingBlockToDynamoItem));
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to save routine to the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setRoutines((prev) => [routine, ...prev]);
      setTrainingDays((prev) => [...days, ...prev]);
      setTrainingBlocks((prev) => [...blocks, ...prev]);
    },
    [dynamoApi, dynamoClient]
  );

  const updateRoutine = useCallback(
    async (routine: Routine, days: TrainingDay[], blocks: TrainingBlock[]) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { save, remove } = dynamoApi(dynamoClient);
      const oldDayIds = trainingDaysRef.current
        .filter((td) => td.routineId === routine.id)
        .map((td) => td.id);
      const newDayIdSet = new Set(days.map((d) => d.id));
      const removedDayIds = oldDayIds.filter((id) => !newDayIdSet.has(id));
      const oldBlockIds = trainingBlocksRef.current
        .filter((tb) => oldDayIds.includes(tb.trainingDayId))
        .map((tb) => tb.id);

      try {
        await remove(TRAINING_BLOCKS_TABLE, oldBlockIds);
        await remove(TRAINING_DAYS_TABLE, removedDayIds);
        await save(ROUTINES_TABLE, [routineToDynamoItem(routine)]);
        if (days.length > 0) {
          await save(TRAINING_DAYS_TABLE, days.map(trainingDayToDynamoItem));
        }
        if (blocks.length > 0) {
          await save(TRAINING_BLOCKS_TABLE, blocks.map(trainingBlockToDynamoItem));
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to update routine in the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }

      setDataError(null);
      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? routine : r))
      );
      setTrainingDays((prev) => {
        const oldIds = prev
          .filter((td) => td.routineId === routine.id)
          .map((td) => td.id);
        setTrainingBlocks((tbs) => [
          ...blocks,
          ...tbs.filter((tb) => !oldIds.includes(tb.trainingDayId)),
        ]);
        const rest = prev.filter((td) => td.routineId !== routine.id);
        return [...days, ...rest];
      });
    },
    [dynamoApi, dynamoClient]
  );

  const removeRoutine = useCallback(
    async (routineId: string) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { remove } = dynamoApi(dynamoClient);
      const dayIds = trainingDaysRef.current
        .filter((td) => td.routineId === routineId)
        .map((td) => td.id);
      const blockIds = trainingBlocksRef.current
        .filter((tb) => dayIds.includes(tb.trainingDayId))
        .map((tb) => tb.id);
      const mappingIds = routineMappingsRef.current
        .filter((m) => m.routineId === routineId)
        .map((m) => m.id);

      try {
        await remove(TRAINING_BLOCKS_TABLE, blockIds);
        await remove(TRAINING_DAYS_TABLE, dayIds);
        await remove(ROUTINE_MAPPINGS_TABLE, mappingIds);
        await remove(ROUTINES_TABLE, [routineId]);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to remove routine from the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }

      setDataError(null);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      setRoutineMappings((prev) =>
        prev.filter((mapping) => mapping.routineId !== routineId)
      );
      setTrainingDays((prev) => {
        const removedDayIds = prev
          .filter((td) => td.routineId === routineId)
          .map((td) => td.id);
        if (removedDayIds.length > 0) {
          setTrainingBlocks((tbs) =>
            tbs.filter((tb) => !removedDayIds.includes(tb.trainingDayId))
          );
        }
        return prev.filter((td) => td.routineId !== routineId);
      });
    },
    [dynamoApi, dynamoClient]
  );

  const upsertRoutineMapping = useCallback(
    async (mapping: RoutineMapping) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { save } = dynamoApi(dynamoClient);
      try {
        await save(ROUTINE_MAPPINGS_TABLE, [
          routineMappingToDynamoItem(mapping),
        ]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Failed to save mapping to the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setRoutineMappings((prev) => {
        const exists = prev.some((m) => m.id === mapping.id);
        if (!exists) {
          return [mapping, ...prev];
        }
        return prev.map((m) => (m.id === mapping.id ? mapping : m));
      });
    },
    [dynamoApi, dynamoClient]
  );

  const removeRoutineMapping = useCallback(
    async (mappingId: string) => {
      if (!dynamoClient) {
        const msg = 'Database client not ready. Try again in a moment.';
        setDataError(msg);
        throw new Error(msg);
      }
      const { remove } = dynamoApi(dynamoClient);
      try {
        await remove(ROUTINE_MAPPINGS_TABLE, [mappingId]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Failed to remove mapping from the database.';
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setRoutineMappings((prev) => prev.filter((m) => m.id !== mappingId));
    },
    [dynamoApi, dynamoClient]
  );

  const value = useMemo(
    (): RoutinesContextValue => ({
      routines,
      routineMappings,
      trainingDays,
      trainingBlocks,
      addRoutine,
      updateRoutine,
      removeRoutine,
      upsertRoutineMapping,
      removeRoutineMapping,
      dataLoading,
      dataError,
    }),
    [
      routines,
      routineMappings,
      trainingDays,
      trainingBlocks,
      addRoutine,
      updateRoutine,
      removeRoutine,
      upsertRoutineMapping,
      removeRoutineMapping,
      dataLoading,
      dataError,
    ]
  );

  return (
    <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>
  );
}
