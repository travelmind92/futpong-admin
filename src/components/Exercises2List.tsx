import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Exercise_V3 } from '../types/types';
import {
  AgeLabel,
  BlockTypeLabel,
  ChallengeLevelLabel,
  DifficultyLabel,
  ElementLabel,
  ExerciseCategoryLabel,
  ExercisePropLabels,
  ImpactLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
  RepTypeLabel,
  SkillLabel,
  WeightTypeLabel,
} from '../types/labels';

const DESCRIPTION_PREVIEW_CHARS = 25;

const PAGE_SIZE = 20;

const EXERCISE_V3_DETAIL_PROPS = [
  'name',
  'description',
  'repType',
  'ages',
  'level',
  'places',
  'period',
  'blockType',
  'category',
  'skill',
  'challengeLevel',
  'mainMuscle',
  'elements',
  'weightType',
  'impact',
  'difficulty',
  'sistituteGroup',
  'videoUrl',
  'imageUrl',
] as const satisfies readonly (keyof Exercise_V3)[];

type ExerciseV3DetailProp = (typeof EXERCISE_V3_DETAIL_PROPS)[number];

type ExercisesV3ListProps = {
  exercises: Exercise_V3[];
  dataLoading?: boolean;
  readOnly?: boolean;
  onRemoveExercise?: (id: string) => Promise<void>;
  searchQuery?: string;
  totalExerciseCount?: number;
};

function hasMediaUrl(url: string | undefined): boolean {
  return (url?.trim() ?? '').length > 0;
}

