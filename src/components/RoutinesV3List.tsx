import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Routine_V3 } from '../types/types';
import { useAuth } from '../context/AuthContext';
import { useUsersByIds } from '../hooks/useUsersByIds';
import {
  AgeLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
} from '../types/labels';
import {
  listSortColumnAriaSort,
  SortColumnHeaderButton,
} from './SortColumnHeaderButton';

const PAGE_SIZE = 20;

type SortColumn = 'name' | 'age' | 'level' | 'place' | 'period' | 'custom' | 'user';

type SortState =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: SortColumn };

type RoutinesV3ListProps = {
  routines: Routine_V3[];
  dataLoading?: boolean;
  readOnly?: boolean;
  onRemoveRoutine?: (id: string) => Promise<void>;
  searchQuery?: string;
  totalRoutineCount?: number;
};

export function RoutinesV3List({
  routines,
  dataLoading,
  readOnly,
  onRemoveRoutine,
  searchQuery = '',
  totalRoutineCount = 0,
}: RoutinesV3ListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { readOnly: authReadOnly } = useAuth();
  const isReadOnly = readOnly ?? authReadOnly;
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });

  const showUserColumn = useMemo(
    () => routines.some((routine) => routine.userId),
    [routines]
  );

  const routineUserIds = useMemo(
    () =>
      routines
        .map((routine) => routine.userId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [routines]
  );
  const { usersById } = useUsersByIds(routineUserIds);

  useEffect(() => {
    if (
      !showUserColumn &&
      sortState.mode !== 'none' &&
      sortState.column === 'user'
    ) {
      setSortState({ mode: 'none' });
    }
  }, [showUserColumn, sortState]);

  const sortedRoutines = useMemo(() => {
    if (sortState.mode === 'none') {
      return routines;
    }
    const { column, mode } = sortState;
    const orderFactor = mode === 'asc' ? 1 : -1;
    const labelFor = (routine: Routine_V3): string => {
      switch (column) {
        case 'name':
          return routine.name;
        case 'age':
          return AgeLabel[routine.age];
        case 'level':
          return LevelLabel[routine.level];
        case 'place':
          return PlaceLabel[routine.place];
        case 'period':
          return PeriodLabel[routine.period];
        case 'custom':
          return routine.custom === true ? '1' : '0';
        case 'user':
          return routine.userId
            ? usersById.get(routine.userId)?.email ?? routine.userId
            : '—';
        default:
          return '';
      }
    };
    return [...routines].sort((a, b) => {
      const aLabel = labelFor(a);
      const bLabel = labelFor(b);
      const byLabel = aLabel.localeCompare(bLabel);
      if (byLabel !== 0) {
        return byLabel * orderFactor;
      }
      return a.id.localeCompare(b.id);
    });
  }, [routines, sortState, usersById]);

  const totalPages = Math.max(1, Math.ceil(sortedRoutines.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedRoutines.slice(start, start + PAGE_SIZE);
  }, [sortedRoutines, page, totalPages]);

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
    sortedRoutines.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedRoutines.length);

  const showPaginationNav = !dataLoading && sortedRoutines.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;
  const columnCount = showUserColumn ? 8 : 7;

  return (
    <>
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
              <th scope="col" aria-sort={listSortColumnAriaSort('age', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines2.age')}
                  column="age"
                  sortState={sortState}
                  onClick={() => toggleSort('age')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('level', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines2.level')}
                  column="level"
                  sortState={sortState}
                  onClick={() => toggleSort('level')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('place', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines2.place')}
                  column="place"
                  sortState={sortState}
                  onClick={() => toggleSort('place')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('period', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines2.period')}
                  column="period"
                  sortState={sortState}
                  onClick={() => toggleSort('period')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('custom', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines2.customPersonalized')}
                  column="custom"
                  sortState={sortState}
                  onClick={() => toggleSort('custom')}
                />
              </th>
              {showUserColumn ? (
                <th scope="col" aria-sort={listSortColumnAriaSort('user', sortState)}>
                  <SortColumnHeaderButton
                    label={t('routines2.user')}
                    column="user"
                    sortState={sortState}
                    onClick={() => toggleSort('user')}
                  />
                </th>
              ) : null}
              <th
                scope="col"
                className="exercises-list-actions-header"
                aria-label={t('common.actions')}
              />
            </tr>
          </thead>
          <tbody>
            {dataLoading ? (
              <tr>
                <td colSpan={columnCount}>{t('routines2.loadingList')}</td>
              </tr>
            ) : null}
            {!dataLoading && sortedRoutines.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>
                  {searchQuery.trim() && totalRoutineCount > 0
                    ? t('routines2.noSearchResults')
                    : t('routines2.noRoutines')}
                </td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((routine) => (
                <tr key={routine.id}>
                  <td>{routine.name}</td>
                  <td>{AgeLabel[routine.age]}</td>
                  <td>{LevelLabel[routine.level]}</td>
                  <td>{PlaceLabel[routine.place]}</td>
                  <td>{PeriodLabel[routine.period]}</td>
                  <td>
                    {routine.custom === true
                      ? t('routines2.customYes')
                      : t('routines2.customNo')}
                  </td>
                  {showUserColumn ? (
                    <td>
                      {routine.userId
                        ? usersById.get(routine.userId)?.email ?? '—'
                        : '—'}
                    </td>
                  ) : null}
                  <td className="exercises-list-actions-cell">
                    <div className="exercises-list-actions">
                      <button
                        type="button"
                        className="exercises-list-icon-btn exercises-list-icon-btn--view"
                        aria-label={t('routines2.viewAria', {
                          name: routine.name,
                        })}
                        title={t('routines2.view')}
                        onClick={() => navigate(`${routine.id}`)}
                      >
                        <svg
                          className="exercises-list-row-icon"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="currentColor"
                            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          />
                        </svg>
                      </button>
                      {!isReadOnly && onRemoveRoutine ? (
                        <button
                          type="button"
                          className="exercises-list-icon-btn exercises-list-icon-btn--remove"
                          aria-label={t('routines2.removeAria', {
                            name: routine.name,
                          })}
                          title={t('common.remove')}
                          onClick={() => {
                            void (async () => {
                              if (
                                !window.confirm(
                                  t('routines2.removeConfirm', {
                                    name: routine.name,
                                  })
                                )
                              ) {
                                return;
                              }
                              try {
                                await onRemoveRoutine(routine.id);
                              } catch {
                                // Error banner is set on the layout provider
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
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? t('common.loading')
            : sortedRoutines.length === 0
              ? t('routines2.noRoutines')
              : t('common.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: sortedRoutines.length,
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
    </>
  );
}
