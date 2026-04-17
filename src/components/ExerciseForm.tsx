import React, { FormEvent, useEffect, useId, useState } from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { RepType } from '../types';
import { ExercisesContextValue } from '../context/ExercisesContext';

const repTypeOptions = Object.values(RepType);

function videoNameFromUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return decodeURIComponent(last) || url;
  } catch {
    const parts = url.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return decodeURIComponent(last) || url;
  }
}

export function ExerciseForm() {
  const { id: editId } = useParams();
  const isEdit = editId != null;

  const { exercises, addExercise, updateExercise, dataError } =
    useOutletContext<ExercisesContextValue>();
  const navigate = useNavigate();
  const nameId = useId();
  const descId = useId();
  const repId = useId();
  const videoId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repType, setRepType] = useState<RepType>(RepType.REPETITIONS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [priorVideoUrl, setPriorVideoUrl] = useState('');
  const [nameDuplicateError, setNameDuplicateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selectedVideoLabel =
    videoFile?.name ??
    (isEdit && priorVideoUrl.trim() ? videoNameFromUrl(priorVideoUrl) : '');

  useEffect(() => {
    if (!isEdit) {
      setName('');
      setDescription('');
      setRepType(RepType.REPETITIONS);
      setVideoFile(null);
      setPriorVideoUrl('');
      setNameDuplicateError('');
      return;
    }
    if (!editId) {
      return;
    }

    const existing = exercises.find((e) => e.id === editId);
    if (!existing) {
      navigate('..', { replace: true });
      return;
    }

    setName(existing.name);
    setDescription(existing.description);
    setRepType(existing.repType);
    setVideoFile(null);
    setPriorVideoUrl(existing.videoUrl);
    setNameDuplicateError('');
    // Intentionally omit `exercises` from deps so list updates do not reset the form while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !description.trim()) {
      return;
    }

    if (!isEdit) {
      const taken = exercises.some(
        (ex) => ex.name.trim() === trimmedName
      );
      if (taken) {
        setNameDuplicateError(
          'An exercise with this name already exists. Choose a different name.'
        );
        return;
      }
    }
    setNameDuplicateError('');

    const videoUrl =
      videoFile != null
        ? URL.createObjectURL(videoFile)
        : isEdit
          ? priorVideoUrl
          : '';

    setIsSaving(true);
    try {
      if (isEdit && editId) {
        await updateExercise({
          id: editId,
          name: trimmedName,
          description,
          repType,
          videoUrl,
        });
      } else {
        await addExercise({
          id: uuidv4(),
          name: trimmedName,
          description,
          repType,
          videoUrl,
        });
      }
      navigate('..', { replace: false });
    } catch {
      // `dataError` is set on the context provider
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-panel app-panel--wide exercise-form-panel">
      <h2 className="exercise-form-title">
        {isEdit ? 'Edit exercise' : 'New exercise'}
      </h2>
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      <form className="exercise-form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="exercise-form-field">
          <label htmlFor={nameId}>Name</label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameDuplicateError('');
            }}
            required
            autoComplete="off"
            aria-invalid={nameDuplicateError ? true : undefined}
            aria-describedby={
              nameDuplicateError ? `${nameId}-error` : undefined
            }
          />
          {nameDuplicateError ? (
            <p
              id={`${nameId}-error`}
              className="exercise-form-error"
              role="alert"
            >
              {nameDuplicateError}
            </p>
          ) : null}
        </div>

        <div className="exercise-form-field">
          <label htmlFor={descId}>Description</label>
          <textarea
            id={descId}
            className="exercise-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            required
          />
        </div>

        <div className="exercise-form-field">
          <label htmlFor={repId}>Rep type</label>
          <select
            id={repId}
            value={repType}
            onChange={(e) => setRepType(e.target.value as RepType)}
          >
            {repTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="exercise-form-field">
          <label htmlFor={videoId}>Video</label>
          <input
            id={videoId}
            type="file"
            accept="video/*"
            className="exercise-form-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setVideoFile(file ?? null);
            }}
          />
          {selectedVideoLabel ? (
            <p className="exercise-form-hint">
              Selected file: <strong>{selectedVideoLabel}</strong>
            </p>
          ) : null}
          {isEdit && priorVideoUrl.trim() !== '' && videoFile == null && (
            <p className="exercise-form-hint">
              A video is already attached. Choose a file to replace it.
            </p>
          )}
        </div>

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
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
