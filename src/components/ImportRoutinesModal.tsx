import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import { parseRoutinesCsv } from '../utils/parseRoutinesCsv';
import { downloadTextFile } from '../utils/downloadTextFile';
import { ROUTINES_IMPORT_TEMPLATE } from '../templates/routinesImportTemplate';
import { Exercise, Routine, TrainingBlock, TrainingDay } from '../types';

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

type ImportRoutinesModalProps = {
  open: boolean;
  existingRoutines: Routine[];
  existingExercises: Exercise[];
  onImport: (
    routine: Routine,
    days: TrainingDay[],
    blocks: TrainingBlock[]
  ) => Promise<void>;
  onClose: () => void;
};

export function ImportRoutinesModal({
  open,
  existingRoutines,
  existingExercises,
  onImport,
  onClose,
}: ImportRoutinesModalProps) {
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
    downloadTextFile(ROUTINES_IMPORT_TEMPLATE, 'rutina.csv');
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
      setImportError(t('routines.importReadFailed'));
      return;
    }

    const parsed = parseRoutinesCsv(text, existingRoutines, existingExercises);
    if (!parsed.ok) {
      setFileError(t(`routines.importErrors.${parsed.error}`) + (parsed.data ? `(${parsed.data})` : ''));
      return;
    }

    const { routine, days, blocks } = parsed.payload;

    setIsImporting(true);
    try {
      await onImport(routine, days, blocks);
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('routines.importFailed');
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
        aria-labelledby="import-routines-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="import-routines-modal-title" className="blocks-modal-title">
            {t('routines.importModalTitle')}
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
            fieldLabel={t('routines.importCsvLabel')}
            clearLabel={t('routines.clearCsv')}
            hintLine={t('routines.importCsvHint')}
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
                setFileError(t('routines.importCsvInvalid'));
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
            {t('routines.downloadTemplate')}
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
              ? t('routines.importing')
              : t('routines.importRoutine')}
          </button>
        </div>
      </div>
    </div>
  );
}
