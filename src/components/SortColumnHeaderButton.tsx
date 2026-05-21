import React from 'react';
import { useTranslation } from 'react-i18next';

export type ListSortState<C extends string> =
  | { mode: 'none' }
  | { mode: 'asc' | 'desc'; column: C };

export function listSortColumnAriaSort<C extends string>(
  column: C,
  state: ListSortState<C>
): 'none' | 'ascending' | 'descending' {
  if (state.mode === 'none' || state.column !== column) {
    return 'none';
  }
  return state.mode === 'asc' ? 'ascending' : 'descending';
}

type SortColumnHeaderButtonProps<C extends string> = {
  label: string;
  column: C;
  sortState: ListSortState<C>;
  onClick: () => void;
  title?: string;
};

/** Grey stroke icons: inactive = up+down carets; active = single caret (not filled triangles). */
function SortIconInactive() {
  return (
    <svg
      className="list-sort-btn__svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
    >
      <polyline
        points="6 9 12 5 18 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="6 15 12 19 18 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIconAsc() {
  return (
    <svg
      className="list-sort-btn__svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
    >
      <polyline
        points="6 9 12 5 18 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIconDesc() {
  return (
    <svg
      className="list-sort-btn__svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
    >
      <polyline
        points="6 15 12 19 18 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SortColumnHeaderButton<C extends string>({
  label,
  column,
  sortState,
  onClick,
  title,
}: SortColumnHeaderButtonProps<C>) {
  const { t } = useTranslation();
  const sortTitle = title ?? t('sort.headerTitle');
  const direction: 'inactive' | 'asc' | 'desc' =
    sortState.mode === 'none' || sortState.column !== column
      ? 'inactive'
      : sortState.mode;

  return (
    <button type="button" className="list-sort-btn" onClick={onClick} title={sortTitle}>
      <span className="list-sort-btn__label">{label}</span>
      <span className="list-sort-btn__icon" aria-hidden>
        {direction === 'inactive' ? (
          <SortIconInactive />
        ) : direction === 'asc' ? (
          <SortIconAsc />
        ) : (
          <SortIconDesc />
        )}
      </span>
    </button>
  );
}
