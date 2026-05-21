import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import { PlayerType, Place, Routine, RoutineMapping, RoutineType } from '../types';
import {
  listSortColumnAriaSort,
  SortColumnHeaderButton,
} from './SortColumnHeaderButton';
import {
  translatePlace,
  translatePlayerType,
  translateRoutineType,
} from '../i18n/enumLabels';

const PAGE_SIZE = 15;

const playerTypeOptions = Object.values(PlayerType);
const placeOptions = Object.values(Place);
const routineTypeOptions = Object.values(RoutineType);

type DraftRoutineMappingRow = {
  id: string;
  serverId?: string;
  status: 'draft' | 'saved';
  playerType: PlayerType;
  routineType: RoutineType;
  place: Place;
  routineId: string;
};

type MappingsListProps = {
  routineMappings: RoutineMapping[];
  routines: Routine[];
  dataLoading?: boolean;
  onSaveRow: (mapping: RoutineMapping) => void | Promise<void>;
  onRemoveRow: (mappingId: string) => void | Promise<void>;
};

type SortColumn = 'playerType' | 'routineType' | 'place' | 'routine';

/** `none` keeps row order as in state (matches load order from the DB scan). */
type SortState =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: SortColumn };

function toDraftRows(mappings: RoutineMapping[]): DraftRoutineMappingRow[] {
  return mappings.map((mapping) => ({
    id: mapping.id,
    serverId: mapping.id,
    status: 'saved',
    playerType: mapping.playerType,
    routineType: mapping.routineType,
    place: mapping.place,
    routineId: mapping.routineId,
  }));
}

