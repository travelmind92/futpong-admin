import React, {
  FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Exercise, RepType } from '../types';
import { ExercisesContextValue } from '../context/ExercisesContext';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import { ComboSelectField } from './ComboSelectField';
import { translateRepType } from '../i18n/enumLabels';

const repTypeOptions = Object.values(RepType);
const THUMBNAIL_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml';
const ALLOWED_THUMBNAIL_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
]);
const ALLOWED_THUMBNAIL_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
]);

function assetNameFromUrl(rawUrl: string): string {
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

function isAllowedThumbnailFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime && ALLOWED_THUMBNAIL_MIME.has(mime)) {
    return true;
  }
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  const ext = file.name.slice(dot).toLowerCase();
  return ALLOWED_THUMBNAIL_EXT.has(ext);
}

export function ExerciseForm() {
  const { t } = useTranslation();
  const { id: editId } = useParams();
  const isEdit = editId != null;

  const { exercises, addExercise, updateExercise, dataError } =
    useOutletContext<ExercisesContextValue>();
  const navigate = useNavigate();
  const nameId = useId();
  const descId = useId();
  const repId = useId();
  const equivalenceGroupId = useId();
  const videoId = useId();
  const imageId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repType, setRepType] = useState<RepType>(RepType.REPETITIONS);
  const [equivalenceGroup, setEquivalenceGroup] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [priorVideoUrl, setPriorVideoUrl] = useState('');
  const [priorThumbnailUrl, setPriorThumbnailUrl] = useState('');
  const [removeVideoOnSave, setRemoveVideoOnSave] = useState(false);
  const [removeThumbnailOnSave, setRemoveThumbnailOnSave] = useState(false);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [nameDuplicateError, setNameDuplicateError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const repTypeSelectRef = useRef<HTMLSelectElement>(null);
  const [repTypeControlWidth, setRepTypeControlWidth] = useState<number>();

  const equivalenceGroupOptions = useMemo(() => {
    const values = new Set<string>();
    for (const ex of exercises) {
      const group = ex.equivalenceGroup?.trim();
      if (group) {
        values.add(group);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [exercises]);

  useLayoutEffect(() => {
    const select = repTypeSelectRef.current;
    if (!select) {
      return;
    }

    const syncWidth = () => {
      setRepTypeControlWidth(select.getBoundingClientRect().width);
    };

    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    observer.observe(select);
    return () => observer.disconnect();
  }, [t, repType]);

  useEffect(() => {
    if (!isEdit) {
      setName('');
      setDescription('');
      setRepType(RepType.REPETITIONS);
      setEquivalenceGroup('');
      setVideoFile(null);
      setImageFile(null);
      setPriorVideoUrl('');
      setPriorThumbnailUrl('');
      setRemoveVideoOnSave(false);
      setRemoveThumbnailOnSave(false);
      setVideoInputKey(0);
      setImageInputKey(0);
      setNameDuplicateError('');
      setMediaError('');
      setValidationError('');
      setSaveError('');
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
    setEquivalenceGroup(existing.equivalenceGroup ?? '');
    setVideoFile(null);
    setImageFile(null);
    setPriorVideoUrl(existing.videoUrl ?? '');
    setPriorThumbnailUrl(existing.thumbnailUrl ?? '');
    setRemoveVideoOnSave(false);
    setRemoveThumbnailOnSave(false);
    setNameDuplicateError('');
    setMediaError('');
    setValidationError('');
    setSaveError('');
    // Intentionally omit `exercises` and `navigate` from deps: list updates must not reset the form
    // while editing, and `navigate` is not stable in all router versions (would clear file picks on /new).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setValidationError(t('exercises.validationName'));
      return;
    }
    if (!trimmedDescription) {
      setValidationError(t('exercises.validationDescription'));
      return;
    }
    setValidationError('');

    if (!isEdit) {
      const taken = exercises.some(
        (ex) => ex.name.trim() === trimmedName
      );
      if (taken) {
        setNameDuplicateError(t('exercises.duplicateName'));
        return;
      }
    }
    setNameDuplicateError('');

    const existingExercise =
      isEdit && editId ? exercises.find((e) => e.id === editId) : undefined;
    if (isEdit && editId && !existingExercise) {
      navigate('..', { replace: true });
      return;
    }

    setMediaError('');
    setSaveError('');

    const exerciseId = isEdit && editId ? editId : uuidv4();

    const trimmedEquivalenceGroup = equivalenceGroup.trim();

    const exercise: Exercise = {
      id: exerciseId,
      name: trimmedName,
      description: trimmedDescription,
      repType,
      ...(trimmedEquivalenceGroup
        ? { equivalenceGroup: trimmedEquivalenceGroup }
        : {}),
    };

    if (isEdit) {
      if (!removeVideoOnSave && priorVideoUrl.trim() && videoFile == null) {
        exercise.videoUrl = priorVideoUrl.trim();
      }
      if (
        !removeThumbnailOnSave &&
        priorThumbnailUrl.trim() &&
        imageFile == null
      ) {
        exercise.thumbnailUrl = priorThumbnailUrl.trim();
      }
    }

    const hasMediaChanges =
      videoFile != null ||
      imageFile != null ||
      (isEdit && removeVideoOnSave) ||
      (isEdit && removeThumbnailOnSave);

    const saveInput = {
      exercise,
      ...(hasMediaChanges
        ? {
            media: {
              ...(videoFile != null ? { video: videoFile } : {}),
              ...(imageFile != null ? { thumbnail: imageFile } : {}),
            },
          }
        : {}),
    };

    setIsSaving(true);
    try {
      if (isEdit && editId) {
        await updateExercise(saveInput);
      } else {
        await addExercise(saveInput);
      }
      navigate('..', { replace: false });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t('exercises.saveFailed');
      setSaveError(msg);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-panel app-panel--wide exercise-form-panel">
      <h2 className="exercise-form-title">
        {isEdit ? t('exercises.editExercise') : t('exercises.newExercise')}
      </h2>
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      {mediaError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {mediaError}
        </p>
      ) : null}
      {validationError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {validationError}
        </p>
      ) : null}
      {saveError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {saveError}
        </p>
      ) : null}
      <form
        className="exercise-form"
        noValidate
        onSubmit={(e) => {
          void handleSubmit(e).catch((err) => {
            console.error(err);
            setSaveError(
              err instanceof Error ? err.message : t('exercises.saveFailedUnexpected')
            );
          });
        }}
      >
        <div className="exercise-form-field">
          <label htmlFor={nameId}>{t('common.name')}</label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameDuplicateError('');
              setValidationError('');
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
          <label htmlFor={descId}>{t('common.description')}</label>
          <textarea
            id={descId}
            className="exercise-form-textarea"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setValidationError('');
            }}
            rows={8}
            required
          />
        </div>

        <div className="exercise-form-field">
          <label htmlFor={repId}>{t('exercises.repType')}</label>
          <select
            ref={repTypeSelectRef}
            id={repId}
            value={repType}
            onChange={(e) => setRepType(e.target.value as RepType)}
          >
            {repTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {translateRepType(t, opt)}
              </option>
            ))}
          </select>
        </div>

        <ComboSelectField
          id={equivalenceGroupId}
          label={t('exercises.equivalenceGroupOptional')}
          value={equivalenceGroup}
          options={equivalenceGroupOptions}
          onChange={setEquivalenceGroup}
          controlWidth={repTypeControlWidth}
        />

        <ExerciseMediaDropZone
          id={videoId}
          inputKey={videoInputKey}
          accept="video/*"
          fieldLabel={t('exercises.videoOptional')}
          clearLabel={t('exercises.clearVideo')}
          hintLine={t('exercises.videoHint')}
          valueFile={videoFile}
          savedDisplayName={
            !videoFile && priorVideoUrl.trim()
              ? assetNameFromUrl(priorVideoUrl)
              : ''
          }
          onPickFile={(file) => {
            setVideoFile(file);
            if (file) {
              setRemoveVideoOnSave(false);
            }
            setMediaError('');
          }}
          onClear={() => {
            setVideoFile(null);
            setPriorVideoUrl('');
            setRemoveVideoOnSave(true);
            setVideoInputKey((k) => k + 1);
          }}
          showClear={videoFile != null || priorVideoUrl.trim() !== ''}
          replaceHint={
            isEdit && priorVideoUrl.trim() !== '' && videoFile == null
              ? t('exercises.replaceFile')
              : undefined
          }
        />

        <ExerciseMediaDropZone
          id={imageId}
          inputKey={imageInputKey}
          accept={THUMBNAIL_ACCEPT}
          fieldLabel={t('exercises.thumbnailOptional')}
          clearLabel={t('exercises.clearThumbnail')}
          hintLine={t('exercises.thumbnailHint')}
          valueFile={imageFile}
          savedDisplayName={
            !imageFile && priorThumbnailUrl.trim()
              ? assetNameFromUrl(priorThumbnailUrl)
              : ''
          }
          onPickFile={(file) => {
            if (!file) {
              setImageFile(null);
              return;
            }
            if (!isAllowedThumbnailFile(file)) {
              setImageFile(null);
              setImageInputKey((k) => k + 1);
              setMediaError(t('exercises.thumbnailInvalid'));
              return;
            }
            setImageFile(file);
            setRemoveThumbnailOnSave(false);
            setMediaError('');
          }}
          onClear={() => {
            setImageFile(null);
            setPriorThumbnailUrl('');
            setRemoveThumbnailOnSave(true);
            setImageInputKey((k) => k + 1);
          }}
          showClear={imageFile != null || priorThumbnailUrl.trim() !== ''}
          replaceHint={
            isEdit && priorThumbnailUrl.trim() !== '' && imageFile == null
              ? t('exercises.replaceFile')
              : undefined
          }
        />

        <div className="exercise-form-actions">
          <button
            type="button"
            className="exercise-form-cancel"
            onClick={() => navigate('..')}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="exercise-form-submit"
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
