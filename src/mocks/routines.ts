import { Place, PlayerType, Routine, RoutineType } from '../types';

const playerTypes = Object.values(PlayerType);
const places = Object.values(Place);
const routineTypes = Object.values(RoutineType);

export const MOCK_ROUTINES: Routine[] = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  return {
    id: `routine-${n}`,
    name: `Routine ${n}`,
    playerType: playerTypes[i % playerTypes.length],
    place: places[i % places.length],
    type: routineTypes[i % routineTypes.length],
  };
});
