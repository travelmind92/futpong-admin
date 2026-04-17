import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlayerType, Place, Routine, RoutineMapping, RoutineType } from '../types';

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

function sortColumnAriaSort(
  column: SortColumn,
  state: SortState
): 'none' | 'ascending' | 'descending' {
  if (state.mode === 'none' || state.column !== column) {
    return 'none';
  }
  return state.mode === 'asc' ? 'ascending' : 'descending';
}

const SORT_HEADER_TITLE =
  'Sort: ascending, then descending, then default (database) order';

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
  const [rows, setRows] = useState<DraftRoutineMappingRow[]>(() =>
    toDraftRows(routineMappings)
  );
  const [routineErrorsByRowId, setRoutineErrorsByRowId] = useState<
    Record<string, string>
  >({});
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });
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
  };

  const sortIndicator = (column: SortColumn) => {
    if (sortState.mode === 'none' || sortState.column !== column) {
      return '';
    }
    return sortState.mode === 'asc' ? ' ▲' : ' ▼';
  };

  const addRow = () => {
    setSortState({ mode: 'none' });
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
        [id]: 'Routine is required.',
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
          'Delete this mapping from the database? This cannot be undone.'
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

  return (
    <div className="exercises-list mappings-list">
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">Mappings</h2>
        <button
          type="button"
          className="exercises-list-create"
          onClick={addRow}
          disabled={
            hasDraftRow || routines.length === 0 || savingRowId !== null
          }
          title={
            routines.length === 0
              ? 'Create at least one routine before adding mappings'
              : hasDraftRow
                ? 'Save or remove the row being edited before adding another'
                : undefined
          }
        >
          Create
        </button>
      </div>

      <div className="exercises-list-table-wrap">
        <table className="exercises-list-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={sortColumnAriaSort('playerType', sortState)}>
                <button
                  type="button"
                  className="mappings-list-sort"
                  onClick={() => toggleSort('playerType')}
                  title={SORT_HEADER_TITLE}
                >
                  Player type{sortIndicator('playerType')}
                </button>
              </th>
              <th scope="col" aria-sort={sortColumnAriaSort('routineType', sortState)}>
                <button
                  type="button"
                  className="mappings-list-sort"
                  onClick={() => toggleSort('routineType')}
                  title={SORT_HEADER_TITLE}
                >
                  Routine type{sortIndicator('routineType')}
                </button>
              </th>
              <th scope="col" aria-sort={sortColumnAriaSort('place', sortState)}>
                <button
                  type="button"
                  className="mappings-list-sort"
                  onClick={() => toggleSort('place')}
                  title={SORT_HEADER_TITLE}
                >
                  Place{sortIndicator('place')}
                </button>
              </th>
              <th scope="col" aria-sort={sortColumnAriaSort('routine', sortState)}>
                <button
                  type="button"
                  className="mappings-list-sort"
                  onClick={() => toggleSort('routine')}
                  title={SORT_HEADER_TITLE}
                >
                  Routine{sortIndicator('routine')}
                </button>
              </th>
              <th
                scope="col"
                className="exercises-list-actions-header"
                aria-label="Actions"
              />
            </tr>
          </thead>
          <tbody>
            {dataLoading ? (
              <tr>
                <td colSpan={5}>Loading mappings...</td>
              </tr>
            ) : null}
            {!dataLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="routine-form-days-empty">
                  No mappings yet. Use Create to add a row.
                </td>
              </tr>
            ) : null}
            {!dataLoading &&
              displayRows.map((row) => {
                const routineLabel = routinesById.get(row.routineId)?.name ?? '-';
                return (
                  <tr key={row.id}>
                    <td>
                      {row.status === 'saved' ? (
                        row.playerType
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
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {row.status === 'saved' ? (
                        row.routineType
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
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {row.status === 'saved' ? (
                        row.place
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
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {row.status === 'saved' ? (
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
                            <option value="">Select routine</option>
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
                    <td className="exercises-list-actions-cell">
                      {row.status === 'draft' ? (
                        <div className="routine-form-days-row-actions">
                          <button
                            type="button"
                            className="routine-form-day-save"
                            disabled={savingRowId === row.id}
                            onClick={() => void saveRow(row.id)}
                          >
                            {savingRowId === row.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="routine-form-day-remove"
                            aria-label="Remove draft mapping row"
                            title="Remove row"
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
                            aria-label="Edit mapping row"
                            title={
                              hasDraftRow
                                ? 'Finish editing the row in progress first'
                                : 'Edit'
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
                            aria-label="Remove mapping row"
                            title="Remove"
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
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
