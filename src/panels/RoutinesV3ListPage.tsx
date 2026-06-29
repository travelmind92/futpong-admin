import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImportRoutinesV3Modal } from '../components/ImportRoutinesV3Modal';
import { Routines2ValuesModal } from '../components/Routines2ValuesModal';
import { RoutinesV3List } from '../components/RoutinesV3List';
import { useAuth } from '../context/AuthContext';
import { RoutinesV3ContextValue } from './RoutinesV3Layout';
import { textContainsSearch } from '../utils/textSearch';

export function RoutinesV3ListPage() {
  const { t } = useTranslation();
  const { readOnly } = useAuth();
  const {
    routines,
    exercises,
    dataLoading,
    dataError,
    removeRoutine,
    importRoutine,
  } = useOutletContext<RoutinesV3ContextValue>();
  const [searchQuery, setSearchQuery] = useState('');
  const [valuesModalOpen, setValuesModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const filteredRoutines = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) {
      return routines;
    }
    const routineOrder = new Map(
      routines.map((routine, index) => [routine.id, index])
    );
    return routines
      .filter((routine) => textContainsSearch(routine.name, query))
      .sort((a, b) => {
        const aNameMatch = textContainsSearch(a.name, query);
        const bNameMatch = textContainsSearch(b.name, query);
        if (aNameMatch !== bNameMatch) {
          return aNameMatch ? -1 : 1;
        }
        return (
          (routineOrder.get(a.id) ?? 0) - (routineOrder.get(b.id) ?? 0)
        );
      });
  }, [routines, searchQuery]);

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
            <h2 className="exercises-list-title">{t('routines2.title')}</h2>
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
                placeholder={t('routines2.searchPlaceholder')}
                aria-label={t('routines2.searchLabel')}
              />
            </label>
          </div>
          <div className="exercises-list-toolbar-actions">
            <button
              type="button"
              className="exercises2-list-values-btn"
              onClick={() => setValuesModalOpen(true)}
            >
              {t('routines2.values')}
            </button>
            {!readOnly ? (
              <button
                type="button"
                className="exercises-list-import"
                onClick={() => setImportModalOpen(true)}
              >
                {t('routines2.import')}
              </button>
            ) : null}
          </div>
        </div>

        <RoutinesV3List
          routines={filteredRoutines}
          dataLoading={dataLoading}
          onRemoveRoutine={removeRoutine}
          searchQuery={searchQuery}
          totalRoutineCount={routines.length}
        />
      </div>

      <Routines2ValuesModal
        open={valuesModalOpen}
        onClose={() => setValuesModalOpen(false)}
      />

      <ImportRoutinesV3Modal
        open={importModalOpen}
        existingRoutines={routines}
        existingExercises={exercises}
        onImport={importRoutine}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
