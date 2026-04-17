import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useRoutines } from '../context/RoutinesContext';
import { RoutinesContextValue } from '../context/RoutinesContext';

export function RoutinesLayout() {
  const {
    routines,
    routineMappings,
    trainingDays,
    trainingBlocks,
    addRoutine,
    updateRoutine,
    removeRoutine,
    upsertRoutineMapping,
    removeRoutineMapping,
    dataLoading,
    dataError,
  } = useRoutines();

  const outletContext: RoutinesContextValue = useMemo(
    () => ({
      routines,
      routineMappings,
      trainingDays,
      trainingBlocks,
      addRoutine,
      updateRoutine,
      removeRoutine,
      upsertRoutineMapping,
      removeRoutineMapping,
      dataLoading,
      dataError,
    }),
    [
      routines,
      routineMappings,
      trainingDays,
      trainingBlocks,
      addRoutine,
      updateRoutine,
      removeRoutine,
      upsertRoutineMapping,
      removeRoutineMapping,
      dataLoading,
      dataError,
    ]
  );

  return <Outlet context={outletContext} />;
}
