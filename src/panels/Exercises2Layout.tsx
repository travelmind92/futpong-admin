import React, { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { getAll } from '../services/api/api';
import { normalizeExercise2 } from '../services/dynamo/normalize';
import { EXERCISE_2_RESOURCE, EXERCISE_2_VERSION } from '../services/dynamo/serialize';
import { Exercise_V3 } from '../types/types';
import { translate } from '../i18n/translate';

export type Exercises2ContextValue = {
  exercises: Exercise_V3[];
  setExercises: React.Dispatch<React.SetStateAction<Exercise_V3[]>>;
  dataLoading: boolean;
  dataError: string | null;
  setDataError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function Exercises2Layout() {
  const [exercises, setExercises] = useState<Exercise_V3[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const raw = await getAll<Record<string, unknown>>(
          EXERCISE_2_RESOURCE,
          true
        );
        if (cancelled) return;
        const ex = raw
          .filter((item) => item.version === EXERCISE_2_VERSION)
          .map((item) => normalizeExercise2(item))
          .filter((x): x is Exercise_V3 => x !== null);
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

  const outletContext = useMemo(
    (): Exercises2ContextValue => ({
      exercises,
      setExercises,
      dataLoading,
      dataError,
      setDataError,
    }),
    [exercises, dataLoading, dataError]
  );

  return <Outlet context={outletContext} />;
}
