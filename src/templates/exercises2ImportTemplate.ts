import { EXERCISE_2_IMPORT_HEADERS } from '../utils/parseExercises2Csv';

// Multi-value columns (Edades, Lugares, Elementos) accept several values
// separated by "/". Spaces around "/" are ignored. Optional columns can be empty.
const SAMPLE_ROWS = [
  'Ejercicio1;Descripcion de ejercicio 1;Repeticiones;Ninos/Juveniles;Recreativo;Gimnasio/Casa;Competicion;Activacion general;Calentamiento;Control;Bronce;Cuadriceps;Pelota/Cono;Peso corporal;Bajo;Baja;grupo1',
  'Ejercicio2;Descripcion de ejercicio 2;Segundos;Adulto;Competitivo;Cancha;;Bloque principal;Fuerza superior;;;;;;;;',
];

export const EXERCISES_2_IMPORT_TEMPLATE = `${[
  EXERCISE_2_IMPORT_HEADERS.join(';'),
  ...SAMPLE_ROWS,
].join('\n')}\n`;
