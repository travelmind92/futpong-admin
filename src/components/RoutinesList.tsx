import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Routine } from '../types';
import { RoutinesContextValue } from '../context/RoutinesContext';
import {
  listSortColumnAriaSort,
  SortColumnHeaderButton,
} from './SortColumnHeaderButton';

const PAGE_SIZE = 20;

type SortColumn = 'name' | 'playerType' | 'place' | 'type';

type SortState =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: SortColumn };

type RoutinesListProps = {
  routines: Routine[];
  dataLoading?: boolean;
};

export function RoutinesList({ routines, dataLoading }: RoutinesListProps) {
  const navigate = useNavigate();
  const { removeRoutine } = useOutletContext<RoutinesContextValue>();
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ mode: 'none' });

  const sortedRoutines = useMemo(() => {
    if (sortState.mode === 'none') {
      return routines;
    }
    const { column, mode } = sortState;
    const orderFactor = mode === 'asc' ? 1 : -1;
    const labelFor = (r: Routine): string => {
      switch (column) {
        case 'name':
          return r.name;
        case 'playerType':
          return r.playerType;
        case 'place':
          return r.place;
        case 'type':
          return r.type;
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
  }, [routines, sortState]);

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
    sortedRoutines.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedRoutines.length);

  const showPaginationNav =
    !dataLoading && sortedRoutines.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;

  return (
    <div className="exercises-list">
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">Routines</h2>
        <button
          type="button"
          className="exercises-list-create"
          onClick={() => navigate('new')}
        >
          Create
        </button>
      </div>

      <div className="exercises-list-table-wrap">
        <table className="exercises-list-table list-data-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={listSortColumnAriaSort('name', sortState)}>
                <SortColumnHeaderButton
                  label="Name"
                  column="name"
                  sortState={sortState}
                  onClick={() => toggleSort('name')}
                />
              </th>
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('playerType', sortState)}
              >
                <SortColumnHeaderButton
                  label="Player type"
                  column="playerType"
                  sortState={sortState}
                  onClick={() => toggleSort('playerType')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('place', sortState)}>
                <SortColumnHeaderButton
                  label="Place"
                  column="place"
                  sortState={sortState}
                  onClick={() => toggleSort('place')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('type', sortState)}>
                <SortColumnHeaderButton
                  label="Routine type"
                  column="type"
                  sortState={sortState}
                  onClick={() => toggleSort('type')}
                />
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
                <td colSpan={5}>Loading routines…</td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((routine) => (
              <tr key={routine.id}>
                <td>{routine.name}</td>
                <td>{routine.playerType}</td>
                <td>{routine.place}</td>
                <td>{routine.type}</td>
                <td className="exercises-list-actions-cell">
                  <div className="exercises-list-actions">
                    <button
                      type="button"
                      className="exercises-list-icon-btn exercises-list-icon-btn--edit"
                      aria-label={`Edit ${routine.name}`}
                      title="Edit"
                      onClick={() => navigate(`${routine.id}/edit`)}
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
                      aria-label={`Remove ${routine.name}`}
                      title="Remove"
                      onClick={() => {
                        void (async () => {
                          if (
                            !window.confirm(
                              `Remove "${routine.name}"? This cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          try {
                            await removeRoutine(routine.id);
                          } catch {
                            // `dataError` is set on the context provider
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? 'Loading…'
            : sortedRoutines.length === 0
              ? 'No routines'
              : `Showing ${rangeStart}–${rangeEnd} of ${sortedRoutines.length}`}
        </span>
        <div className="exercises-list-page-actions">
          {showPrevPage ? (
            <button
              type="button"
              className="exercises-list-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              Previous
            </button>
          ) : null}
          <span className="exercises-list-page-indicator">
            Page {safePage} of {totalPages}
          </span>
          {showNextPage ? (
            <button
              type="button"
              className="exercises-list-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
