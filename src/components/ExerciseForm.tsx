import React, {
  FormEvent,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Exercise, RepType } from '../types';
import { ExercisesContextValue } from '../context/ExercisesContext';
import { ServicesContext } from '../context/servicesOutletContext';
import { getS3MediaBucket } from '../services/awsConfig';
import {
  deleteExerciseMediaFromS3,
  toS3ObjectKey,
  uploadExerciseMediaToS3,
} from '../services/s3/uploadExerciseMedia';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';

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
  const { id: editId } = useParams();
  const isEdit = editId != null;

  const services = useContext(ServicesContext);
  const s3Client = services?.s3Client;

  const { exercises, addExercise, updateExercise, dataError } =
    useOutletContext<ExercisesContextValue>();
  const navigate = useNavigate();
  const nameId = useId();
  const descId = useId();
  const repId = useId();
  const videoId = useId();
  const imageId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repType, setRepType] = useState<RepType>(RepType.REPETITIONS);
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
  useEffect(() => {
    if (!isEdit) {
      setName('');
      setDescription('');
      setRepType(RepType.REPETITIONS);
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
      setValidationError('Please enter a name.');
      return;
    }
    if (!trimmedDescription) {
      setValidationError(
        'Please enter a description (spaces alone are not enough).'
      );
      return;
    }
    setValidationError('');

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

    const existingExercise =
      isEdit && editId ? exercises.find((e) => e.id === editId) : undefined;
    if (isEdit && editId && !existingExercise) {
      navigate('..', { replace: true });
      return;
    }
    const needsUpload = videoFile != null || imageFile != null;
    const mightDeleteMedia =
      isEdit &&
      ((removeVideoOnSave &&
        Boolean(existingExercise?.videoUrl?.trim())) ||
        (removeThumbnailOnSave &&
          Boolean(existingExercise?.thumbnailUrl?.trim())));
    if (needsUpload || mightDeleteMedia) {
      if (!s3Client) {
        setMediaError('Storage is not ready. Try again in a moment.');
        return;
      }
      if (!getS3MediaBucket()) {
        setMediaError(
          'Media uploads require REACT_APP_S3_MEDIA_BUCKET in your environment.'
        );
        return;
      }
    }
    setMediaError('');
    setSaveError('');

    const exerciseId = isEdit && editId ? editId : uuidv4();
    const bucket = getS3MediaBucket();

    setIsSaving(true);
    try {
      let uploadedVideoUrl: string | undefined;
      let uploadedThumbnailUrl: string | undefined;

      if (needsUpload && s3Client && bucket) {
        if (videoFile != null) {
          uploadedVideoUrl = await uploadExerciseMediaToS3(s3Client, {
            bucket,
            exerciseId,
            kind: 'video',
            file: videoFile,
          });
        }
        if (imageFile != null) {
          uploadedThumbnailUrl = await uploadExerciseMediaToS3(s3Client, {
            bucket,
            exerciseId,
            kind: 'thumbnail',
            file: imageFile,
          });
        }
      }

      const resolvedVideoUrl =
        videoFile != null
          ? uploadedVideoUrl!
          : isEdit
            ? removeVideoOnSave || priorVideoUrl.trim() === ''
              ? undefined
              : priorVideoUrl.trim()
            : undefined;

      const resolvedThumbnailUrl =
        imageFile != null
          ? uploadedThumbnailUrl!
          : isEdit
            ? removeThumbnailOnSave || priorThumbnailUrl.trim() === ''
              ? undefined
              : priorThumbnailUrl.trim()
            : undefined;

      if (isEdit && editId && existingExercise) {
        const existing = existingExercise;
        const next: Exercise = {
          ...existing,
          id: editId,
          name: trimmedName,
          description: trimmedDescription,
          repType,
        };
        delete next.videoUrl;
        delete next.thumbnailUrl;
        if (resolvedVideoUrl !== undefined) {
          next.videoUrl = resolvedVideoUrl;
        }
        if (resolvedThumbnailUrl !== undefined) {
          next.thumbnailUrl = resolvedThumbnailUrl;
        }
        await updateExercise(next);

        const keysToDelete: string[] = [];
        const previousVideoKey = toS3ObjectKey(existing.videoUrl);
        const nextVideoKey = toS3ObjectKey(next.videoUrl);
        if (previousVideoKey && previousVideoKey !== nextVideoKey) {
          keysToDelete.push(previousVideoKey);
        }
        const previousThumbnailKey = toS3ObjectKey(existing.thumbnailUrl);
        const nextThumbnailKey = toS3ObjectKey(next.thumbnailUrl);
        if (previousThumbnailKey && previousThumbnailKey !== nextThumbnailKey) {
          keysToDelete.push(previousThumbnailKey);
        }
        if (keysToDelete.length > 0 && s3Client && bucket) {
          const uniqueKeys = keysToDelete.filter(
            (key, idx, arr) => arr.indexOf(key) === idx
          );
          for (let i = 0; i < uniqueKeys.length; i += 1) {
            await deleteExerciseMediaFromS3(s3Client, {
              bucket,
              key: uniqueKeys[i],
            });
          }
        }
      } else {
        await addExercise({
          id: exerciseId,
          name: trimmedName,
          description: trimmedDescription,
          repType,
          ...(resolvedVideoUrl !== undefined ? { videoUrl: resolvedVideoUrl } : {}),
          ...(resolvedThumbnailUrl !== undefined
            ? { thumbnailUrl: resolvedThumbnailUrl }
            : {}),
        });
      }
      navigate('..', { replace: false });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Save failed. Check the console for details.';
      setSaveError(msg);
      console.error(err);
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
              err instanceof Error ? err.message : 'Save failed unexpectedly.'
            );
          });
        }}
      >
        <div className="exercise-form-field">
          <label htmlFor={nameId}>Name</label>
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
          <label htmlFor={descId}>Description</label>
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

        <ExerciseMediaDropZone
          id={videoId}
          inputKey={videoInputKey}
          accept="video/*"
          fieldLabel="Video (optional)"
          clearLabel="Clear video"
          hintLine="MP4, WebM, or MOV — one file"
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
              ? 'Replace: drop or choose a file.'
              : undefined
          }
        />

        <ExerciseMediaDropZone
          id={imageId}
          inputKey={imageInputKey}
          accept={THUMBNAIL_ACCEPT}
          fieldLabel="Thumbnail image (optional)"
          clearLabel="Clear thumbnail"
          hintLine="PNG, JPG, WebP, GIF — one image"
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
              setMediaError(
                'Thumbnail must be one of: PNG, JPG/JPEG, WEBP, GIF, BMP, TIFF, SVG.'
              );
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
              ? 'Replace: drop or choose a file.'
              : undefined
          }
        />

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
