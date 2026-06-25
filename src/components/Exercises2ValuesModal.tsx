import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EXERCISE_2_EMPTY_VALUE,
  EXERCISE_2_VALUES_OPTIONAL_HEADERS,
  EXERCISES_2_VALUES_TABLE_CSV,
} from '../templates/exercises2ValuesTable';
import {
  appendEmptyOptionalValues,
  parseValuesTableCsv,
} from '../utils/parseValuesTableCsv';

type Exercises2ValuesModalProps = {
  open: boolean;
  onClose: () => void;
};

function ValuesTableCell({ value }: { value: string }) {
  const { t } = useTranslation();
  const hasValue = value.trim().length > 0;
  const isEmptyExample = value === EXERCISE_2_EMPTY_VALUE;
  const isMultiple = !isEmptyExample && value.includes('/');

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).catch(() => undefined);
  };

  if (!hasValue) {
    return <td />;
  }

  if (isEmptyExample) {
    return (
      <td>
        <span className="exercises2-values-cell-value exercises2-values-cell-value--empty">
          {value}
        </span>
      </td>
    );
  }

  return (
    <td
      className={`exercises2-values-table-cell--copyable${
        isMultiple ? ' exercises2-values-table-cell--multiple' : ''
      }`}
    >
      <div className="exercises2-values-cell-inner">
        <div className="exercises2-values-cell-content">
          {isMultiple ? (
            <span className="exercises2-values-multiple-label">
              {t('exercises2.multipleExampleLabel')}
            </span>
          ) : null}
          <span className="exercises2-values-cell-value">{value}</span>
        </div>
        <button
          type="button"
          className="exercises2-values-copy-btn"
          aria-label={t('exercises2.copyCellValue')}
          title={t('exercises2.copyTooltip')}
          onClick={handleCopy}
        >
          <svg className="exercises2-values-copy-icon" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            />
          </svg>
        </button>
      </div>
    </td>
  );
}

export function Exercises2ValuesModal({ open, onClose }: Exercises2ValuesModalProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const table = useMemo(
    () =>
      appendEmptyOptionalValues(
        parseValuesTableCsv(EXERCISES_2_VALUES_TABLE_CSV),
        EXERCISE_2_VALUES_OPTIONAL_HEADERS,
        EXERCISE_2_EMPTY_VALUE
      ),
    []
  );

  const updateScrollRightButton = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const canScrollRight = el.scrollWidth > el.clientWidth + 1;
    const atStart = el.scrollLeft <= 2;
    setShowScrollRight(canScrollRight && atStart);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    updateScrollRightButton();
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(updateScrollRightButton);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, table, updateScrollRightButton]);

  const scrollTableToRight = () => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({
      left: el.scrollWidth - el.clientWidth,
      behavior: 'smooth',
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="blocks-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="blocks-modal exercises2-values-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercises2-values-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="exercises2-values-modal-title" className="blocks-modal-title">
            {t('exercises2.valuesModalTitle')}
          </h2>
          <button
            type="button"
            className="blocks-modal-close"
            aria-label={t('common.close')}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="blocks-modal-body exercises2-values-modal-body">
          <div className="exercises2-values-table-scroll-area">
            <div
              ref={scrollRef}
              className="exercises2-values-table-wrap"
              onScroll={updateScrollRightButton}
            >
              <table className="exercises2-values-table">
                <thead>
                  <tr>
                    {table.headers.map((header) => (
                      <th key={header} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <ValuesTableCell
                          key={`${rowIndex}-${cellIndex}`}
                          value={cell}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showScrollRight ? (
              <button
                type="button"
                className="exercises2-values-scroll-right-btn"
                aria-label={t('exercises2.scrollTableRight')}
                title={t('exercises2.scrollTableRight')}
                onClick={scrollTableToRight}
              >
                <svg
                  className="exercises2-values-scroll-right-icon"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    fill="currentColor"
                    d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
