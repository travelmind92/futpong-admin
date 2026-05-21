import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise } from '../types';

export type LocalExerciseItem = {
  id: string;
  /** 1-based order in the list (derived from row order). */
  index: number;
  exerciseId: string;
  reps: string;
  /**
   * Search field text while editing; `null` means show the resolved exercise name from `exerciseId`.
   */
  exerciseSearchDraft: string | null;
};

export type LocalTrainingBlock = {
  id: string;
  /** 1-based order in the list (derived from row order). */
  index: number;
  name: string;
  series: string;
  exercises: LocalExerciseItem[];
};

function withBlockIndices(list: LocalTrainingBlock[]): LocalTrainingBlock[] {
  return list.map((b, i) => ({
    ...b,
    index: i + 1,
    exercises: withExerciseIndices(b.exercises ?? []),
  }));
}

/** Assigns `ExerciseItem.index` from row order (first row → 1). */
function withExerciseIndices(list: LocalExerciseItem[]): LocalExerciseItem[] {
  return list.map((ex, i) => ({ ...ex, index: i + 1 }));
}

function exerciseInputDisplay(
  ex: LocalExerciseItem,
  exercises: Exercise[]
): string {
  if (ex.exerciseSearchDraft != null) {
    return ex.exerciseSearchDraft;
  }
  const found = exercises.find((o) => o.id === ex.exerciseId);
  return found?.name ?? '';
}

function filterExercisesBySearch(
  exercises: Exercise[],
  searchText: string
): Exercise[] {
  const t = searchText.trim().toLowerCase();
  if (!t) {
    return exercises.slice(0, 15);
  }
  return exercises
    .filter((e) => e.name.toLowerCase().includes(t))
    .slice(0, 20);
}

/** Resolves `exerciseId` from stored id or an exact name match (case-insensitive). */
export function resolveExerciseIdForItem(
  ex: LocalExerciseItem,
  exercises: Exercise[]
): string {
  if ((ex.exerciseId ?? '').trim()) {
    return ex.exerciseId.trim();
  }
  const raw = ex.exerciseSearchDraft != null ? ex.exerciseSearchDraft : '';
  const q = raw.trim();
  if (!q) {
    return '';
  }
  const lower = q.toLowerCase();
  const matches = exercises.filter((e) => e.name.toLowerCase() === lower);
  if (matches.length === 1) {
    return matches[0].id;
  }
  return '';
}

/** Whether the row has a resolved exercise and non-empty reps. */
export function isLocalExerciseRowComplete(
  ex: LocalExerciseItem,
  exercises: Exercise[]
): boolean {
  const id = resolveExerciseIdForItem(ex, exercises);
  return Boolean(id && (ex.reps ?? '').trim());
}

/** Commits resolved exercise ids, clears search drafts, and re-assigns exercise indices from order (1…n). */
export function normalizeBlocksForSave(
  blocks: LocalTrainingBlock[],
  exercises: Exercise[]
): LocalTrainingBlock[] {
  return blocks.map((b, i) => ({
    ...b,
    index: i + 1,
    exercises: withExerciseIndices(
      (b.exercises ?? []).map((ex) => ({
        ...ex,
        exerciseId: resolveExerciseIdForItem(ex, exercises),
        exerciseSearchDraft: null,
      }))
    ),
  }));
}

type ExerciseSearchFieldProps = {
  inputId: string;
  showSuggestions: boolean;
  searchDisplay: string;
  pickerList: Exercise[];
  onSearchChange: (value: string) => void;
  onFocusCombo: () => void;
  onBlurCombo: () => void;
  onPick: (exerciseId: string) => void;
};

