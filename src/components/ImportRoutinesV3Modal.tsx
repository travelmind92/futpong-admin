import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import { parseRoutinesV3Csv, RoutineV3ImportPayload } from '../utils/parseRoutinesV3Csv';
import { downloadTextFile } from '../utils/downloadTextFile';
import {
  RUTINA_V3_IMPORT_TEMPLATE,
  RUTINA_V3_IMPORT_TEMPLATE_FILENAME,
} from '../templates/rutinaV3ImportTemplate';
import { Exercise_V3, Routine_V3 } from '../types/types';

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

type ImportRoutinesV3ModalProps = {
  open: boolean;
  existingRoutines: Routine_V3[];
  existingExercises: Exercise_V3[];
  onImport: (payload: RoutineV3ImportPayload) => Promise<void>;
  onClose: () => void;
};

export function ImportRoutinesV3Modal({
  open,
  existingRoutines,
  existingExercises,
  onImport,
  onClose,
}: ImportRoutinesV3ModalProps) {
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
    downloadTextFile(RUTINA_V3_IMPORT_TEMPLATE, RUTINA_V3_IMPORT_TEMPLATE_FILENAME);
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
      setImportError(t('routines2.importReadFailed'));
      return;
    }

    const parsed = parseRoutinesV3Csv(text, existingRoutines, existingExercises);
    if (!parsed.ok) {
      setFileError(
        t(`routines2.importErrors.${parsed.error}`) +
          (parsed.data ? ` (${parsed.data})` : '')
      );
      return;
    }

    setIsImporting(true);
    try {
      await onImport(parsed.payload);
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('routines2.importFailed');
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
        aria-labelledby="import-routines-v3-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="blocks-modal-header">
          <h2 id="import-routines-v3-modal-title" className="blocks-modal-title">
            {t('routines2.importModalTitle')}
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

          <p className="import-routines-valid-values__intro">
            {t('routines2.importCsvHint')}
          </p>

          <ExerciseMediaDropZone
            id={fileInputId}
            inputKey={fileInputKey}
            accept={CSV_ACCEPT}
            fieldLabel={t('routines2.importCsvLabel')}
            clearLabel={t('routines2.clearCsv')}
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
                setFileError(t('routines2.importCsvInvalid'));
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
            {t('routines2.downloadTemplate')}
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
              ? t('routines2.importing')
              : t('routines2.importRoutine')}
          </button>
        </div>
      </div>
    </div>
  );
}
