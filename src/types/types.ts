import { Age, BlockType, ChallengeLevel, Difficulty, Element, ExerciseCategory, Gender_2, Impact, Level, Period_2, Place_2, RepType_2, Skill, WeightType } from "./enums"

export type User_2 = {
  id: string
  fullName: string
  pictureUrl?: string
  gender?: Gender_2
  birthday?: string
  email: string
  age: Age
  level: Level
  period?: Period_2
  height?: number
  weight?: number
  completedItems?: CompletedItem_2[]
  pro?: boolean
  appwrite?: boolean
  auth?: boolean
}

export type CompletedItem_2 = {
  routineId: string
  trainingSessions: number[]
}

type Routine_2 = {
  id: string
  name: string
  age: Age
  level: Level
  place: Place_2
  period: Period_2
}

type RoutineMapping_2 = {
  id: string
  age: Age
  level: Level
  place: Place_2
  period: Period_2
  routineId: string
}

type TrainingDay_2 = {
  id: string
  routineId: string
  session: number
  name: string
  matchday?: string
  minutes: number
  tips?: string[]
}

type TrainingBlock_2 = {
  id: string
  trainingDayId: string
  index: number
  name: string
  blockType: BlockType
  series: number
  exercises: ExerciseItem_2[]
}

type ExerciseItem_2 = {
  index: number
  exerciseId: string
  reps: string
  restSeconds?: number
}

type Exercise_2 = {
  id: string
  name: string
  description: string
  repType: RepType_2
  ages: Age[]
  level: Level
  places: Place_2[]
  period?: Period_2
  blockType: BlockType
  category: ExerciseCategory
  skill?: Skill
  challengeLevel?: ChallengeLevel
  mainMuscle?: string
  elements?: Element[]
  weightType?: WeightType
  impact?: Impact
  difficulty?: Difficulty
  sistituteGroup?: string
  videoUrl?: string
  imageUrl?: string
  version?: string
}

type Question_2 = {
  id: string
  index: number
  title: string
  answer: string
}

export type {
  Exercise_2, ExerciseItem_2, Question_2, Routine_2,
  RoutineMapping_2, TrainingBlock_2, TrainingDay_2
}