function ExerciseSearchField({
  inputId,
  showSuggestions,
  searchDisplay,
  pickerList,
  onSearchChange,
  onFocusCombo,
  onBlurCombo,
  onPick,
}: ExerciseSearchFieldProps) {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    setFixedPos({
      top: r.bottom + 2,
      left: r.left,
      width: r.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions || pickerList.length === 0) {
      setFixedPos(null);
      return;
    }
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    const modalBody = wrapRef.current?.closest(
      '.blocks-modal-body'
    ) as HTMLElement | null;
    const backdrop = wrapRef.current?.closest(
      '.blocks-modal-backdrop'
    ) as HTMLElement | null;
    modalBody?.addEventListener('scroll', onScrollOrResize);
    backdrop?.addEventListener('scroll', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      modalBody?.removeEventListener('scroll', onScrollOrResize);
      backdrop?.removeEventListener('scroll', onScrollOrResize);
    };
  }, [showSuggestions, pickerList.length, searchDisplay, updatePosition]);

  const showPortal =
    showSuggestions && fixedPos !== null && pickerList.length > 0;

  return (
    <div ref={wrapRef} className="blocks-modal-exercise-search-wrap">
      <input
        id={inputId}
        type="text"
        className="blocks-modal-field-input blocks-modal-field-exercise-search"
        value={searchDisplay}
        placeholder={t('blocksModal.searchExercise')}
        autoComplete="off"
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocusCombo}
        onBlur={onBlurCombo}
      />
      {showPortal
        ? createPortal(
            <ul
              className="blocks-modal-exercise-suggestions blocks-modal-exercise-suggestions--fixed"
              style={{
                top: fixedPos.top,
                left: fixedPos.left,
                width: Math.max(fixedPos.width, 220),
              }}
            >
              {pickerList.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className="blocks-modal-exercise-suggestion"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onPick(opt.id);
                    }}
                  >
                    {opt.name}
                  </button>
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}

