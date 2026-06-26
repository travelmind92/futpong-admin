import React, { useCallback, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bulkSave } from '../services/api/api';
import { exercise2ToDynamoItem } from '../services/dynamo/serialize';
import { EXERCISE_2_RESOURCE } from '../services/dynamo/serialize';
import { Exercise_V3 } from '../types/types';
import { translate } from '../i18n/translate';
import { useAuth } from '../context/AuthContext';
import { ImportExercises2Modal } from '../components/ImportExercises2Modal';
import { Exercises2ValuesModal } from '../components/Exercises2ValuesModal';
import { ExercisesV3List } from '../components/Exercises2List';
import { Exercises2ContextValue } from './Exercises2Layout';
import { textContainsSearch } from '../utils/textSearch';

export function Exercises2ListPage() {
  const { t } = useTranslation();
  const { readOnly } = useAuth();
  const {
    exercises,
    setExercises,
    dataLoading,
    dataError,
    setDataError,
    removeExercise,
  } = useOutletContext<Exercises2ContextValue>();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [valuesModalOpen, setValuesModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) {
      return exercises;
    }
    const exerciseOrder = new Map(
      exercises.map((exercise, index) => [exercise.id, index])
    );
    return exercises
      .filter(
        (exercise) =>
          textContainsSearch(exercise.name, query) ||
          textContainsSearch(exercise.description, query)
      )
      .sort((a, b) => {
        const aNameMatch = textContainsSearch(a.name, query);
        const bNameMatch = textContainsSearch(b.name, query);
        if (aNameMatch !== bNameMatch) {
          return aNameMatch ? -1 : 1;
        }
        return (
          (exerciseOrder.get(a.id) ?? 0) - (exerciseOrder.get(b.id) ?? 0)
        );
      });
  }, [exercises, searchQuery]);

  const importExercises = useCallback(
    async (items: Exercise_V3[]) => {
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
    },
    [setDataError, setExercises]
  );

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
            <label className="exercises-list-search-wrap">
              <svg
                className="exercises-list-search-icon"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                />
              </svg>
              <input
                type="search"
                className="exercises-list-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('exercises.searchPlaceholder')}
                aria-label={t('exercises.searchLabel')}
              />
            </label>
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

        <ExercisesV3List
          exercises={filteredExercises}
          dataLoading={dataLoading}
          readOnly={readOnly}
          onRemoveExercise={removeExercise}
          searchQuery={searchQuery}
          totalExerciseCount={exercises.length}
        />
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
