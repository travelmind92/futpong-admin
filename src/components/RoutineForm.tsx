import React, {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Place,
  PlayerType,
  Routine,
  RoutineType,
  TrainingBlock,
  TrainingDay,
} from '../types';
import { useExercises } from '../context/ExercisesContext';
import {
  BlocksModal,
  hydrateBlocksForModal,
  isLocalExerciseRowComplete,
  LocalTrainingBlock,
  normalizeBlocksForSave,
} from './BlocksModal';
import { RoutinesContextValue } from '../context/RoutinesContext';

const playerTypeOptions = Object.values(PlayerType);
const placeOptions = Object.values(Place);
const routineTypeOptions = Object.values(RoutineType);

const DAYS_PAGE_SIZE = 10;

const MATCHDAY_OPTIONS = ['+1', '+2', '+3', '-2', '-1'] as const;

type DraftTrainingDay = {
  id: string;
  /** Persisted `TrainingDay.id` when editing an existing day row */
  serverDayId?: string;
  status: 'draft' | 'saved';
  /** Empty string while the field is cleared; required before saving the row. */
  day: number | '';
  matchday: string;
};

function matchdayForDay(day: number): string {
  if (!Number.isFinite(day) || day < 1) {
    return '+1';
  }
  const r = (day - 1) % 5;
  return ['+1', '+2', '+3', '-2', '-1'][r];
}

function maxExistingDay(days: DraftTrainingDay[]): number {
  let max = 0;
  for (const d of days) {
    if (typeof d.day === 'number' && Number.isFinite(d.day)) {
      max = Math.max(max, d.day);
    }
  }
  return max;
}

function nextFreeDayNumber(days: DraftTrainingDay[]): number {
  return maxExistingDay(days) + 1;
}

function defaultDayLabel(dayNum: number): string {
  return `Día ${dayNum}`;
}

function defaultNewDay(existing: DraftTrainingDay[]): DraftTrainingDay {
  const next = nextFreeDayNumber(existing);
  return {
    id: uuidv4(),
    status: 'draft',
    day: next,
    matchday: matchdayForDay(next),
  };
}

function parseDayInput(raw: string): number | '' {
  const v = raw.trim();
  if (v === '') {
    return '';
  }
  if (!/^\d+$/.test(v)) {
    return '';
  }
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) {
    return '';
  }
  return n;
}

function trainingBlocksToLocal(blocks: TrainingBlock[]): LocalTrainingBlock[] {
  if (blocks.length === 0) {
    return [];
  }
  return [...blocks]
    .sort((a, b) => a.index - b.index)
    .map((tb) => ({
      id: tb.id,
      index: tb.index,
      name: tb.name,
      series: tb.series,
      exercises: [...(tb.exercises ?? [])]
        .sort((a, b) => a.index - b.index)
        .map((ex) => ({
          id: `${tb.id}-ex-${ex.index}`,
          index: ex.index,
          exerciseId: ex.exerciseId,
          reps: ex.reps,
          exerciseSearchDraft: null,
        })),
    }));
}

