import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function UploadTrayIcon() {
  return (
    <svg
      className="exercise-form-dropzone__upload-icon"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 4h14v2H5v-2z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="exercise-form-media-clear__icon"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

type ExerciseMediaDropZoneProps = {
  id: string;
  inputKey: number;
  accept: string;
  fieldLabel: string;
  hintLine: string;
  clearLabel: string;
  valueFile: File | null;
  /** Display name when an existing remote file is present and no new file chosen */
  savedDisplayName: string;
  onPickFile: (file: File | null) => void;
  onClear: () => void;
  showClear: boolean;
  replaceHint?: string;
};

export function ExerciseMediaDropZone({
  id,
  inputKey,
  accept,
  fieldLabel,
  hintLine,
  clearLabel,
  valueFile,
  savedDisplayName,
  onPickFile,
  onClear,
  showClear,
  replaceHint,
}: ExerciseMediaDropZoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const displayName = valueFile?.name ?? savedDisplayName;
  const hasFileLabel = Boolean(displayName.trim());

  const endDrag = useCallback(() => {
    dragDepth.current = 0;
    setIsDragging(false);
  }, []);

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      endDrag();
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    endDrag();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onPickFile(file);
    }
  };

  const hintId = `${id}-hint`;

  return (
    <div className="exercise-form-field exercise-form-field--media">
      <span className="exercise-form-field-label" id={`${id}-label`}>
        {fieldLabel}
      </span>
      <div className="exercise-form-media-row">
        <div className="exercise-form-drop-wrap">
          <input
            key={inputKey}
            id={id}
            type="file"
            accept={accept}
            className="exercise-form-sr-only"
            aria-labelledby={`${id}-label`}
            aria-describedby={hintId}
            onChange={(e) => {
              const file = e.target.files?.[0];
              onPickFile(file ?? null);
            }}
          />
          <label
            htmlFor={id}
            className={
              isDragging
                ? 'exercise-form-dropzone exercise-form-dropzone--drag'
                : 'exercise-form-dropzone'
            }
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <span className="exercise-form-dropzone__icon-circle" aria-hidden>
              <UploadTrayIcon />
            </span>
            <span className="exercise-form-dropzone__title">
              {hasFileLabel ? displayName : t('exercises.dropOrClick')}
            </span>
            <span id={hintId} className="exercise-form-dropzone__hint">
              {hintLine}
            </span>
          </label>
        </div>
        {showClear ? (
          <button
            type="button"
            className="exercise-form-media-clear-btn"
            onClick={onClear}
            aria-label={clearLabel}
            title={clearLabel}
          >
            <TrashIcon />
          </button>
        ) : null}
      </div>
      {replaceHint ? (
        <p className="exercise-form-hint">{replaceHint}</p>
      ) : null}
    </div>
  );
}
