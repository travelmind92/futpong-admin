import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExercisesList } from '../components/ExercisesList';
import { ExercisesContextValue } from '../context/ExercisesContext';

export function ExercisesListPage() {
  const { exercises, dataLoading, dataError } =
    useOutletContext<ExercisesContextValue>();

  return (
    <div className="app-panel app-panel--full">
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      <ExercisesList exercises={exercises} dataLoading={dataLoading} />
    </div>
  );
}
