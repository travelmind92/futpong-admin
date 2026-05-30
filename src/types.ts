export enum PlayerType {
  CHILDREN = 'Children',
  JUVENILES = 'Juveniles',
  AMATEUR = 'Amateur',
  ELITE = 'Elite'
}

export enum Place {
  GYM = 'Gym',
  FIELD = 'Field',
  PARK = 'Park',
  HOME = 'Home'
}

export enum RoutineType {
  COMPETENCE = 'Competition',
  PRESEASON = 'Preseason'
}

export type Routine = {
  id: string
  name: string
  playerType: PlayerType
  place: Place
  type: RoutineType
}

export type RoutineMapping = {
  id: string
  playerType: PlayerType
  routineType: RoutineType
  place: Place
  routineId: string
}

export type TrainingDay = {
  id: string
  routineId: string
  day: number
  name: string
  matchday: string
}

export type ExerciseItem = {
  index: number
  exerciseId: string
  reps: string
}

export type TrainingBlock = {
  id: string
  trainingDayId: string
  index: number
  name: string
  series: string
  exercises: ExerciseItem[]
}

export enum RepType {
  REPETITIONS = 'Repetitions',
  SECONDS = 'Seconds'
}

export type Exercise = {
  id: string
  name: string
  description: string
  repType: RepType
  equivalenceGroup?: string
  videoUrl?: string
  thumbnailUrl?: string
}