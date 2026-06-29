import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { RoutineMappingsV3List } from '../components/RoutineMappingsV3List';
import { RoutinesV3ContextValue } from './RoutinesV3Layout';

export function MappingsV3ListPage() {
  const {
    routineMappings,
    routines,
    dataLoading,
    dataError,
    updateRoutineMapping,
    createRoutineMapping,
    removeRoutineMapping,
  } = useOutletContext<RoutinesV3ContextValue>();

  return (
    <div className="app-panel app-panel--full">
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}

      <div className="exercises-list exercises2-list">
        <RoutineMappingsV3List
          routineMappings={routineMappings}
          routines={routines}
          dataLoading={dataLoading}
          onUpdateMapping={updateRoutineMapping}
          onCreateMapping={createRoutineMapping}
          onRemoveMapping={removeRoutineMapping}
        />
      </div>
    </div>
  );
}
