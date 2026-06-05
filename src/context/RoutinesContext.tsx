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
import { bulkRemove, bulkSave, getAll, remove, save } from '../services/api/api';
import {
  normalizeRoutine,
  normalizeRoutineMapping,
  normalizeTrainingBlock,
  normalizeTrainingDay,
} from '../services/dynamo/normalize';
import {
  routineMappingToDynamoItem,
  routineToDynamoItem,
  trainingBlockToDynamoItem,
  trainingDayToDynamoItem,
} from '../services/dynamo/serialize';
import { Routine, RoutineMapping, TrainingBlock, TrainingDay } from '../types';
import { translate } from '../i18n/translate';

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
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [rawRoutines, rawMappings, rawDays, rawBlocks] = await Promise.all([
          getAll<Record<string, unknown>>('routines', true),
          getAll<Record<string, unknown>>('routine-mappings', true),
          getAll<Record<string, unknown>>('training-days', true),
          getAll<Record<string, unknown>>('training-blocks', true),
        ]);
        if (cancelled) return;
        const rt = rawRoutines
          .map((item) => normalizeRoutine(item))
          .filter((x): x is Routine => x !== null);
        rt.sort((a, b) => a.name.localeCompare(b.name));
        setRoutines(rt);

        const rm = rawMappings
          .map((item) => normalizeRoutineMapping(item))
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

        const td = rawDays
          .map((item) => normalizeTrainingDay(item))
          .filter((x): x is TrainingDay => x !== null);
        td.sort((a, b) => {
          const byRoutine = a.routineId.localeCompare(b.routineId);
          if (byRoutine !== 0) return byRoutine;
          return a.day - b.day;
        });
        setTrainingDays(td);

        const tb = rawBlocks
          .map((item) => normalizeTrainingBlock(item))
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
            e instanceof Error ? e.message : translate('errors.loadRoutines')
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

  const addRoutine = useCallback(
    async (routine: Routine, days: TrainingDay[], blocks: TrainingBlock[]) => {
      try {
        await save('routines', routine.id, routineToDynamoItem(routine));
        await bulkSave(
          'training-days',
          days.map((day) => trainingDayToDynamoItem(day))
        );
        await bulkSave(
          'training-blocks',
          blocks.map((block) => trainingBlockToDynamoItem(block))
        );
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.saveRoutine');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setRoutines((prev) => [routine, ...prev]);
      setTrainingDays((prev) => [...days, ...prev]);
      setTrainingBlocks((prev) => [...blocks, ...prev]);
    },
    []
  );

  const updateRoutine = useCallback(
    async (routine: Routine, days: TrainingDay[], blocks: TrainingBlock[]) => {
      const oldDayIds = trainingDaysRef.current
        .filter((td) => td.routineId === routine.id)
        .map((td) => td.id);
      const newDayIdSet = new Set(days.map((d) => d.id));
      const removedDayIds = oldDayIds.filter((id) => !newDayIdSet.has(id));
      const oldBlockIds = trainingBlocksRef.current
        .filter((tb) => oldDayIds.includes(tb.trainingDayId))
        .map((tb) => tb.id);

      try {
        await bulkRemove('training-blocks', oldBlockIds);
        await bulkRemove('training-days', removedDayIds);
        await save('routines', routine.id, routineToDynamoItem(routine));
        await bulkSave(
          'training-days',
          days.map((day) => trainingDayToDynamoItem(day))
        );
        await bulkSave(
          'training-blocks',
          blocks.map((block) => trainingBlockToDynamoItem(block))
        );
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.updateRoutine');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }

      setDataError(null);
      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? routine : r))
      );
      setTrainingDays((prev) => {
        const rest = prev.filter((td) => td.routineId !== routine.id);
        return [...days, ...rest];
      });
      setTrainingBlocks((prev) => [
        ...blocks,
        ...prev.filter((tb) => !oldDayIds.includes(tb.trainingDayId)),
      ]);
    },
    []
  );

  const removeRoutine = useCallback(
    async (routineId: string) => {
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
        await bulkRemove('training-blocks', blockIds);
        await bulkRemove('training-days', dayIds);
        await Promise.all(
          mappingIds.map((id) => remove('routine-mappings', id))
        );
        await remove('routines', routineId);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.removeRoutine');
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
    []
  );

  const upsertRoutineMapping = useCallback(async (mapping: RoutineMapping) => {
    try {
      await save(
        'routine-mappings',
        mapping.id,
        routineMappingToDynamoItem(mapping)
      );
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : translate('errors.saveMapping');
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
  }, []);

  const removeRoutineMapping = useCallback(async (mappingId: string) => {
    try {
      await remove('routine-mappings', mappingId);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : translate('errors.removeMapping');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
    setDataError(null);
    setRoutineMappings((prev) => prev.filter((m) => m.id !== mappingId));
  }, []);

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