function truncateDescription(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}...`;
}

function formatEnumArray<T extends string>(
  values: T[] | undefined,
  labelMap: Record<T, string>
): string {
  if (!values || values.length === 0) {
    return '-';
  }
  return values.map((value) => labelMap[value]).join(' / ');
}

function formatOptionalText(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : '-';
}

function Exercise2MediaIcon({
  type,
  available,
  label,
}: {
  type: 'video' | 'image';
  available: boolean;
  label: string;
}) {
  if (!available) {
    return <span className="exercises-list-video-no">-</span>;
  }

  if (type === 'video') {
    return (
      <span
        className="exercises-list-video-yes"
        title={label}
        aria-label={label}
      >
        <svg className="exercises-list-video-icon" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M8 5v14l11-7z" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="exercises-list-thumb-yes"
      title={label}
      aria-label={label}
    >
      <svg className="exercises-list-thumb-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
        />
      </svg>
    </span>
  );
}

function formatExercise2DetailValue(
  prop: ExerciseV3DetailProp,
  exercise: Exercise_V3,
  t: (key: string) => string
): React.ReactNode {
  switch (prop) {
    case 'description':
      return truncateDescription(exercise.description, DESCRIPTION_PREVIEW_CHARS);
    case 'repType':
      return RepTypeLabel[exercise.repType];
    case 'ages':
      return formatEnumArray(exercise.ages, AgeLabel);
    case 'level':
      return LevelLabel[exercise.level];
    case 'places':
      return formatEnumArray(exercise.places, PlaceLabel);
    case 'period':
      return exercise.period ? PeriodLabel[exercise.period] : '-';
    case 'blockType':
      return BlockTypeLabel[exercise.blockType];
    case 'category':
      return ExerciseCategoryLabel[exercise.category];
    case 'skill':
      return exercise.skill ? SkillLabel[exercise.skill] : '-';
    case 'challengeLevel':
      return exercise.challengeLevel
        ? ChallengeLevelLabel[exercise.challengeLevel]
        : '-';
    case 'mainMuscle':
      return formatOptionalText(exercise.mainMuscle);
    case 'elements':
      return formatEnumArray(exercise.elements, ElementLabel);
    case 'weightType':
      return exercise.weightType
        ? WeightTypeLabel[exercise.weightType]
        : '-';
    case 'impact':
      return exercise.impact ? ImpactLabel[exercise.impact] : '-';
    case 'difficulty':
      return exercise.difficulty
        ? DifficultyLabel[exercise.difficulty]
        : '-';
    case 'sistituteGroup':
      return formatOptionalText(exercise.sistituteGroup);
    case 'videoUrl':
      return (
        <Exercise2MediaIcon
          type="video"
          available={hasMediaUrl(exercise.videoUrl)}
          label={t('exercises.videoAvailable')}
        />
      );
    case 'imageUrl':
      return (
        <Exercise2MediaIcon
          type="image"
          available={hasMediaUrl(exercise.imageUrl)}
          label={t('exercises.imageAvailable')}
        />
      );
    case 'name':
      return exercise.name;
    default:
      return '-';
  }
}

export function ExercisesV3List({
  exercises,
  dataLoading,
  readOnly = false,
  onRemoveExercise,
  searchQuery = '',
  totalExerciseCount = 0,
}: ExercisesV3ListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const columnCount = readOnly ? 6 : 7;

  const totalPages = Math.max(1, Math.ceil(exercises.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return exercises.slice(start, start + PAGE_SIZE);
  }, [exercises, page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const rangeStart = exercises.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, exercises.length);

  const showPaginationNav = !dataLoading && exercises.length > 0;
  const showPrevPage = showPaginationNav && safePage > 1;
  const showNextPage = showPaginationNav && safePage < totalPages;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <div className="exercises-list-table-wrap">
      <table className="exercises-list-table list-data-table exercises2-list-table">
        <thead>
          <tr>
            <th scope="col" className="exercises2-list-expand-header" aria-label={t('exercises2.expandRow')} />
            <th scope="col">{t('common.name')}</th>
            <th scope="col">{t('exercises2.category')}</th>
            <th scope="col">{t('exercises2.level')}</th>
            <th scope="col">{t('exercises2.blockType')}</th>
            <th scope="col">{t('exercises.repType')}</th>
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
              <td colSpan={columnCount}>{t('exercises2.loadingList')}</td>
            </tr>
          ) : null}
          {!dataLoading && exercises.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>
                {searchQuery.trim() && totalExerciseCount > 0
                  ? t('exercises.noSearchResults')
                  : t('exercises2.noExercises')}
              </td>
            </tr>
          ) : null}
          {!dataLoading &&
            pageItems.map((exercise) => {
              const isExpanded = expandedIds.has(exercise.id);
              return (
                <React.Fragment key={exercise.id}>
                  <tr
                    className={`exercises2-list-row${isExpanded ? ' is-expanded' : ''}`}
                  >
                    <td className="exercises2-list-expand-cell">
                      <button
                        type="button"
                        className="exercises2-list-expand-btn"
                        aria-expanded={isExpanded}
                        aria-label={t('exercises2.toggleDetails', {
                          name: exercise.name,
                        })}
                        onClick={() => toggleExpanded(exercise.id)}
                      >
                        <svg
                          className={`exercises2-list-expand-icon${isExpanded ? ' is-expanded' : ''}`}
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="currentColor"
                            d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td>{exercise.name}</td>
                    <td>{ExerciseCategoryLabel[exercise.category]}</td>
                    <td>{LevelLabel[exercise.level]}</td>
                    <td>{BlockTypeLabel[exercise.blockType]}</td>
                    <td>{RepTypeLabel[exercise.repType]}</td>
                    {!readOnly ? (
                      <td className="exercises-list-actions-cell">
                        <div className="exercises-list-actions">
                          <button
                            type="button"
                            className="exercises-list-icon-btn exercises-list-icon-btn--edit"
                            aria-label={t('exercises2.editAria', {
                              name: exercise.name,
                            })}
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
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                              />
                            </svg>
                          </button>
                          {onRemoveExercise ? (
                            <button
                              type="button"
                              className="exercises-list-icon-btn exercises-list-icon-btn--remove"
                              aria-label={t('exercises.removeAria', {
                                name: exercise.name,
                              })}
                              title={t('common.remove')}
                              onClick={() => {
                                void (async () => {
                                  if (
                                    !window.confirm(
                                      t('exercises.removeConfirm', {
                                        name: exercise.name,
                                      })
                                    )
                                  ) {
                                    return;
                                  }
                                  try {
                                    await onRemoveExercise(exercise.id);
                                    setExpandedIds((prev) => {
                                      if (!prev.has(exercise.id)) {
                                        return prev;
                                      }
                                      const next = new Set(prev);
                                      next.delete(exercise.id);
                                      return next;
                                    });
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
                    ) : null}
                  </tr>
                  {isExpanded ? (
                    <tr className="exercises2-list-detail-row">
                      <td colSpan={columnCount}>
                        <dl className="exercises2-list-detail">
                          {EXERCISE_V3_DETAIL_PROPS.map((prop) => (
                            <div key={prop} className="exercises2-list-detail-item">
                              <dt>{ExercisePropLabels[prop]}</dt>
                              <dd>{formatExercise2DetailValue(prop, exercise, t)}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>
      </div>

      <div className="exercises-list-pagination">
        <span className="exercises-list-range">
          {dataLoading
            ? t('common.loading')
            : exercises.length === 0
              ? t('exercises2.noExercises')
              : t('common.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: exercises.length,
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
