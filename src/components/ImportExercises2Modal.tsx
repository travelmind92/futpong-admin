import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import {
  parsedRowsToExercises2,
  parseExercises2Csv,
} from '../utils/parseExercises2Csv';
import { downloadTextFile } from '../utils/downloadTextFile';
import { EXERCISES_2_IMPORT_TEMPLATE } from '../templates/exercises2ImportTemplate';
import { Exercise_2 } from '../types/types';

const CSV_ACCEPT = '.csv,text/csv,application/vnd.ms-excel';

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

type ImportExercises2ModalProps = {
  open: boolean;
  existingExercises: Exercise_2[];
  onImport: (exercises: Exercise_2[]) => Promise<void>;
  onClose: () => void;
};

export function ImportExercises2Modal({
  open,
  existingExercises,
  onImport,
  onClose,
}: ImportExercises2ModalProps) {
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
    downloadTextFile(EXERCISES_2_IMPORT_TEMPLATE, 'ejercicios2.csv');
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
      setImportError(t('exercises2.importReadFailed'));
      return;
    }

    const parsed = parseExercises2Csv(text);
    if (!parsed.ok) {
      setFileError(t(`exercises2.importErrors.${parsed.error}`));
      return;
    }

    const exercises = parsedRowsToExercises2(parsed.rows, existingExercises);

    setIsImporting(true);
    try {
      await onImport(exercises);
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('exercises2.importFailed');
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
        aria-labelledby="import-exercises2-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="import-exercises2-modal-title" className="blocks-modal-title">
            {t('exercises2.importModalTitle')}
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
            fieldLabel={t('exercises2.importCsvLabel')}
            clearLabel={t('exercises2.clearCsv')}
            hintLine=""
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
                setFileError(t('exercises2.importCsvInvalid'));
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
            {t('exercises2.downloadTemplate')}
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
              ? t('exercises2.importing')
              : t('exercises2.importExercises')}
          </button>
        </div>
      </div>
    </div>
  );
}
