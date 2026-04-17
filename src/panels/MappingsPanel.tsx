import React from 'react';
import { MappingsList } from '../components/MappingsList';
import { useRoutines } from '../context/RoutinesContext';

export function MappingsPanel() {
  const {
    routineMappings,
    routines,
    upsertRoutineMapping,
    removeRoutineMapping,
    dataLoading,
    dataError,
  } = useRoutines();

  return (
    <div className="app-panel app-panel--wide">
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      <MappingsList
        routineMappings={routineMappings}
        routines={routines}
        dataLoading={dataLoading}
        onSaveRow={upsertRoutineMapping}
        onRemoveRow={removeRoutineMapping}
      />
    </div>
  );
}