export function RoutineForm() {
  const { id: editRoutineId } = useParams();
  const isEdit = Boolean(editRoutineId);

  const {
    addRoutine,
    updateRoutine,
    routines,
    trainingDays: allTrainingDays,
    trainingBlocks: allTrainingBlocks,
    dataLoading: routinesDataLoading,
  } = useOutletContext<RoutinesContextValue>();
  const { exercises: exerciseCatalog } = useExercises();
  const navigate = useNavigate();

  const nameId = useId();
  const playerTypeId = useId();
  const placeId = useId();
  const routineTypeId = useId();

  const [name, setName] = useState('');
  const [playerType, setPlayerType] = useState<PlayerType>(PlayerType.CHILDREN);
  const [place, setPlace] = useState<Place>(Place.GYM);
  const [routineType, setRoutineType] = useState<RoutineType>(
    RoutineType.COMPETENCE
  );

  const [trainingDays, setTrainingDays] = useState<DraftTrainingDay[]>([]);
  const [daysPage, setDaysPage] = useState(1);
  const [routineNameDuplicateError, setRoutineNameDuplicateError] =
    useState('');
  const [routineBlocksSubmitError, setRoutineBlocksSubmitError] =
    useState('');
  const [routineSaveInProgress, setRoutineSaveInProgress] = useState(false);
  const [dayNumberErrors, setDayNumberErrors] = useState<
    Record<string, string>
  >({});
  const [blocksByDayRowId, setBlocksByDayRowId] = useState<
    Record<string, LocalTrainingBlock[]>
  >({});
  const [blocksModalDayRowId, setBlocksModalDayRowId] = useState<
    string | null
  >(null);
  const [blocksModalDraft, setBlocksModalDraft] = useState<
    LocalTrainingBlock[]
  >([]);
  const blocksModalDayRowIdRef = useRef<string | null>(null);
  blocksModalDayRowIdRef.current = blocksModalDayRowId;

  useEffect(() => {
    if (isEdit) {
      return;
    }
    setName('');
    setPlayerType(PlayerType.CHILDREN);
    setPlace(Place.GYM);
    setRoutineType(RoutineType.COMPETENCE);
    setTrainingDays([]);
    setDaysPage(1);
    setRoutineNameDuplicateError('');
    setRoutineBlocksSubmitError('');
    setDayNumberErrors({});
    setBlocksByDayRowId({});
    setBlocksModalDayRowId(null);
    setBlocksModalDraft([]);
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !editRoutineId) {
      return;
    }
    const routine = routines.find((r) => r.id === editRoutineId);
    if (!routine) {
      navigate('..', { replace: true });
      return;
    }
    setName(routine.name);
    setPlayerType(routine.playerType);
    setPlace(routine.place);
    setRoutineType(routine.type);
    if (routinesDataLoading) {
      return;
    }
    const loaded: DraftTrainingDay[] = allTrainingDays
      .filter((td) => td.routineId === editRoutineId)
      .sort((a, b) => a.day - b.day)
      .map((td) => ({
        id: td.id,
        serverDayId: td.id,
        status: 'saved',
        day: td.day,
        matchday: td.matchday,
      }));
    setTrainingDays(loaded);
    setDaysPage(1);
    setRoutineNameDuplicateError('');
    setRoutineBlocksSubmitError('');
    setDayNumberErrors({});
    const blocksByDay: Record<string, LocalTrainingBlock[]> = {};
    for (const row of loaded) {
      const forDay = allTrainingBlocks.filter(
        (tb) => tb.trainingDayId === row.id
      );
      blocksByDay[row.id] = hydrateBlocksForModal(
        trainingBlocksToLocal(forDay)
      );
    }
    setBlocksByDayRowId(blocksByDay);
    setBlocksModalDayRowId(null);
    setBlocksModalDraft([]);
    // Re-run when async routine-related data finishes loading; omit day/block arrays from deps to avoid resetting the form when other routines change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editRoutineId, navigate, routinesDataLoading]);

  const hasDraftDayRow = trainingDays.some((row) => row.status === 'draft');

  const blocksModalTitle = useMemo(() => {
    if (!blocksModalDayRowId) {
      return '';
    }
    const row = trainingDays.find((r) => r.id === blocksModalDayRowId);
    const n = row && typeof row.day === 'number' ? row.day : '—';
    return `Day ${n} - Blocks`;
  }, [blocksModalDayRowId, trainingDays]);

  const daysTotalPages = Math.max(
    1,
    Math.ceil(trainingDays.length / DAYS_PAGE_SIZE)
  );
  const daysSafePage = Math.min(daysPage, daysTotalPages);

  const daysPageItems = useMemo(() => {
    const start = (daysSafePage - 1) * DAYS_PAGE_SIZE;
    return trainingDays.slice(start, start + DAYS_PAGE_SIZE);
  }, [trainingDays, daysSafePage]);

  const daysRangeStart =
    trainingDays.length === 0
      ? 0
      : (daysSafePage - 1) * DAYS_PAGE_SIZE + 1;
  const daysRangeEnd = Math.min(
    daysSafePage * DAYS_PAGE_SIZE,
    trainingDays.length
  );

  const showDaysPrev =
    trainingDays.length > 0 && daysSafePage > 1;
  const showDaysNext =
    trainingDays.length > 0 && daysSafePage < daysTotalPages;

  const addTrainingDay = () => {
    setTrainingDays((prev) => [defaultNewDay(prev), ...prev]);
    setDaysPage(1);
  };

  const updateTrainingDay = (
    id: string,
    patch: Partial<Pick<DraftTrainingDay, 'day' | 'matchday'>>
  ) => {
    setTrainingDays((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
    if ('day' in patch) {
      setDayNumberErrors((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const saveDayRow = (id: string) => {
    const row = trainingDays.find((r) => r.id === id);
    if (!row || row.status !== 'draft') {
      return;
    }

    const dayInvalid =
      typeof row.day !== 'number' || !Number.isFinite(row.day) || row.day < 1;

    if (dayInvalid) {
      setDayNumberErrors((prev) => ({
        ...prev,
        [id]: 'This field is required.',
      }));
      return;
    }

    setDayNumberErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setTrainingDays((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'saved' as const } : r
      )
    );
  };

  const editSavedDayRow = (id: string) => {
    setTrainingDays((prev) =>
      prev.map((r) =>
        r.id === id && r.status === 'saved'
          ? { ...r, status: 'draft' as const }
          : r
      )
    );
  };

  const openBlocksModal = (rowId: string) => {
    setRoutineBlocksSubmitError('');
    setBlocksModalDayRowId(rowId);
    setBlocksModalDraft(
      hydrateBlocksForModal(blocksByDayRowId[rowId] ?? [])
    );
  };

  const cancelBlocksModal = () => {
    setBlocksModalDayRowId(null);
    setBlocksModalDraft([]);
  };

  const saveBlocksModal = () => {
    if (!blocksModalDayRowId) {
      return;
    }
    setBlocksByDayRowId((prev) => ({
      ...prev,
      [blocksModalDayRowId]: normalizeBlocksForSave(
        blocksModalDraft,
        exerciseCatalog
      ),
    }));
    setBlocksModalDayRowId(null);
    setBlocksModalDraft([]);
    setRoutineBlocksSubmitError('');
  };

  const removeDayRow = (id: string) => {
    setTrainingDays((prev) => prev.filter((row) => row.id !== id));
    setBlocksByDayRowId((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (blocksModalDayRowIdRef.current === id) {
      setBlocksModalDayRowId(null);
      setBlocksModalDraft([]);
    }
    setDayNumberErrors((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || hasDraftDayRow) {
      return;
    }
    setRoutineBlocksSubmitError('');

    const nameTaken = routines.some((r) =>
      isEdit && editRoutineId
        ? r.id !== editRoutineId && r.name.trim() === trimmedName
        : r.name.trim() === trimmedName
    );
    if (nameTaken) {
      setRoutineNameDuplicateError(
        'A routine with this name already exists. Choose a different name.'
      );
      return;
    }
    setRoutineNameDuplicateError('');

    const savedRows = trainingDays.filter((row) => row.status === 'saved');
    for (const row of savedRows) {
      if (typeof row.day !== 'number' || row.day < 1) {
        return;
      }
    }

    const effectiveBlocksForDay = (rowId: string): LocalTrainingBlock[] => {
      if (blocksModalDayRowId === rowId) {
        return blocksModalDraft;
      }
      return blocksByDayRowId[rowId] ?? [];
    };

    const isBlank = (v: string | undefined | null) =>
      !(v ?? '').trim();

    for (const row of savedRows) {
      const list = effectiveBlocksForDay(row.id);
      for (const b of list) {
        if (isBlank(b.name) || isBlank(b.series)) {
          const d = typeof row.day === 'number' ? row.day : '—';
          setRoutineBlocksSubmitError(
            `Each training block must have a name and a series. Complete or remove incomplete blocks for day ${d}.`
          );
          return;
        }
        for (const ex of b.exercises ?? []) {
          if (!isLocalExerciseRowComplete(ex, exerciseCatalog)) {
            const d = typeof row.day === 'number' ? row.day : '—';
            setRoutineBlocksSubmitError(
              `Each exercise in a block must have an exercise and reps. Complete or remove incomplete rows for day ${d}.`
            );
            return;
          }
        }
      }
    }

    const routineId = isEdit && editRoutineId ? editRoutineId : uuidv4();
    const routine: Routine = {
      id: routineId,
      name: trimmedName,
      playerType,
      place,
      type: routineType,
    };

    const days: TrainingDay[] = savedRows
      .slice()
      .sort((a, b) => (a.day as number) - (b.day as number))
      .map((row) => ({
        id: row.serverDayId ?? row.id,
        routineId,
        day: row.day as number,
        name: defaultDayLabel(row.day as number),
        matchday: row.matchday,
      }));

    const persistedTrainingBlocks: TrainingBlock[] = [];
    for (const row of savedRows
      .slice()
      .sort((a, b) => (a.day as number) - (b.day as number))) {
      const dayId = row.serverDayId ?? row.id;
      const list = effectiveBlocksForDay(row.id);
      const normalized = normalizeBlocksForSave(list, exerciseCatalog);
      for (const b of normalized) {
        persistedTrainingBlocks.push({
          id: b.id,
          trainingDayId: dayId,
          index: b.index,
          name: b.name.trim(),
          series: b.series.trim(),
          exercises: (b.exercises ?? []).map((ex) => ({
            index: ex.index,
            exerciseId: ex.exerciseId.trim(),
            reps: (ex.reps ?? '').trim(),
          })),
        });
      }
    }

    setRoutineSaveInProgress(true);
    try {
      if (isEdit && editRoutineId) {
        await updateRoutine(routine, days, persistedTrainingBlocks);
      } else {
        await addRoutine(routine, days, persistedTrainingBlocks);
      }
      navigate('..');
    } catch (err) {
      setRoutineBlocksSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not save the routine. Please try again.'
      );
    } finally {
      setRoutineSaveInProgress(false);
    }
  };

  return (
    <div className="app-panel exercise-form-panel">
      <h2 className="exercise-form-title">
        {isEdit ? 'Edit routine' : 'New routine'}
      </h2>
      <form className="exercise-form routine-form" onSubmit={handleSubmit}>
        <div className="exercise-form-field">
          <label htmlFor={nameId}>Name</label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setRoutineNameDuplicateError('');
              setRoutineBlocksSubmitError('');
            }}
            autoComplete="off"
            required
            aria-invalid={routineNameDuplicateError ? true : undefined}
            aria-describedby={
              routineNameDuplicateError ? `${nameId}-error` : undefined
            }
          />
          {routineNameDuplicateError ? (
            <p
              id={`${nameId}-error`}
              className="exercise-form-error"
              role="alert"
            >
              {routineNameDuplicateError}
            </p>
          ) : null}
        </div>

        <div className="routine-form-selects-row">
          <div className="exercise-form-field routine-form-meta-field">
            <label htmlFor={playerTypeId}>Player type</label>
            <select
              id={playerTypeId}
              value={playerType}
              onChange={(e) => setPlayerType(e.target.value as PlayerType)}
            >
              {playerTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="exercise-form-field routine-form-meta-field">
            <label htmlFor={placeId}>Place</label>
            <select
              id={placeId}
              value={place}
              onChange={(e) => setPlace(e.target.value as Place)}
            >
              {placeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="exercise-form-field routine-form-meta-field">
            <label htmlFor={routineTypeId}>Routine type</label>
            <select
              id={routineTypeId}
              value={routineType}
              onChange={(e) =>
                setRoutineType(e.target.value as RoutineType)
              }
            >
              {routineTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section
          className="exercises-list routine-form-days"
          aria-labelledby="routine-form-days-heading"
        >
          <div className="exercises-list-toolbar">
            <h3 id="routine-form-days-heading" className="exercises-list-title">
              Days
            </h3>
            <button
              type="button"
              className="exercises-list-create"
              onClick={addTrainingDay}
              disabled={hasDraftDayRow}
              title={
                hasDraftDayRow
                  ? 'Save or remove the day row being edited before adding another'
                  : undefined
              }
            >
              Create
            </button>
          </div>

          <div className="exercises-list-table-wrap">
            <table className="exercises-list-table list-data-table">
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Matchday</th>
                  <th scope="col">Blocks</th>
                  <th
                    scope="col"
                    className="exercises-list-actions-header"
                    aria-label="Actions"
                  />
                </tr>
              </thead>
              <tbody>
                {daysPageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="routine-form-days-empty">
                      No days yet. Use Create to add a row.
                    </td>
                  </tr>
                ) : (
                  daysPageItems.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.status === 'saved' ? (
                          <span className="routine-form-days-static">
                            {row.day}
                          </span>
                        ) : (
                          <div className="routine-form-days-day-field">
                            <input
                              id={`day-num-${row.id}`}
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              className="routine-form-days-input routine-form-days-input--num"
                              value={
                                row.day === '' ? '' : String(row.day)
                              }
                              onChange={(e) => {
                                const parsed = parseDayInput(e.target.value);
                                if (parsed === '') {
                                  updateTrainingDay(row.id, {
                                    day: '',
                                  });
                                  return;
                                }
                                updateTrainingDay(row.id, {
                                  day: parsed,
                                  matchday: matchdayForDay(parsed),
                                });
                              }}
                              aria-label="Day number"
                              aria-required="true"
                              aria-invalid={
                                dayNumberErrors[row.id]
                                  ? true
                                  : undefined
                              }
                              aria-describedby={
                                dayNumberErrors[row.id]
                                  ? `day-num-${row.id}-error`
                                  : undefined
                              }
                            />
                            {dayNumberErrors[row.id] ? (
                              <p
                                id={`day-num-${row.id}-error`}
                                className="exercise-form-error routine-form-days-day-error"
                                role="alert"
                              >
                                {dayNumberErrors[row.id]}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td>
                        {row.status === 'saved' ? (
                          <span className="routine-form-days-static">
                            {row.matchday}
                          </span>
                        ) : (
                          <select
                            id={`day-md-${row.id}`}
                            className="routine-form-days-select routine-form-days-select--narrow"
                            value={row.matchday}
                            onChange={(e) =>
                              updateTrainingDay(row.id, {
                                matchday: e.target.value,
                              })
                            }
                            aria-label="Matchday"
                          >
                            {MATCHDAY_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="routine-form-days-blocks-btn"
                          onClick={() => openBlocksModal(row.id)}
                        >
                          {`${blocksByDayRowId[row.id]?.length ?? 0} Blocks`}
                        </button>
                      </td>
                      <td className="exercises-list-actions-cell">
                        <div className="exercises-list-actions">
                          {row.status === 'draft' ? (
                            <>
                              <button
                                type="button"
                                className="routine-form-day-save"
                                onClick={() => saveDayRow(row.id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="routine-form-day-remove"
                                aria-label="Remove draft day row"
                                title="Remove row"
                                onClick={() => removeDayRow(row.id)}
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
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="exercises-list-icon-btn exercises-list-icon-btn--edit routine-form-days-icon-btn"
                                aria-label="Edit day row"
                                title={
                                  hasDraftDayRow
                                    ? 'Finish editing the day row in progress first'
                                    : 'Edit'
                                }
                                disabled={hasDraftDayRow}
                                onClick={() => editSavedDayRow(row.id)}
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
                                aria-label="Remove day row"
                                title="Remove"
                                onClick={() => removeDayRow(row.id)}
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="exercises-list-pagination">
            <span className="exercises-list-range">
              {trainingDays.length === 0
                ? 'No days'
                : `Showing ${daysRangeStart}–${daysRangeEnd} of ${trainingDays.length}`}
            </span>
            <div className="exercises-list-page-actions">
              {showDaysPrev ? (
                <button
                  type="button"
                  className="exercises-list-page-btn"
                  onClick={() => setDaysPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  Previous
                </button>
              ) : null}
              <span className="exercises-list-page-indicator">
                Page {daysSafePage} of {daysTotalPages}
              </span>
              {showDaysNext ? (
                <button
                  type="button"
                  className="exercises-list-page-btn"
                  onClick={() =>
                    setDaysPage((p) => Math.min(daysTotalPages, p + 1))
                  }
                  aria-label="Next page"
                >
                  Next
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {hasDraftDayRow ? (
          <p className="routine-form-submit-hint" role="status">
            Save each day row or remove draft rows you do not need before{' '}
            {isEdit ? 'saving' : 'creating'} the routine.
          </p>
        ) : null}

        {routineBlocksSubmitError ? (
          <p className="exercise-form-error" role="alert">
            {routineBlocksSubmitError}
          </p>
        ) : null}

        <div className="exercise-form-actions">
          <button
            type="button"
            className="exercise-form-cancel"
            onClick={() => navigate('..')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="exercise-form-submit"
            disabled={hasDraftDayRow || routineSaveInProgress}
            title={
              hasDraftDayRow
                ? 'Save all day rows before submitting'
                : routineSaveInProgress
                  ? 'Saving…'
                  : undefined
            }
          >
            {routineSaveInProgress
              ? 'Saving…'
              : isEdit
                ? 'Save'
                : 'Create'}
          </button>
        </div>
      </form>

      <BlocksModal
        open={blocksModalDayRowId !== null}
        title={blocksModalTitle}
        blocks={blocksModalDraft}
        exercises={exerciseCatalog}
        onChange={setBlocksModalDraft}
        onSave={saveBlocksModal}
        onCancel={cancelBlocksModal}
      />
    </div>
  );
}
