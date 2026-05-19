import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Exercise } from '../types';
import { ExercisesContextValue } from '../context/ExercisesContext';
import {
  listSortColumnAriaSort,
  SortColumnHeaderButton,
} from './SortColumnHeaderButton';

const PAGE_SIZE = 20;
const DESCRIPTION_PREVIEW_CHARS = 80;

type SortColumn =
  | 'name'
  | 'repType'
  | 'description'
  | 'video'
  | 'thumbnail';

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

function hasThumbnailUrl(url: string | undefined): boolean {
  return (url?.trim() ?? '').length > 0;
}

type ExercisesListProps = {
  exercises: Exercise[];
  dataLoading?: boolean;
};

export function ExercisesList({ exercises, dataLoading }: ExercisesListProps) {
  const navigate = useNavigate();
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
        case 'thumbnail':
          return hasThumbnailUrl(ex.thumbnailUrl) ? '1' : '0';
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

  return (
    <div className="exercises-list">
      <div className="exercises-list-toolbar">
        <h2 className="exercises-list-title">Exercises</h2>
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
                aria-sort={listSortColumnAriaSort('repType', sortState)}
              >
                <SortColumnHeaderButton
                  label="Rep type"
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
                  label="Description"
                  column="description"
                  sortState={sortState}
                  onClick={() => toggleSort('description')}
                />
              </th>
              <th scope="col" aria-sort={listSortColumnAriaSort('video', sortState)}>
                <SortColumnHeaderButton
                  label="Video"
                  column="video"
                  sortState={sortState}
                  onClick={() => toggleSort('video')}
                />
              </th>
              <th
                scope="col"
                aria-sort={listSortColumnAriaSort('thumbnail', sortState)}
              >
                <SortColumnHeaderButton
                  label="Thumbnail"
                  column="thumbnail"
                  sortState={sortState}
                  onClick={() => toggleSort('thumbnail')}
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
                <td colSpan={6}>Loading exercises…</td>
              </tr>
            ) : null}
            {!dataLoading &&
              pageItems.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                <td>{exercise.repType}</td>
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
                      title="Video available"
                      aria-label="Video available"
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
                  {hasThumbnailUrl(exercise.thumbnailUrl) ? (
                    <span
                      className="exercises-list-thumb-yes"
                      title="Thumbnail available"
                      aria-label="Thumbnail available"
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
                <td className="exercises-list-actions-cell">
                  <div className="exercises-list-actions">
                    <button
                      type="button"
                      className="exercises-list-icon-btn exercises-list-icon-btn--edit"
                      aria-label={`Edit ${exercise.name}`}
                      title="Edit"
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
                      aria-label={`Remove ${exercise.name}`}
                      title="Remove"
                      onClick={() => {
                        void (async () => {
                          if (
                            !window.confirm(
                              `Remove "${exercise.name}"? This cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          try {
                            await removeExercise(exercise.id);
                          } catch (e) {
                            if (
                              e instanceof Error &&
                              e.message.includes('training block')
                            ) {
                              window.alert(e.message);
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? 'Loading…'
            : sortedExercises.length === 0
              ? 'No exercises'
              : `Showing ${rangeStart}–${rangeEnd} of ${sortedExercises.length}`}
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
