import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { bulkRemove, getAll, remove, save } from '../services/api/api';
import { persistRoutineV3Import } from '../services/api/routineV3Import';
import {
  normalizeExercise2,
  normalizeRoutineMappingV3,
  normalizeRoutineV3,
  normalizeTrainingBlockV3,
  normalizeTrainingDayV3,
} from '../services/dynamo/normalize';
import {
  EXERCISE_2_RESOURCE,
  EXERCISE_2_VERSION,
  ROUTINE_MAPPING_V3_FETCH_RESOURCE,
  ROUTINE_MAPPING_V3_WRITE_RESOURCE,
  ROUTINE_V3_RESOURCE,
  TRAINING_BLOCK_V3_RESOURCE,
  TRAINING_DAY_V3_RESOURCE,
  routineMappingV3ToDynamoItem,
} from '../services/dynamo/serialize';
import {
  Exercise_V3,
  RoutineMapping_V3,
  Routine_V3,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../types/types';
import { RoutineV3ImportPayload } from '../utils/parseRoutinesV3Csv';
import { isRoutineIdUsedInMappings } from '../utils/routineMappingRefs';
import { normalizeForSearch } from '../utils/textSearch';
import { ROUTINE_IN_USE_ERROR_CODE } from '../i18n/errorCodes';
import { translate } from '../i18n/translate';

export type RoutinesV3ContextValue = {
  routines: Routine_V3[];
  routineMappings: RoutineMapping_V3[];
  exercises: Exercise_V3[];
  trainingDays: TrainingDay_V3[];
  trainingBlocks: TrainingBlock_V3[];
  dataLoading: boolean;
  dataError: string | null;
  setDataError: React.Dispatch<React.SetStateAction<string | null>>;
  removeRoutine: (id: string) => Promise<void>;
  importRoutine: (payload: RoutineV3ImportPayload) => Promise<void>;
  updateRoutineMapping: (mapping: RoutineMapping_V3) => Promise<void>;
  createRoutineMapping: (mapping: RoutineMapping_V3) => Promise<void>;
  removeRoutineMapping: (mappingId: string) => Promise<void>;
};

function isV3Item(item: Record<string, unknown>): boolean {
  return item.version === EXERCISE_2_VERSION;
}

export function RoutinesV3Layout() {
  const [routines, setRoutines] = useState<Routine_V3[]>([]);
  const [exercises, setExercises] = useState<Exercise_V3[]>([]);
  const [routineMappings, setRoutineMappings] = useState<RoutineMapping_V3[]>([]);
  const [trainingDays, setTrainingDays] = useState<TrainingDay_V3[]>([]);
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock_V3[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const routinesRef = useRef(routines);
  const routineMappingsRef = useRef(routineMappings);
  const trainingDaysRef = useRef(trainingDays);
  const trainingBlocksRef = useRef(trainingBlocks);

  useEffect(() => {
    routinesRef.current = routines;
  }, [routines]);

  useEffect(() => {
    routineMappingsRef.current = routineMappings;
  }, [routineMappings]);

  useEffect(() => {
    trainingDaysRef.current = trainingDays;
  }, [trainingDays]);

  useEffect(() => {
    trainingBlocksRef.current = trainingBlocks;
  }, [trainingBlocks]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [rawRoutines, rawExercises, rawMappings, rawDays, rawBlocks] =
          await Promise.all([
            getAll<Record<string, unknown>>(ROUTINE_V3_RESOURCE, true),
            getAll<Record<string, unknown>>(EXERCISE_2_RESOURCE, true),
            getAll<Record<string, unknown>>(ROUTINE_MAPPING_V3_FETCH_RESOURCE, true),
            getAll<Record<string, unknown>>(TRAINING_DAY_V3_RESOURCE, true),
            getAll<Record<string, unknown>>(TRAINING_BLOCK_V3_RESOURCE, true),
          ]);
        if (cancelled) return;

        const rt = rawRoutines
          .filter(isV3Item)
          .map((item) => normalizeRoutineV3(item))
          .filter((x): x is Routine_V3 => x !== null);
        rt.sort((a, b) => a.name.localeCompare(b.name));
        setRoutines(rt);

        const ex = rawExercises
          .filter(isV3Item)
          .map((item) => normalizeExercise2(item))
          .filter((x): x is Exercise_V3 => x !== null);
        setExercises(ex);

        const rm = rawMappings
          .filter(isV3Item)
          .map((item) => normalizeRoutineMappingV3(item))
          .filter((x): x is RoutineMapping_V3 => x !== null);
        rm.sort((a, b) => {
          const byAge = a.age.localeCompare(b.age);
          if (byAge !== 0) return byAge;
          const byLevel = a.level.localeCompare(b.level);
          if (byLevel !== 0) return byLevel;
          const byPlace = a.place.localeCompare(b.place);
          if (byPlace !== 0) return byPlace;
          const byPeriod = a.period.localeCompare(b.period);
          if (byPeriod !== 0) return byPeriod;
          return a.routineId.localeCompare(b.routineId);
        });
        setRoutineMappings(rm);

        const td = rawDays
          .filter(isV3Item)
          .map((item) => normalizeTrainingDayV3(item))
          .filter((x): x is TrainingDay_V3 => x !== null);
        td.sort((a, b) => {
          const byRoutine = a.routineId.localeCompare(b.routineId);
          if (byRoutine !== 0) return byRoutine;
          return a.session - b.session;
        });
        setTrainingDays(td);

        const tb = rawBlocks
          .filter(isV3Item)
          .map((item) => normalizeTrainingBlockV3(item))
          .filter((x): x is TrainingBlock_V3 => x !== null);
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

  const removeRoutineChildren = useCallback(async (routineId: string) => {
    const dayIds = trainingDaysRef.current
      .filter((day) => day.routineId === routineId)
      .map((day) => day.id);
    const blockIds = trainingBlocksRef.current
      .filter((block) => dayIds.includes(block.trainingDayId))
      .map((block) => block.id);
    const mappingIds = routineMappingsRef.current
      .filter((mapping) => mapping.routineId === routineId)
      .map((mapping) => mapping.id);

    if (blockIds.length > 0) {
      await bulkRemove(TRAINING_BLOCK_V3_RESOURCE, blockIds);
    }
    if (dayIds.length > 0) {
      await bulkRemove(TRAINING_DAY_V3_RESOURCE, dayIds);
    }
    await Promise.all(
      mappingIds.map((id) => remove(ROUTINE_MAPPING_V3_WRITE_RESOURCE, id))
    );

    setRoutineMappings((prev) =>
      prev.filter((mapping) => mapping.routineId !== routineId)
    );
    setTrainingDays((prev) => prev.filter((day) => day.routineId !== routineId));
    setTrainingBlocks((prev) =>
      prev.filter((block) => !dayIds.includes(block.trainingDayId))
    );
  }, []);

  const removeRoutine = useCallback(
    async (id: string) => {
      if (isRoutineIdUsedInMappings(id, routineMappingsRef.current)) {
        const msg = translate('errors.routineInUse');
        const err = new Error(msg) as Error & { code: string };
        err.code = ROUTINE_IN_USE_ERROR_CODE;
        setDataError(msg);
        throw err;
      }
      try {
        await removeRoutineChildren(id);
        await remove(ROUTINE_V3_RESOURCE, id);
        setDataError(null);
        setRoutines((prev) => prev.filter((routine) => routine.id !== id));
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.removeRoutine');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    [removeRoutineChildren]
  );

  const importRoutine = useCallback(
    async (payload: RoutineV3ImportPayload) => {
      const { mapping, blocks } = payload;
      let { routine, days } = payload;

      const importedNameKey = normalizeForSearch(routine.name);
      const existingRoutine = routinesRef.current.find(
        (item) => normalizeForSearch(item.name) === importedNameKey
      );
      const isUpdate = existingRoutine !== undefined;

      if (existingRoutine) {
        routine = {
          ...routine,
          id: existingRoutine.id,
        };
        days = days.map((day) => ({ ...day, routineId: existingRoutine.id }));
      }

      const previousRoutine = existingRoutine;
      const oldDayIds = trainingDaysRef.current
        .filter((day) => day.routineId === routine.id)
        .map((day) => day.id);
      const oldBlockIds = trainingBlocksRef.current
        .filter((block) => oldDayIds.includes(block.trainingDayId))
        .map((block) => block.id);
      const oldMappingIds = routineMappingsRef.current
        .filter((item) => item.routineId === routine.id)
        .map((item) => item.id);

      const existingMapping = routineMappingsRef.current.find(
        (item) =>
          item.routineId === routine.id &&
          item.age === mapping.age &&
          item.level === mapping.level &&
          item.place === mapping.place &&
          item.period === mapping.period
      );
      const mappingToSave: RoutineMapping_V3 = {
        ...mapping,
        id: existingMapping?.id ?? mapping.id,
        routineId: routine.id,
      };

      try {
        await persistRoutineV3Import({
          routine,
          mapping: mappingToSave,
          days,
          blocks,
          isUpdate,
          previousRoutine,
          previousMapping: existingMapping,
          oldDayIds,
          oldBlockIds,
          oldMappingIds,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.saveRoutine');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }

      setDataError(null);
      setRoutines((prev) => {
        const rest = prev.filter((item) => item.id !== routine.id);
        const next = [...rest, routine];
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setRoutineMappings((prev) => {
        const rest = prev.filter((item) => item.routineId !== routine.id);
        return [...rest, mappingToSave];
      });
      setTrainingDays((prev) => {
        const rest = prev.filter((day) => day.routineId !== routine.id);
        return [...days, ...rest];
      });
      setTrainingBlocks((prev) => {
        const rest = prev.filter((block) => !oldDayIds.includes(block.trainingDayId));
        return [...blocks, ...rest];
      });
    },
    []
  );

  const updateRoutineMapping = useCallback(async (mapping: RoutineMapping_V3) => {
    try {
      await save(
        ROUTINE_MAPPING_V3_WRITE_RESOURCE,
        mapping.id,
        routineMappingV3ToDynamoItem(mapping)
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate('errors.saveMapping');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
    setDataError(null);
    setRoutineMappings((prev) =>
      prev.map((item) => (item.id === mapping.id ? mapping : item))
    );
  }, []);

  const sortRoutineMappings = useCallback((items: RoutineMapping_V3[]) => {
    return [...items].sort((a, b) => {
      const byAge = a.age.localeCompare(b.age);
      if (byAge !== 0) return byAge;
      const byLevel = a.level.localeCompare(b.level);
      if (byLevel !== 0) return byLevel;
      const byPlace = a.place.localeCompare(b.place);
      if (byPlace !== 0) return byPlace;
      const byPeriod = a.period.localeCompare(b.period);
      if (byPeriod !== 0) return byPeriod;
      return a.routineId.localeCompare(b.routineId);
    });
  }, []);

  const createRoutineMapping = useCallback(
    async (mapping: RoutineMapping_V3) => {
      const duplicate = routineMappingsRef.current.find(
        (item) =>
          item.age === mapping.age &&
          item.level === mapping.level &&
          item.place === mapping.place &&
          item.period === mapping.period
      );
      if (duplicate) {
        const msg = translate('mappings2.duplicateMapping');
        setDataError(msg);
        throw new Error(msg);
      }
      try {
        await save(
          ROUTINE_MAPPING_V3_WRITE_RESOURCE,
          mapping.id,
          routineMappingV3ToDynamoItem(mapping)
        );
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : translate('errors.saveMapping');
        setDataError(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      setDataError(null);
      setRoutineMappings((prev) => sortRoutineMappings([...prev, mapping]));
    },
    [sortRoutineMappings]
  );

  const removeRoutineMapping = useCallback(async (mappingId: string) => {
    try {
      await remove(ROUTINE_MAPPING_V3_WRITE_RESOURCE, mappingId);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate('errors.removeMapping');
      setDataError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
    setDataError(null);
    setRoutineMappings((prev) => prev.filter((item) => item.id !== mappingId));
  }, []);

  const outletContext = useMemo(
    (): RoutinesV3ContextValue => ({
      routines,
      routineMappings,
      exercises,
      trainingDays,
      trainingBlocks,
      dataLoading,
      dataError,
      setDataError,
      removeRoutine,
      importRoutine,
      updateRoutineMapping,
      createRoutineMapping,
      removeRoutineMapping,
    }),
    [
      routines,
      routineMappings,
      exercises,
      trainingDays,
      trainingBlocks,
      dataLoading,
      dataError,
      removeRoutine,
      importRoutine,
      updateRoutineMapping,
      createRoutineMapping,
      removeRoutineMapping,
    ]
  );

  return <Outlet context={outletContext} />;
}