type BlocksModalProps = {
  open: boolean;
  title: string;
  blocks: LocalTrainingBlock[];
  exercises: Exercise[];
  onChange: (blocks: LocalTrainingBlock[]) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function BlocksModal({
  open,
  title,
  blocks,
  exercises: exerciseOptions,
  onChange,
  onSave,
  onCancel,
}: BlocksModalProps) {
  const { t } = useTranslation();
  const [activeExerciseComboKey, setActiveExerciseComboKey] = useState<
    string | null
  >(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollBodyToBottomRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setActiveExerciseComboKey(null);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  useLayoutEffect(() => {
    if (!open || !pendingScrollBodyToBottomRef.current) {
      return;
    }
    pendingScrollBodyToBottomRef.current = false;
    const el = bodyScrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [blocks, open]);

  if (!open) {
    return null;
  }

  const cannotSaveBlocks = blocks.some(
    (b) =>
      !(b.name ?? '').trim() ||
      !(b.series ?? '').trim() ||
      (b.exercises ?? []).some(
        (ex) => !isLocalExerciseRowComplete(ex, exerciseOptions)
      )
  );

  const moveRow = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(withBlockIndices(next));
  };

  const updateName = (index: number, name: string) => {
    onChange(blocks.map((b, i) => (i === index ? { ...b, name } : b)));
  };

  const updateSeries = (index: number, series: string) => {
    onChange(blocks.map((b, i) => (i === index ? { ...b, series } : b)));
  };

  const setBlockExercises = (
    blockIndex: number,
    exercises: LocalExerciseItem[]
  ) => {
    onChange(
      blocks.map((b, i) =>
        i === blockIndex ? { ...b, exercises: withExerciseIndices(exercises) } : b
      )
    );
  };

  const updateExerciseSearchText = (
    blockIndex: number,
    exerciseIndex: number,
    value: string
  ) => {
    const block = blocks[blockIndex];
    const next = (block.exercises ?? []).map((ex, i) =>
      i === exerciseIndex
        ? { ...ex, exerciseId: '', exerciseSearchDraft: value }
        : ex
    );
    setBlockExercises(blockIndex, next);
  };

  const selectExercise = (
    blockIndex: number,
    exerciseIndex: number,
    exerciseId: string
  ) => {
    const block = blocks[blockIndex];
    const next = (block.exercises ?? []).map((ex, i) =>
      i === exerciseIndex
        ? { ...ex, exerciseId, exerciseSearchDraft: null }
        : ex
    );
    setBlockExercises(blockIndex, next);
  };

  const blurResolveExercise = (
    blockIndex: number,
    exerciseIndex: number
  ) => {
    const block = blocks[blockIndex];
    const ex = (block.exercises ?? [])[exerciseIndex];
    if (!ex) {
      return;
    }
    const id = resolveExerciseIdForItem(ex, exerciseOptions);
    if (id) {
      selectExercise(blockIndex, exerciseIndex, id);
    }
  };

  const updateExerciseReps = (
    blockIndex: number,
    exerciseIndex: number,
    reps: string
  ) => {
    const block = blocks[blockIndex];
    const next = (block.exercises ?? []).map((ex, i) =>
      i === exerciseIndex ? { ...ex, reps } : ex
    );
    setBlockExercises(blockIndex, next);
  };

  const removeExerciseRow = (blockIndex: number, exerciseIndex: number) => {
    const block = blocks[blockIndex];
    setBlockExercises(
      blockIndex,
      (block.exercises ?? []).filter((_, i) => i !== exerciseIndex)
    );
  };

  const addExerciseRow = (blockIndex: number) => {
    const block = blocks[blockIndex];
    setBlockExercises(blockIndex, [
      ...(block.exercises ?? []),
      {
        id: uuidv4(),
        index: (block.exercises?.length ?? 0) + 1,
        exerciseId: '',
        reps: '',
        exerciseSearchDraft: null,
      },
    ]);
  };

  const removeRow = (index: number) => {
    onChange(withBlockIndices(blocks.filter((_, i) => i !== index)));
  };

  const addRow = () => {
    pendingScrollBodyToBottomRef.current = true;
    onChange(
      withBlockIndices([
        ...blocks,
        {
          id: uuidv4(),
          index: blocks.length + 1,
          name: '',
          series: '',
          exercises: [],
        },
      ])
    );
  };

  return (
    <div
      className="blocks-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="blocks-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocks-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="blocks-modal-title" className="blocks-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="blocks-modal-close"
            aria-label={t('common.close')}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="blocks-modal-body" ref={bodyScrollRef}>
          <div className="exercises-list-table-wrap blocks-modal-table-wrap">
            <table className="exercises-list-table blocks-modal-table">
              {blocks.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4} className="blocks-modal-empty">
                      {t('blocksModal.empty')}
                    </td>
                  </tr>
                </tbody>
              ) : (
                blocks.map((block, index) => (
                  <tbody key={block.id} className="blocks-modal-block-group">
                    <tr>
                      <td
                        colSpan={4}
                        className="blocks-modal-block-card-cell"
                      >
                        <div
                          className="blocks-modal-block-card"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = Number(
                              e.dataTransfer.getData('text/plain')
                            );
                            if (!Number.isNaN(from)) {
                              moveRow(from, index);
                            }
                          }}
                        >
                          <div className="blocks-modal-block-main">
                            <div className="blocks-modal-cell-drag">
                              <button
                                type="button"
                                className="blocks-modal-drag"
                                draggable
                                title={t('blocksModal.dragToReorder')}
                                aria-label={t('blocksModal.reorderBlockAria', {
                                  index: block.index,
                                })}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData(
                                    'text/plain',
                                    String(index)
                                  );
                                }}
                              >
                                <svg
                                  className="blocks-modal-drag-icon"
                                  viewBox="0 0 24 24"
                                  aria-hidden
                                >
                                  <path
                                    fill="currentColor"
                                    d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="blocks-modal-block-field blocks-modal-block-field--labeled">
                              <label
                                className="blocks-modal-block-inline-label"
                                htmlFor={`block-name-${block.id}`}
                              >
                                {t('common.name')}
                              </label>
                              <input
                                id={`block-name-${block.id}`}
                                type="text"
                                className="blocks-modal-field-input"
                                value={block.name}
                                onChange={(e) =>
                                  updateName(index, e.target.value)
                                }
                              />
                            </div>
                            <div className="blocks-modal-block-field blocks-modal-block-field--labeled">
                              <label
                                className="blocks-modal-block-inline-label"
                                htmlFor={`block-series-${block.id}`}
                              >
                                {t('blocksModal.series')}
                              </label>
                              <input
                                id={`block-series-${block.id}`}
                                type="text"
                                className="blocks-modal-field-input"
                                value={block.series}
                                onChange={(e) =>
                                  updateSeries(index, e.target.value)
                                }
                              />
                            </div>
                            <div className="blocks-modal-cell-actions">
                              <button
                                type="button"
                                className="blocks-modal-remove"
                                aria-label={t('blocksModal.removeBlockAria', {
                                  index: block.index,
                                })}
                                onClick={() => removeRow(index)}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <div className="blocks-modal-block-exercises">
                          <div className="blocks-modal-exercise-table-wrap">
                            <table className="exercises-list-table blocks-modal-exercise-table">
                              <tbody>
                                {(block.exercises ?? []).length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="blocks-modal-exercise-empty"
                                    >
                                      {t('blocksModal.noExercisesYet')}
                                    </td>
                                  </tr>
                                ) : (
                                  (block.exercises ?? []).map(
                                    (ex, exIndex) => {
                                      const comboKey = `${block.id}-${ex.id}`;
                                      const searchDisplay = exerciseInputDisplay(
                                        ex,
                                        exerciseOptions
                                      );
                                      const pickerList = filterExercisesBySearch(
                                        exerciseOptions,
                                        searchDisplay
                                      );
                                      const showSuggestions =
                                        activeExerciseComboKey === comboKey &&
                                        pickerList.length > 0;
                                      const exerciseInputId = `exercise-pick-${block.id}-${ex.id}`;
                                      const repsInputId = `exercise-reps-${block.id}-${ex.id}`;

                                      return (
                                      <tr key={ex.id}>
                                        <td>
                                          <div className="blocks-modal-block-field blocks-modal-block-field--labeled blocks-modal-exercise-labeled-cell">
                                            <label
                                              className="blocks-modal-block-inline-label"
                                              htmlFor={exerciseInputId}
                                            >
                                              {t('blocksModal.exercise')}
                                            </label>
                                            <ExerciseSearchField
                                              inputId={exerciseInputId}
                                              showSuggestions={showSuggestions}
                                              searchDisplay={searchDisplay}
                                              pickerList={pickerList}
                                              onSearchChange={(value) =>
                                                updateExerciseSearchText(
                                                  index,
                                                  exIndex,
                                                  value
                                                )
                                              }
                                              onFocusCombo={() =>
                                                setActiveExerciseComboKey(
                                                  comboKey
                                                )
                                              }
                                              onBlurCombo={() => {
                                                window.setTimeout(() => {
                                                  setActiveExerciseComboKey(
                                                    (k) =>
                                                      k === comboKey ? null : k
                                                  );
                                                  blurResolveExercise(
                                                    index,
                                                    exIndex
                                                  );
                                                }, 120);
                                              }}
                                              onPick={(exerciseId) => {
                                                selectExercise(
                                                  index,
                                                  exIndex,
                                                  exerciseId
                                                );
                                                setActiveExerciseComboKey(null);
                                              }}
                                            />
                                          </div>
                                        </td>
                                        <td>
                                          <div className="blocks-modal-block-field blocks-modal-block-field--labeled blocks-modal-exercise-labeled-cell">
                                            <label
                                              className="blocks-modal-block-inline-label"
                                              htmlFor={repsInputId}
                                            >
                                              {t('blocksModal.reps')}
                                            </label>
                                            <input
                                              id={repsInputId}
                                              type="text"
                                              className="blocks-modal-field-input blocks-modal-field-reps-narrow"
                                              value={ex.reps}
                                              onChange={(e) =>
                                                updateExerciseReps(
                                                  index,
                                                  exIndex,
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </div>
                                        </td>
                                        <td className="exercises-list-actions-cell">
                                          <div className="exercises-list-actions">
                                            <button
                                              type="button"
                                              className="blocks-modal-remove"
                                              aria-label={t(
                                                'blocksModal.removeExerciseAria',
                                                {
                                                  exerciseIndex: ex.index,
                                                  blockIndex: block.index,
                                                }
                                              )}
                                              onClick={() =>
                                                removeExerciseRow(
                                                  index,
                                                  exIndex
                                                )
                                              }
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                      );
                                    }
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="blocks-modal-add-row blocks-modal-add-row--nested">
                            <button
                              type="button"
                              className="blocks-modal-add"
                              onClick={() => addExerciseRow(index)}
                            >
                              {t('blocksModal.addExercise')}
                            </button>
                          </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ))
              )}
            </table>

            <div className="blocks-modal-add-row blocks-modal-add-row--in-scroll">
              <button
                type="button"
                className="blocks-modal-add"
                onClick={addRow}
              >
                {t('blocksModal.addBlock')}
              </button>
            </div>
          </div>
        </div>

        <div className="blocks-modal-footer">
          <button
            type="button"
            className="blocks-modal-btn blocks-modal-btn--secondary"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="blocks-modal-btn blocks-modal-btn--primary"
            disabled={cannotSaveBlocks}
            title={
              cannotSaveBlocks ? t('blocksModal.saveDisabledTitle') : undefined
            }
            onClick={onSave}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Re-index blocks when opening the editor (order → index 1…n). */
export function hydrateBlocksForModal(
  raw: LocalTrainingBlock[]
): LocalTrainingBlock[] {
  return raw.map((b, i) => ({
    ...b,
    index: i + 1,
    name: b.name ?? '',
    series: b.series ?? '',
    exercises: withExerciseIndices(
      (b.exercises ?? []).map((ex) => ({
        ...ex,
        id: ex.id ?? uuidv4(),
        exerciseId: ex.exerciseId ?? '',
        reps: ex.reps ?? '',
        exerciseSearchDraft: ex.exerciseSearchDraft ?? null,
      }))
    ),
  }));
}
