import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import {
  parsedRowsToExercises,
  parseExercisesCsv,
} from '../utils/parseExercisesCsv';
import { Exercise } from '../types';

const CSV_ACCEPT = '.csv,text/csv,application/vnd.ms-excel';
const TEMPLATE_URL = `${process.env.PUBLIC_URL}/ejercicios.csv`;

function isCsvFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime === 'text/csv' || mime === 'application/vnd.ms-excel') {
    return true;
  }
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  return file.name.slice(dot).toLowerCase() === '.csv';
}

type ImportExercisesModalProps = {
  open: boolean;
  existingExercises: Exercise[];
  onImport: (exercises: Exercise[]) => Promise<void>;
  onClose: () => void;
};

export function ImportExercisesModal({
  open,
  existingExercises,
  onImport,
  onClose,
}: ImportExercisesModalProps) {
  const { t } = useTranslation();
  const fileInputId = useId();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [fileError, setFileError] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!open) {
    return null;
  }

  const resetAndClose = () => {
    setCsvFile(null);
    setFileInputKey((k) => k + 1);
    setFileError('');
    setImportError('');
    setIsImporting(false);
    onClose();
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = TEMPLATE_URL;
    link.download = 'ejercicios.csv';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImport = async () => {
    if (!csvFile) {
      return;
    }

    setImportError('');
    setFileError('');

    let text: string;
    try {
      text = await csvFile.text();
    } catch {
      setImportError(t('exercises.importReadFailed'));
      return;
    }

    const parsed = parseExercisesCsv(text);
    if (!parsed.ok) {
      setFileError(t(`exercises.importErrors.${parsed.error}`));
      return;
    }

    const exercises = parsedRowsToExercises(parsed.rows, existingExercises);

    setIsImporting(true);
    try {
      await onImport(exercises);
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('exercises.importFailed');
      setImportError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="blocks-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isImporting) {
          resetAndClose();
        }
      }}
    >
      <div
        className="blocks-modal import-exercises-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-exercises-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="import-exercises-modal-title" className="blocks-modal-title">
            {t('exercises.importModalTitle')}
          </h2>
          <button
            type="button"
            className="blocks-modal-close"
            aria-label={t('common.close')}
            disabled={isImporting}
            onClick={resetAndClose}
          >
            ×
          </button>
        </div>

        <div className="blocks-modal-body import-exercises-modal-body">
          {fileError ? (
            <p className="app-data-banner app-data-banner--error" role="alert">
              {fileError}
            </p>
          ) : null}
          {importError ? (
            <p className="app-data-banner app-data-banner--error" role="alert">
              {importError}
            </p>
          ) : null}

          <ExerciseMediaDropZone
            id={fileInputId}
            inputKey={fileInputKey}
            accept={CSV_ACCEPT}
            fieldLabel={t('exercises.importCsvLabel')}
            clearLabel={t('exercises.clearCsv')}
            hintLine={t('exercises.importCsvHint')}
            valueFile={csvFile}
            savedDisplayName=""
            onPickFile={(file) => {
              if (!file) {
                setCsvFile(null);
                return;
              }
              if (!isCsvFile(file)) {
                setCsvFile(null);
                setFileInputKey((k) => k + 1);
                setFileError(t('exercises.importCsvInvalid'));
                return;
              }
              setCsvFile(file);
              setFileError('');
              setImportError('');
            }}
            onClear={() => {
              setCsvFile(null);
              setFileInputKey((k) => k + 1);
              setFileError('');
            }}
            showClear={csvFile != null}
          />
        </div>

        <div className="blocks-modal-footer">
          <button
            type="button"
            className="blocks-modal-btn blocks-modal-btn--secondary"
            disabled={isImporting}
            onClick={handleDownloadTemplate}
          >
            {t('exercises.downloadTemplate')}
          </button>
          <button
            type="button"
            className="blocks-modal-btn blocks-modal-btn--primary"
            disabled={csvFile == null || isImporting}
            onClick={() => {
              void handleImport();
            }}
          >
            {isImporting
              ? t('exercises.importing')
              : t('exercises.importExercises')}
          </button>
        </div>
      </div>
    </div>
  );
}
