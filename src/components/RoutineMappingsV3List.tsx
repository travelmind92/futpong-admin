import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import { Age_V3, Level_V3, Period_V3, Place_V3 } from '../types/enums';
import { RoutineMapping_V3, Routine_V3 } from '../types/types';
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

const ageOptions = Object.values(Age_V3);
const levelOptions = Object.values(Level_V3);
const placeOptions = Object.values(Place_V3);
const periodOptions = Object.values(Period_V3);

type SortColumn = 'age' | 'level' | 'place' | 'period' | 'routine';

type SortState =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: SortColumn };

type RoutineMappingRow = RoutineMapping_V3 & {
  routineName: string;
};

type DraftMappingRow = {
  id: string;
  age: Age_V3;
  level: Level_V3;
  place: Place_V3;
  period: Period_V3;
  routineId: string;
};

type RoutineMappingsV3ListProps = {
  routineMappings: RoutineMapping_V3[];
  routines: Routine_V3[];
  dataLoading?: boolean;
  onUpdateMapping?: (mapping: RoutineMapping_V3) => Promise<void>;
  onCreateMapping?: (mapping: RoutineMapping_V3) => Promise<void>;
  onRemoveMapping?: (mappingId: string) => Promise<void>;
};

function createDefaultDraft(routines: Routine_V3[]): DraftMappingRow {
  return {
    id: uuidv4(),
    age: Age_V3.CHILDREN,
    level: Level_V3.RECREATIONAL,
    place: Place_V3.GYM,
    period: Period_V3.COMPETITION,
    routineId: routines[0]?.id ?? '',
  };
}

