import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bulkSave, getAll } from '../services/api/api';
import { normalizeExercise2 } from '../services/dynamo/normalize';
import {
  EXERCISE_2_RESOURCE,
  EXERCISE_2_VERSION,
  exercise2ToDynamoItem,
} from '../services/dynamo/serialize';
import { Exercise_V3 } from '../types/types';
import { translate } from '../i18n/translate';
import { useAuth } from '../context/AuthContext';
import { ImportExercises2Modal } from '../components/ImportExercises2Modal';
import { Exercises2ValuesModal } from '../components/Exercises2ValuesModal';
import { ExercisesV3List } from '../components/Exercises2List';

export function Exercises2Panel() {
  const { t } = useTranslation();
  const { readOnly } = useAuth();
  const [exercises, setExercises] = useState<Exercise_V3[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [valuesModalOpen, setValuesModalOpen] = useState(false);

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

  const importExercises = useCallback(async (items: Exercise_V3[]) => {
    if (items.length === 0) {
      return;
    }
    try {
      await bulkSave(
        EXERCISE_2_RESOURCE,
        items.map((exercise) => exercise2ToDynamoItem(exercise))
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate('errors.importExercises');
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

  return (
    <div className="app-panel app-panel--full">
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}

      <div className="exercises-list exercises2-list">
        <div className="exercises-list-toolbar">
          <div className="exercises-list-toolbar-start">
            <h2 className="exercises-list-title">{t('exercises2.title')}</h2>
          </div>
          <div className="exercises-list-toolbar-actions">
            <button
              type="button"
              className="exercises2-list-values-btn"
              onClick={() => setValuesModalOpen(true)}
            >
              {t('exercises2.values')}
            </button>
            {!readOnly ? (
              <button
                type="button"
                className="exercises-list-import"
                onClick={() => setImportModalOpen(true)}
              >
                {t('exercises2.import')}
              </button>
            ) : null}
          </div>
        </div>

        <ExercisesV3List exercises={exercises} dataLoading={dataLoading} />
      </div>

      <ImportExercises2Modal
        open={importModalOpen}
        existingExercises={exercises}
        onImport={importExercises}
        onClose={() => setImportModalOpen(false)}
      />

      <Exercises2ValuesModal
        open={valuesModalOpen}
        onClose={() => setValuesModalOpen(false)}
      />
    </div>
  );
}
