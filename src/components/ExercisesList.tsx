import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Exercise } from '../types';
import { useAuth } from '../context/AuthContext';
import { ExercisesContextValue } from '../context/ExercisesContext';
import {
  listSortColumnAriaSort,
  SortColumnHeaderButton,
} from './SortColumnHeaderButton';
import { translateRepType } from '../i18n/enumLabels';
import { isExerciseInUseError } from '../i18n/errorCodes';

const PAGE_SIZE = 20;
const DESCRIPTION_PREVIEW_CHARS = 80;

type SortColumn =
  | 'name'
  | 'repType'
  | 'description'
  | 'video'
  | 'image';

type SortState =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: SortColumn };

function truncateDescription(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}...`;
}

function hasVideoUrl(url: string | undefined): boolean {
  return (url?.trim() ?? '').length > 0;
}

function hasImageUrl(url: string | undefined): boolean {
  return (url?.trim() ?? '').length > 0;
}

type ExercisesListProps = {
  exercises: Exercise[];
  dataLoading?: boolean;
};

export function ExercisesList({ exercises, dataLoading }: ExercisesListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { readOnly } = useAuth();
  const { removeExercise } = useOutletContext<ExercisesContextValue>();
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });

  const sortedExercises = useMemo(() => {
    if (sortState.mode === 'none') {
      return exercises;
    }
    const { column, mode } = sortState;
    const orderFactor = mode === 'asc' ? 1 : -1;
    const labelFor = (ex: Exercise): string => {
      switch (column) {
        case 'name':
          return ex.name;
        case 'repType':
          return ex.repType;
        case 'description':
          return ex.description;
        case 'video':
          return hasVideoUrl(ex.videoUrl) ? '1' : '0';
        case 'image':
          return hasImageUrl(ex.imageUrl) ? '1' : '0';
        default:
          return '';
      }
    };
    return [...exercises].sort((a, b) => {
      const aLabel = labelFor(a);
      const bLabel = labelFor(b);
      const byLabel = aLabel.localeCompare(bLabel);
      if (byLabel !== 0) {
        return byLabel * orderFactor;
      }
      return a.id.localeCompare(b.id);
    });
  }, [exercises, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedExercises.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedExercises.slice(start, start + PAGE_SIZE);
  }, [sortedExercises, page, totalPages]);

  const toggleSort = (column: SortColumn) => {
    setSortState((prev) => {
      if (prev.mode === 'none' || prev.column !== column) {
        return { mode: 'asc', column };
      }
      if (prev.mode === 'asc') {
        return { mode: 'desc', column };
      }
      return { mode: 'none' };
    });
    setPage(1);
  };

  const safePage = Math.min(page, totalPages);
  const rangeStart =
    sortedExercises.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedExercises.length);

  const showPaginationNav =
    !dataLoading && sortedExercises.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;
  const columnCount = readOnly ? 5 : 6;

  return (
    <div className="exercises-list">
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">{t('exercises.title')}</h2>
        {!readOnly ? (
          <button
            type="button"
            className="exercises-list-create"
            onClick={() => navigate('new')}
          >
            {t('common.create')}
          </button>
        ) : null}
      </div>

      <div className="exercises-list-table-wrap">
        <table className="exercises-list-table list-data-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={listSortColumnAriaSort('name', sortState)}>
                <SortColumnHeaderButton
                  label={t('common.name')}
                  column="name"
                  sortState={sortState}
                  onClick={() => toggleSort('name')}
                />
              </th>
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('repType', sortState)}
              >
                <SortColumnHeaderButton
                  label={t('exercises.repType')}
                  column="repType"
                  sortState={sortState}
                  onClick={() => toggleSort('repType')}
                />
              </th>
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('description', sortState)}
              >
                <SortColumnHeaderButton
                  label={t('common.description')}
                  column="description"
                  sortState={sortState}
                  onClick={() => toggleSort('description')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('video', sortState)}>
                <SortColumnHeaderButton
                  label={t('exercises.video')}
                  column="video"
                  sortState={sortState}
                  onClick={() => toggleSort('video')}
                />
              </th>
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('image', sortState)}
              >
                <SortColumnHeaderButton
                  label={t('exercises.image')}
                  column="image"
                  sortState={sortState}
                  onClick={() => toggleSort('image')}
                />
              </th>
              {!readOnly ? (
                <th
                  scope="col"
                  className="exercises-list-actions-header"
                  aria-label={t('common.actions')}
                />
              ) : null}
            </tr>
          </thead>
          <tbody>
            {dataLoading ? (
              <tr>
                <td colSpan={columnCount}>{t('exercises.loadingList')}</td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                <td>{translateRepType(t, exercise.repType)}</td>
                <td className="exercises-list-desc">
                  {truncateDescription(
                    exercise.description,
                    DESCRIPTION_PREVIEW_CHARS
                  )}
                </td>
                <td className="exercises-list-video-cell">
                  {hasVideoUrl(exercise.videoUrl) ? (
                    <span
                      className="exercises-list-video-yes"
                      title={t('exercises.videoAvailable')}
                      aria-label={t('exercises.videoAvailable')}
                    >
                      <svg
                        className="exercises-list-video-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path fill="currentColor" d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  ) : (
                    <span className="exercises-list-video-no">-</span>
                  )}
                </td>
                <td className="exercises-list-video-cell">
                  {hasImageUrl(exercise.imageUrl) ? (
                    <span
                      className="exercises-list-thumb-yes"
                      title={t('exercises.imageAvailable')}
                      aria-label={t('exercises.imageAvailable')}
                    >
                      <svg
                        className="exercises-list-thumb-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          fill="currentColor"
                          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="exercises-list-thumb-no">-</span>
                  )}
                </td>
                {!readOnly ? (
                <td className="exercises-list-actions-cell">
                  <div className="exercises-list-actions">
                    <button
                      type="button"
                      className="exercises-list-icon-btn exercises-list-icon-btn--edit"
                      aria-label={t('exercises.editAria', { name: exercise.name })}
                      title={t('common.edit')}
                      onClick={() => navigate(`${exercise.id}/edit`)}
                    >
                      <svg
                        className="exercises-list-row-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          fill="currentColor"
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="exercises-list-icon-btn exercises-list-icon-btn--remove"
                      aria-label={t('exercises.removeAria', { name: exercise.name })}
                      title={t('common.remove')}
                      onClick={() => {
                        void (async () => {
                          if (
                            !window.confirm(
                              t('exercises.removeConfirm', { name: exercise.name })
                            )
                          ) {
                            return;
                          }
                          try {
                            await removeExercise(exercise.id);
                          } catch (e) {
                            if (isExerciseInUseError(e)) {
                              window.alert(
                                e instanceof Error ? e.message : t('errors.exerciseInUse')
                              );
                            }
                            // Other failures: `dataError` is set on the context provider
                          }
                        })();
                      }}
                    >
                      <svg
                        className="exercises-list-row-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          fill="currentColor"
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? t('common.loading')
            : sortedExercises.length === 0
              ? t('exercises.noExercises')
              : t('common.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: sortedExercises.length,
                })}
        </span>
        <div className="exercises-list-page-actions">
          {showPrevPage ? (
            <button
              type="button"
              className="exercises-list-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t('common.previousPage')}
            >
              {t('common.previous')}
            </button>
          ) : null}
          <span className="exercises-list-page-indicator">
            {t('common.pageOf', { current: safePage, total: totalPages })}
          </span>
          {showNextPage ? (
            <button
              type="button"
              className="exercises-list-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={t('common.nextPage')}
            >
              {t('common.next')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
