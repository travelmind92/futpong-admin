import React, { useEffect, useMemo, useState } from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RoutinesV3ContextValue } from '../panels/RoutinesV3Layout';
import {
  AgeLabel,
  BlockTypeLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
} from '../types/labels';
import {
  Exercise_V3,
  TrainingBlock_V3,
  TrainingDay_V3,
} from '../types/types';
import { textContainsSearch } from '../utils/textSearch';

function exerciseNameFor(
  exerciseId: string,
  exerciseById: Map<string, Exercise_V3>
): string {
  return exerciseById.get(exerciseId)?.name ?? exerciseId;
}

type DayAccordionProps = {
  day: TrainingDay_V3;
  blocks: TrainingBlock_V3[];
  exerciseById: Map<string, Exercise_V3>;
  expanded: boolean;
  onToggle: () => void;
};

function DayAccordion({
  day,
  blocks,
  exerciseById,
  expanded,
  onToggle,
}: DayAccordionProps) {
  const { t } = useTranslation();
  const exerciseCount = blocks.reduce(
    (sum, block) => sum + block.exercises.length,
    0
  );

  return (
    <div className={`routine-v3-detail-day${expanded ? ' is-expanded' : ''}`}>
      <button
        type="button"
        className="routine-v3-detail-day-header"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <svg
          className={`routine-v3-detail-day-chevron${expanded ? ' is-expanded' : ''}`}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
        <span className="routine-v3-detail-day-title">
          <span className="routine-v3-detail-day-session">
            {t('routines2.sessionNumber', { session: day.session })}
          </span>
          <span className="routine-v3-detail-day-name">{day.name}</span>
        </span>
        <span className="routine-v3-detail-day-meta">
          {t('routines2.dayMinutes', { minutes: day.minutes })}
          {day.matchday ? (
            <>
              {' · '}
              {t('routines2.matchdayLabel', { matchday: day.matchday })}
            </>
          ) : null}
          {' · '}
          {t('routines.blocksCount', { count: blocks.length })}
          {' · '}
          {t('routines2.exercisesCount', { count: exerciseCount })}
        </span>
      </button>

      {expanded ? (
        <div className="routine-v3-detail-day-body">
          {day.tips && day.tips.length > 0 ? (
            <div className="routine-v3-detail-tips">
              <span className="routine-v3-detail-tips-label">
                {t('routines2.tips')}
              </span>
              <ul className="routine-v3-detail-tips-list">
                {day.tips.map((tip, index) => (
                  <li key={`${day.id}-tip-${index}`}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {blocks.length === 0 ? (
            <p className="routine-v3-detail-empty">{t('routines2.noBlocks')}</p>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="routine-v3-detail-block">
                <div className="routine-v3-detail-block-header">
                  <span className="routine-v3-detail-block-name">
                    {block.index}. {block.name}
                  </span>
                  <span className="routine-v3-detail-block-meta">
                    {BlockTypeLabel[block.blockType]}
                    {' · '}
                    {t('routines2.blockSeries', { series: block.series })}
                  </span>
                </div>
                {block.exercises.length === 0 ? (
                  <p className="routine-v3-detail-empty">
                    {t('routines2.noExercisesInBlock')}
                  </p>
                ) : (
                  <div className="routine-v3-detail-exercises-wrap">
                    <table className="routine-v3-detail-exercises-table list-data-table">
                      <thead>
                        <tr>
                          <th scope="col">{t('routines2.exerciseIndex')}</th>
                          <th scope="col">{t('common.name')}</th>
                          <th scope="col">{t('routines2.exerciseReps')}</th>
                          <th scope="col">{t('routines2.restSeconds')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...block.exercises]
                          .sort((a, b) => a.index - b.index)
                          .map((item) => {
                            const name = exerciseNameFor(
                              item.exerciseId,
                              exerciseById
                            );
                            const unknown =
                              !exerciseById.has(item.exerciseId);
                            return (
                              <tr key={`${block.id}-${item.index}`}>
                                <td>{item.index}</td>
                                <td>
                                  {unknown ? (
                                    <span
                                      className="routine-v3-detail-unknown-exercise"
                                      title={t('routines2.unknownExercise', {
                                        id: item.exerciseId,
                                      })}
                                    >
                                      {name}
                                    </span>
                                  ) : (
                                    name
                                  )}
                                </td>
                                <td>{item.reps}</td>
                                <td>
                                  {item.restSeconds != null
                                    ? `${item.restSeconds}s`
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function RoutineV3DetailPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    routines,
    exercises,
    trainingDays,
    trainingBlocks,
    dataLoading,
    dataError,
  } = useOutletContext<RoutinesV3ContextValue>();

  const [dayFilter, setDayFilter] = useState('');
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set()
  );

  const routine = useMemo(
    () => routines.find((item) => item.id === id),
    [routines, id]
  );

  useEffect(() => {
    if (!id || dataLoading) {
      return;
    }
    if (!routine) {
      navigate('..', { replace: true });
    }
  }, [id, routine, dataLoading, navigate]);

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  );

  const daysForRoutine = useMemo(
    () =>
      trainingDays
        .filter((day) => day.routineId === id)
        .sort((a, b) => a.session - b.session),
    [trainingDays, id]
  );

  const blocksByDayId = useMemo(() => {
    const dayIds = new Set(daysForRoutine.map((day) => day.id));
    const map = new Map<string, TrainingBlock_V3[]>();
    for (const block of trainingBlocks) {
      if (!dayIds.has(block.trainingDayId)) {
        continue;
      }
      const list = map.get(block.trainingDayId) ?? [];
      list.push(block);
      map.set(block.trainingDayId, list);
    }
    for (const blocks of Array.from(map.values())) {
      blocks.sort((a, b) => a.index - b.index);
    }
    return map;
  }, [trainingBlocks, daysForRoutine]);

  const stats = useMemo(() => {
    let blockCount = 0;
    let exerciseCount = 0;
    for (const day of daysForRoutine) {
      const blocks = blocksByDayId.get(day.id) ?? [];
      blockCount += blocks.length;
      for (const block of blocks) {
        exerciseCount += block.exercises.length;
      }
    }
    return {
      dayCount: daysForRoutine.length,
      blockCount,
      exerciseCount,
    };
  }, [daysForRoutine, blocksByDayId]);

  const filteredDays = useMemo(() => {
    const query = dayFilter.trim();
    if (!query) {
      return daysForRoutine;
    }
    return daysForRoutine.filter((day) => {
      if (textContainsSearch(String(day.session), query)) {
        return true;
      }
      if (textContainsSearch(day.name, query)) {
        return true;
      }
      if (day.matchday && textContainsSearch(day.matchday, query)) {
        return true;
      }
      return false;
    });
  }, [daysForRoutine, dayFilter]);

  const toggleDay = (dayId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  if (!routine && !dataLoading) {
    return null;
  }

  return (
    <div className="app-panel app-panel--full exercise-form-panel routine-v3-detail-panel">
      <div className="routine-v3-detail-header">
        <button
          type="button"
          className="routine-v3-detail-back"
          onClick={() => navigate('..')}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
            />
          </svg>
          {t('routines2.backToList')}
        </button>
        <h2 className="exercise-form-title">
          {routine?.name ?? t('routines2.detailTitle')}
        </h2>
      </div>

      {dataLoading ? (
        <p className="app-data-banner">{t('routines2.loadingList')}</p>
      ) : null}

      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}

      {routine ? (
        <>
          <dl className="exercises2-list-detail routine-v3-detail-meta">
            <div className="exercises2-list-detail-item">
              <dt>{t('routines2.age')}</dt>
              <dd>{AgeLabel[routine.age]}</dd>
            </div>
            <div className="exercises2-list-detail-item">
              <dt>{t('routines2.level')}</dt>
              <dd>{LevelLabel[routine.level]}</dd>
            </div>
            <div className="exercises2-list-detail-item">
              <dt>{t('routines2.place')}</dt>
              <dd>{PlaceLabel[routine.place]}</dd>
            </div>
            <div className="exercises2-list-detail-item">
              <dt>{t('routines2.period')}</dt>
              <dd>{PeriodLabel[routine.period]}</dd>
            </div>
          </dl>

          <p className="routine-v3-detail-summary">
            {t('routines2.trainingDaysSummary', {
              days: stats.dayCount,
              blocks: stats.blockCount,
              exercises: stats.exerciseCount,
            })}
          </p>

          <section className="routine-v3-detail-days" aria-labelledby="routine-v3-detail-days-title">
            <div className="routine-v3-detail-days-toolbar">
              <h3 id="routine-v3-detail-days-title" className="routine-v3-detail-days-title">
                {t('routines2.trainingDays')}
              </h3>
              {daysForRoutine.length > 0 ? (
                <label className="routine-v3-detail-days-filter">
                  <span className="exercise-form-sr-only">
                    {t('routines2.filterDaysLabel')}
                  </span>
                  <input
                    type="search"
                    className="routine-v3-detail-days-filter-input"
                    value={dayFilter}
                    onChange={(e) => setDayFilter(e.target.value)}
                    placeholder={t('routines2.filterDaysPlaceholder')}
                    aria-label={t('routines2.filterDaysLabel')}
                  />
                </label>
              ) : null}
            </div>

            {daysForRoutine.length === 0 ? (
              <p className="routine-v3-detail-empty">{t('routines2.noTrainingDays')}</p>
            ) : filteredDays.length === 0 ? (
              <p className="routine-v3-detail-empty">
                {t('routines2.noDayFilterResults')}
              </p>
            ) : (
              <div className="routine-v3-detail-days-list">
                {filteredDays.map((day) => (
                  <DayAccordion
                    key={day.id}
                    day={day}
                    blocks={blocksByDayId.get(day.id) ?? []}
                    exerciseById={exerciseById}
                    expanded={expandedDayIds.has(day.id)}
                    onToggle={() => toggleDay(day.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
