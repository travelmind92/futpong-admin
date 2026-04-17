import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { RoutinesList } from '../components/RoutinesList';
import { RoutinesContextValue } from '../context/RoutinesContext';

export function RoutinesListPage() {
  const { routines, dataLoading, dataError } =
    useOutletContext<RoutinesContextValue>();

  return (
    <div className="app-panel app-panel--wide">
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      <RoutinesList routines={routines} dataLoading={dataLoading} />
    </div>
  );
}