export function MappingsList({
  routineMappings,
  routines,
  dataLoading,
  onSaveRow,
  onRemoveRow,
}: MappingsListProps) {
  const { t } = useTranslation();
  const { readOnly } = useAuth();
  const [rows, setRows] = useState<DraftRoutineMappingRow[]>(() =>
    toDraftRows(routineMappings)
  );
  const [routineErrorsByRowId, setRoutineErrorsByRowId] = useState<
    Record<string, string>
  >({});
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });
  const [page, setPage] = useState(1);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);

  React.useEffect(() => {
    setRows((prev) => {
      const hasDraftRows = prev.some((row) => row.status === 'draft');
      if (hasDraftRows) {
        return prev;
      }
      return toDraftRows(routineMappings);
    });
  }, [routineMappings]);

  const routinesById = useMemo(() => {
    const map = new Map<string, Routine>();
    for (const routine of routines) {
      map.set(routine.id, routine);
    }
    return map;
  }, [routines]);

  const hasDraftRow = rows.some((row) => row.status === 'draft');

  const displayRows = useMemo(() => {
    if (sortState.mode === 'none') {
      return rows;
    }
    const { column, mode } = sortState;
    const orderFactor = mode === 'asc' ? 1 : -1;
    const labelFor = (row: DraftRoutineMappingRow): string => {
      switch (column) {
        case 'playerType':
          return row.playerType;
        case 'routineType':
          return row.routineType;
        case 'place':
          return row.place;
        case 'routine': {
          return routinesById.get(row.routineId)?.name ?? '';
        }
        default:
          return '';
      }
    };
    return [...rows].sort((a, b) => {
      const aLabel = labelFor(a);
      const bLabel = labelFor(b);
      const byLabel = aLabel.localeCompare(bLabel);
      if (byLabel !== 0) {
        return byLabel * orderFactor;
      }
      return a.id.localeCompare(b.id);
    });
  }, [rows, sortState, routinesById]);

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return displayRows.slice(start, start + PAGE_SIZE);
  }, [displayRows, page, totalPages]);

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

  const addRow = () => {
    setSortState({ mode: 'none' });
    setPage(1);
    setRows((prev) => [
      {
        id: uuidv4(),
        status: 'draft',
        playerType: PlayerType.CHILDREN,
        routineType: RoutineType.COMPETENCE,
        place: Place.GYM,
        routineId: routines[0]?.id ?? '',
      },
      ...prev,
    ]);
  };

  const updateRow = (id: string, patch: Partial<DraftRoutineMappingRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    if ('routineId' in patch) {
      setRoutineErrorsByRowId((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const saveRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) {
      return;
    }
    if (!row.routineId.trim()) {
      setRoutineErrorsByRowId((prev) => ({
        ...prev,
        [id]: t('mappings.routineRequired'),
      }));
      return;
    }
    const persisted: RoutineMapping = {
      id: row.serverId ?? row.id,
      playerType: row.playerType,
      routineType: row.routineType,
      place: row.place,
      routineId: row.routineId,
    };
    setSavingRowId(id);
    try {
      await onSaveRow(persisted);
    } catch {
      return;
    } finally {
      setSavingRowId(null);
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              serverId: persisted.id,
              status: 'saved',
            }
          : r
      )
    );
    setRoutineErrorsByRowId((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const editRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.status === 'saved'
          ? { ...r, status: 'draft' as const }
          : r
      )
    );
  };

  const removeRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) {
      return;
    }
    if (row.status === 'saved') {
      const mappingId = row.serverId ?? row.id;
      if (
        !window.confirm(
          t('mappings.deleteConfirm')
        )
      ) {
        return;
      }
      setRemovingRowId(id);
      try {
        await onRemoveRow(mappingId);
      } catch {
        return;
      } finally {
        setRemovingRowId(null);
      }
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setRoutineErrorsByRowId((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const safePage = Math.min(page, totalPages);
  const rangeStart =
    displayRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, displayRows.length);

  const showPaginationNav =
    !dataLoading && displayRows.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;
  const columnCount = readOnly ? 4 : 5;

  return (
    <div className="exercises-list mappings-list">
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">{t('mappings.title')}</h2>
        {!readOnly ? (
          <button
            type="button"
            className="exercises-list-create"
            onClick={addRow}
            disabled={
              hasDraftRow || routines.length === 0 || savingRowId !== null
            }
            title={
              routines.length === 0
                ? t('mappings.createRoutineFirst')
                : hasDraftRow
                  ? t('mappings.saveBeforeAdd')
                  : undefined
            }
          >
            {t('common.create')}
          </button>
        ) : null}
      </div>

      <div className="exercises-list-table-wrap">
        <table className="exercises-list-table list-data-table mappings-list-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={listSortColumnAriaSort('playerType', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines.playerType')}
                  column="playerType"
                  sortState={sortState}
                  onClick={() => toggleSort('playerType')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('routineType', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines.routineType')}
                  column="routineType"
                  sortState={sortState}
                  onClick={() => toggleSort('routineType')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('place', sortState)}>
                <SortColumnHeaderButton
                  label={t('routines.place')}
                  column="place"
                  sortState={sortState}
                  onClick={() => toggleSort('place')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('routine', sortState)}>
                <SortColumnHeaderButton
                  label={t('mappings.routine')}
                  column="routine"
                  sortState={sortState}
                  onClick={() => toggleSort('routine')}
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
                <td colSpan={columnCount}>{t('mappings.loadingList')}</td>
              </tr>
            ) : null}
            {!dataLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="routine-form-days-empty">
                  {readOnly ? t('mappings.noMappingsYet') : t('mappings.noMappingsCreate')}
                </td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((row) => {
                const routineLabel = routinesById.get(row.routineId)?.name ?? '-';
                return (
                  <tr key={row.id}>
                    <td>
                      {readOnly || row.status === 'saved' ? (
                        translatePlayerType(t, row.playerType)
                      ) : (
                        <select
                          className="routine-form-days-select"
                          value={row.playerType}
                          onChange={(e) =>
                            updateRow(row.id, {
                              playerType: e.target.value as PlayerType,
                            })
                          }
                        >
                          {playerTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {translatePlayerType(t, opt)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {readOnly || row.status === 'saved' ? (
                        translateRoutineType(t, row.routineType)
                      ) : (
                        <select
                          className="routine-form-days-select"
                          value={row.routineType}
                          onChange={(e) =>
                            updateRow(row.id, {
                              routineType: e.target.value as RoutineType,
                            })
                          }
                        >
                          {routineTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {translateRoutineType(t, opt)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {readOnly || row.status === 'saved' ? (
                        translatePlace(t, row.place)
                      ) : (
                        <select
                          className="routine-form-days-select"
                          value={row.place}
                          onChange={(e) =>
                            updateRow(row.id, {
                              place: e.target.value as Place,
                            })
                          }
                        >
                          {placeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {translatePlace(t, opt)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {readOnly || row.status === 'saved' ? (
                        routineLabel
                      ) : (
                        <div className="routine-form-days-day-field">
                          <select
                            className="routine-form-days-select"
                            value={row.routineId}
                            onChange={(e) =>
                              updateRow(row.id, {
                                routineId: e.target.value,
                              })
                            }
                            aria-required="true"
                            aria-invalid={
                              routineErrorsByRowId[row.id] ? true : undefined
                            }
                          >
                            <option value="">{t('mappings.selectRoutine')}</option>
                            {routines.map((routine) => (
                              <option key={routine.id} value={routine.id}>
                                {routine.name}
                              </option>
                            ))}
                          </select>
                          {routineErrorsByRowId[row.id] ? (
                            <p
                              className="exercise-form-error routine-form-days-day-error"
                              role="alert"
                            >
                              {routineErrorsByRowId[row.id]}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    {!readOnly ? (
                    <td className="exercises-list-actions-cell">
                      {row.status === 'draft' ? (
                        <div className="routine-form-days-row-actions">
                          <button
                            type="button"
                            className="routine-form-day-save"
                            disabled={savingRowId === row.id}
                            onClick={() => void saveRow(row.id)}
                          >
                            {savingRowId === row.id ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            type="button"
                            className="routine-form-day-remove"
                            aria-label={t('mappings.removeDraftAria')}
                            title={t('routines.removeRow')}
                            disabled={removingRowId === row.id}
                            onClick={() => void removeRow(row.id)}
                          >
                            <svg
                              className="routine-form-day-remove-icon"
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
                      ) : (
                        <div className="routine-form-days-row-actions routine-form-days-row-actions--saved">
                          <button
                            type="button"
                            className="exercises-list-icon-btn exercises-list-icon-btn--edit routine-form-days-icon-btn"
                            aria-label={t('mappings.editAria')}
                            title={
                              hasDraftRow
                                ? t('mappings.finishEditing')
                                : t('common.edit')
                            }
                            disabled={
                              hasDraftRow ||
                              removingRowId === row.id ||
                              savingRowId !== null
                            }
                            onClick={() => editRow(row.id)}
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
                            className="exercises-list-icon-btn exercises-list-icon-btn--remove routine-form-days-icon-btn"
                            aria-label={t('mappings.removeAria')}
                            title={t('common.remove')}
                            disabled={removingRowId === row.id}
                            onClick={() => void removeRow(row.id)}
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
                      )}
                    </td>
                    ) : null}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? t('common.loading')
            : displayRows.length === 0
              ? t('mappings.noMappings')
              : t('common.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: displayRows.length,
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