export function RoutineMappingsV3List({
  routineMappings,
  routines,
  dataLoading,
  onUpdateMapping,
  onCreateMapping,
  onRemoveMapping,
}: RoutineMappingsV3ListProps) {
  const { t } = useTranslation();
  const { readOnly } = useAuth();
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftRoutineId, setDraftRoutineId] = useState('');
  const [draftRow, setDraftRow] = useState<DraftMappingRow | null>(null);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);

  const routineNameById = useMemo(
    () => new Map(routines.map((routine) => [routine.id, routine.name])),
    [routines]
  );

  const routineOptions = useMemo(
    () => [...routines].sort((a, b) => a.name.localeCompare(b.name)),
    [routines]
  );

  const rows = useMemo(
    (): RoutineMappingRow[] =>
      routineMappings.map((mapping) => ({
        ...mapping,
        routineName: routineNameById.get(mapping.routineId) ?? '—',
      })),
    [routineMappings, routineNameById]
  );

  const sortedRows = useMemo(() => {
    if (sortState.mode === 'none') {
      return rows;
    }
    const { column, mode } = sortState;
    const orderFactor = mode === 'asc' ? 1 : -1;
    const labelFor = (row: RoutineMappingRow): string => {
      switch (column) {
        case 'age':
          return AgeLabel[row.age];
        case 'level':
          return LevelLabel[row.level];
        case 'place':
          return PlaceLabel[row.place];
        case 'period':
          return PeriodLabel[row.period];
        case 'routine':
          return row.routineName;
        default:
          return '';
      }
    };
    return [...rows].sort((a, b) => {
      const byLabel = labelFor(a).localeCompare(labelFor(b));
      if (byLabel !== 0) {
        return byLabel * orderFactor;
      }
      return a.id.localeCompare(b.id);
    });
  }, [rows, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page, totalPages]);

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

  const startEdit = (row: RoutineMappingRow) => {
    setEditingRowId(row.id);
    setDraftRoutineId(row.routineId);
  };

  const saveEdit = async (row: RoutineMappingRow) => {
    if (!onUpdateMapping) {
      return;
    }
    if (draftRoutineId === row.routineId) {
      setEditingRowId(null);
      return;
    }
    const updated: RoutineMapping_V3 = {
      ...row,
      routineId: draftRoutineId,
    };
    setSavingRowId(row.id);
    try {
      await onUpdateMapping(updated);
      setEditingRowId(null);
    } catch {
      // Error banner is set on the layout provider
    } finally {
      setSavingRowId(null);
    }
  };

  const addRow = () => {
    setSortState({ mode: 'none' });
    setPage(1);
    setEditingRowId(null);
    setDraftRow(createDefaultDraft(routines));
  };

  const cancelDraft = () => {
    setDraftRow(null);
  };

  const saveDraft = async () => {
    if (!draftRow || !onCreateMapping) {
      return;
    }
    if (!draftRow.routineId.trim()) {
      return;
    }
    const mapping: RoutineMapping_V3 = {
      id: draftRow.id,
      age: draftRow.age,
      level: draftRow.level,
      place: draftRow.place,
      period: draftRow.period,
      routineId: draftRow.routineId,
    };
    setSavingRowId(draftRow.id);
    try {
      await onCreateMapping(mapping);
      setDraftRow(null);
    } catch {
      // Error banner is set on the layout provider
    } finally {
      setSavingRowId(null);
    }
  };

  const updateDraft = (patch: Partial<DraftMappingRow>) => {
    setDraftRow((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const removeMapping = async (row: RoutineMappingRow) => {
    if (!onRemoveMapping) {
      return;
    }
    if (!window.confirm(t('mappings.deleteConfirm'))) {
      return;
    }
    if (editingRowId === row.id) {
      setEditingRowId(null);
    }
    setRemovingRowId(row.id);
    try {
      await onRemoveMapping(row.id);
    } catch {
      // Error banner is set on the layout provider
    } finally {
      setRemovingRowId(null);
    }
  };

  const safePage = Math.min(page, totalPages);
  const rangeStart =
    sortedRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedRows.length);

  const showPaginationNav = !dataLoading && sortedRows.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;
  const hasDraftRow = draftRow !== null;
  const isEditingRow = editingRowId !== null;
  const isBusy =
    hasDraftRow || isEditingRow || savingRowId !== null || removingRowId !== null;
  const columnCount = readOnly ? 5 : 6;

  return (
    <>
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">{t('mappings2.title')}</h2>
        {!readOnly && onCreateMapping ? (
          <button
            type="button"
            className="exercises-list-create"
            onClick={addRow}
            disabled={isBusy || routines.length === 0}
            title={
              routines.length === 0
                ? t('mappings.createRoutineFirst')
                : hasDraftRow || isEditingRow
                  ? t('mappings.saveBeforeAdd')
                  : undefined
            }
          >
            {t('mappings2.add')}
          </button>
        ) : null}
      </div>

      <div className="exercises-list-table-wrap">
        <table className="exercises-list-table list-data-table">
          <thead>
            <tr>
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
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('routine', sortState)}
              >
                <SortColumnHeaderButton
                  label={t('mappings2.routine')}
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
                <td colSpan={columnCount}>{t('mappings2.loadingList')}</td>
              </tr>
            ) : null}
            {!dataLoading && draftRow ? (
              <tr key={draftRow.id}>
                <td>
                  <select
                    className="routine-form-days-select"
                    value={draftRow.age}
                    onChange={(e) =>
                      updateDraft({ age: e.target.value as Age_V3 })
                    }
                    aria-label={t('routines2.age')}
                    disabled={savingRowId === draftRow.id}
                  >
                    {ageOptions.map((option) => (
                      <option key={option} value={option}>
                        {AgeLabel[option]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="routine-form-days-select"
                    value={draftRow.level}
                    onChange={(e) =>
                      updateDraft({ level: e.target.value as Level_V3 })
                    }
                    aria-label={t('routines2.level')}
                    disabled={savingRowId === draftRow.id}
                  >
                    {levelOptions.map((option) => (
                      <option key={option} value={option}>
                        {LevelLabel[option]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="routine-form-days-select"
                    value={draftRow.place}
                    onChange={(e) =>
                      updateDraft({ place: e.target.value as Place_V3 })
                    }
                    aria-label={t('routines2.place')}
                    disabled={savingRowId === draftRow.id}
                  >
                    {placeOptions.map((option) => (
                      <option key={option} value={option}>
                        {PlaceLabel[option]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="routine-form-days-select"
                    value={draftRow.period}
                    onChange={(e) =>
                      updateDraft({ period: e.target.value as Period_V3 })
                    }
                    aria-label={t('routines2.period')}
                    disabled={savingRowId === draftRow.id}
                  >
                    {periodOptions.map((option) => (
                      <option key={option} value={option}>
                        {PeriodLabel[option]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="routine-form-days-select mappings2-routine-select"
                    value={draftRow.routineId}
                    onChange={(e) =>
                      updateDraft({ routineId: e.target.value })
                    }
                    aria-label={t('mappings2.routine')}
                    disabled={savingRowId === draftRow.id}
                  >
                    <option value="">{t('mappings.selectRoutine')}</option>
                    {routineOptions.map((routine) => (
                      <option key={routine.id} value={routine.id}>
                        {routine.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="exercises-list-actions-cell">
                  <div className="routine-form-days-row-actions">
                    <button
                      type="button"
                      className="routine-form-day-save"
                      disabled={
                        savingRowId === draftRow.id || !draftRow.routineId.trim()
                      }
                      onClick={() => void saveDraft()}
                    >
                      {savingRowId === draftRow.id
                        ? t('common.saving')
                        : t('common.save')}
                    </button>
                    <button
                      type="button"
                      className="routine-form-day-remove"
                      aria-label={t('mappings2.cancelDraftAria')}
                      title={t('common.cancel')}
                      disabled={savingRowId === draftRow.id}
                      onClick={cancelDraft}
                    >
                      <svg
                        className="routine-form-day-remove-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          fill="currentColor"
                          d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3 1.42 1.42z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
            {!dataLoading && sortedRows.length === 0 && !draftRow ? (
              <tr>
                <td colSpan={columnCount}>{t('mappings2.noMappings')}</td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((row) => {
                const isEditing = editingRowId === row.id;
                const editDisabled =
                  readOnly ||
                  !onUpdateMapping ||
                  hasDraftRow ||
                  (isEditingRow && !isEditing) ||
                  savingRowId === row.id;
                const removeDisabled =
                  readOnly ||
                  !onRemoveMapping ||
                  hasDraftRow ||
                  isEditingRow ||
                  savingRowId !== null ||
                  removingRowId !== null;

                return (
                  <tr key={row.id}>
                    <td>{AgeLabel[row.age]}</td>
                    <td>{LevelLabel[row.level]}</td>
                    <td>{PlaceLabel[row.place]}</td>
                    <td>{PeriodLabel[row.period]}</td>
                    <td>
                      <div className="mappings2-routine-cell">
                        {isEditing ? (
                          <select
                            className="routine-form-days-select mappings2-routine-select"
                            value={draftRoutineId}
                            onChange={(e) => setDraftRoutineId(e.target.value)}
                            aria-label={t('mappings2.routine')}
                            disabled={savingRowId === row.id}
                          >
                            {routineOptions.map((routine) => (
                              <option key={routine.id} value={routine.id}>
                                {routine.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="mappings2-routine-name">
                            {row.routineName}
                          </span>
                        )}
                        {!readOnly && onUpdateMapping ? (
                          <button
                            type="button"
                            className={`exercises-list-icon-btn ${
                              isEditing
                                ? 'exercises-list-icon-btn--save'
                                : 'exercises-list-icon-btn--edit'
                            }`}
                            aria-label={
                              isEditing
                                ? t('mappings2.saveRoutineAria')
                                : t('mappings2.editRoutineAria')
                            }
                            title={
                              editDisabled && !isEditing
                                ? t('mappings.finishEditing')
                                : isEditing
                                  ? t('common.save')
                                  : t('common.edit')
                            }
                            disabled={editDisabled}
                            onClick={() => {
                              if (isEditing) {
                                void saveEdit(row);
                              } else {
                                startEdit(row);
                              }
                            }}
                          >
                            <svg
                              className="exercises-list-row-icon"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                fill="currentColor"
                                d={
                                  isEditing
                                    ? 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'
                                    : 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z'
                                }
                              />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </td>
                    {!readOnly ? (
                      <td className="exercises-list-actions-cell">
                        {onRemoveMapping ? (
                          <div className="exercises-list-actions">
                            <button
                              type="button"
                              className="exercises-list-icon-btn exercises-list-icon-btn--remove"
                              aria-label={t('mappings2.removeAria')}
                              title={t('common.remove')}
                              disabled={removeDisabled}
                              onClick={() => void removeMapping(row)}
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
                        ) : null}
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
            : sortedRows.length === 0
              ? draftRow
                ? t('mappings2.draftOnly')
                : t('mappings2.noMappings')
              : t('common.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: sortedRows.length,
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
