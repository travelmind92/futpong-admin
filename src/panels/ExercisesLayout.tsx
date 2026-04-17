import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useExercises } from '../context/ExercisesContext';
import { ExercisesContextValue } from '../context/ExercisesContext';

export function ExercisesLayout() {
  const {
    exercises,
    addExercise,
    updateExercise,
    removeExercise,
    dataLoading,
    dataError,
  } = useExercises();

  const outletContext: ExercisesContextValue = useMemo(
    () => ({
      exercises,
      addExercise,
      updateExercise,
      removeExercise,
      dataLoading,
      dataError,
    }),
    [
      exercises,
      addExercise,
      updateExercise,
      removeExercise,
      dataLoading,
      dataError,
    ]
  );

  return <Outlet context={outletContext} />;
}
