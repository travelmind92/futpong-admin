import { Age_V3, BlockType_V3, ChallengeLevel_V3, Difficulty_V3, Element_V3, ExerciseCategory_V3, Impact_V3, Level_V3, Period_V3, Place_V3, RepType_V3, Skill_V3, TipCategory, WeightType_V3 } from "./enums"

type Routine_V3 = {
  id: string
  name: string 
  age: Age_V3
  level: Level_V3
  place: Place_V3
  period: Period_V3
  version?: string
}

type RoutineMapping_V3 = {
  id: string
  age: Age_V3
  level: Level_V3
  place: Place_V3
  period: Period_V3
  routineId: string
}

type TrainingDay_V3 = {
  id: string
  routineId: string
  session: number
  name: string
  matchday?: string
  minutes: number
  tips?: Tip[]
}

type Tip = {
  category: TipCategory
  text: string
}

type TrainingBlock_V3 = {
  id: string
  trainingDayId: string
  index: number
  name: string
  blockType: BlockType_V3
  series: number
  exercises: ExerciseItem_V3[]
}

type ExerciseItem_V3 = {
  index: number
  exerciseId: string
  reps: string
  restSeconds?: number
}

type Exercise_V3 = {
  id: string
  name: string
  description: string
  repType: RepType_V3
  ages: Age_V3[]
  level: Level_V3
  places: Place_V3[]
  period?: Period_V3
  blockType: BlockType_V3
  category: ExerciseCategory_V3
  skill?: Skill_V3
  challengeLevel?: ChallengeLevel_V3
  mainMuscle?: string
  elements?: Element_V3[]
  weightType?: WeightType_V3  
  impact?: Impact_V3
  difficulty?: Difficulty_V3
  sistituteGroup?: string
  videoUrl?: string
  imageUrl?: string
  version?: string
}

type Question_V3 = {
  id: string
  index: number
  title: string
  answer: string
}

export type {
  Exercise_V3, ExerciseItem_V3, Question_V3, Routine_V3,
  RoutineMapping_V3, TrainingBlock_V3, TrainingDay_V3, Tip
}
