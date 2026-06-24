import { Age, BlockType, ChallengeLevel, Difficulty, Element, ExerciseCategory, Impact, Level, Period_2, Place_2, RepType_2, Skill, WeightType } from "./enums";
import { Exercise_2 } from "./types";

const ExercisePropLabels: Record<keyof Exercise_2, string> = {
  id: 'ID',
  name: 'Nombre',
  description: 'Descripción',
  repType: 'Tipo de repetición',
  ages: 'Edades',
  level: 'Nivel',
  places: 'Lugares',
  period: 'Periodo',
  blockType: 'Tipo de bloque',
  category: 'Categoría',
  skill: 'Habilidad',
  challengeLevel: 'Nivel de desafío',
  mainMuscle: 'Músculo principal',
  elements: 'Elementos',
  weightType: 'Tipo de peso',
  impact: 'Impacto',
  difficulty: 'Dificultad',
  sistituteGroup: 'Grupo de sustitución',
  videoUrl: 'Video',
  imageUrl: 'Imagen',
  version: 'Versión'
};

const RepTypeLabel: Record<RepType_2, string> = {
  Repetitions: 'Repeticiones',
  Seconds: 'Segundos',
};

const AgeLabel: Record<Age, string> = {
  Children: 'Niños',
  Juveniles: 'Juveniles',
  Adult: 'Adulto',
  SeniorAdult: 'Adulto mayor',
};

const LevelLabel: Record<Level, string> = {
  Recreational: 'Recreativo',
  Competitive: 'Competitivo',
};

const PlaceLabel: Record<Place_2, string> = {
  Gym: 'Gimnasio',
  Field: 'Cancha',
  Park: 'Plaza',
  Home: 'Casa',
};


const PeriodLabel: Record<Period_2, string> = {
  Competition: 'Competencia',
  Preseason: 'Pretemporada',
};

const BlockTypeLabel: Record<BlockType, string> = {
  GeneralActivation: 'Activación general',
  Core: 'Core',
  PhysicalActivation: 'Activación física',
  MainBlock: 'Bloque principal',
  Technical: 'Técnico',
  Challenge: 'Desafío',
  CoolDown: 'Enfriamiento',
  InjuryPrevention: 'Prevención de lesiones',
};

const ExerciseCategoryLabel: Record<ExerciseCategory, string> = {
  WarmUp: 'Calentamiento',
  UpperBodyStrength: 'Fuerza superior',
  LowerBodyStrength: 'Fuerza inferior',
  Core: 'Core',
  Power: 'Potencia',
  SpeedAgility: 'Velocidad y agilidad',
  TechnicalFootball: 'Técnico de fútbol',
  InjuryPrevention: 'Prevención de lesiones',
  CoolDown: 'Enfriamiento',
  TechnicalChallenge: 'Desafío técnico',
};

const SkillLabel: Record<Skill, string> = {
  Control: 'Control',
  Pass: 'Pase',
  Dribbling: 'Regate',
  Shot: 'Tiro',
  HeadShot: 'Cabezazo',
};

const ChallengeLevelLabel: Record<ChallengeLevel, string> = {
  Bronze: 'Bronce',
  Silver: 'Plata',
  Gold: 'Oro',
};

const ElementLabel: Record<Element, string> = {
  Ball: 'Pelota',
  Dumbbells: 'Mancuernas',
  Bar: 'Barra',
  ElasticBand: 'Banda elástica',
  TRX: 'TRX',
  Fitball: 'Fitball',
  Bosu: 'Bosu',
  Pad: 'Colchoneta',
  CoordinationLadder: 'Escalera de coordinación',
  Cone: 'Cono',
  Goal: 'Arco',
  NoEquipment: 'Sin equipamiento',
};

const WeightTypeLabel: Record<WeightType, string> = {
  BodyWeight: 'Peso corporal',
  ExternalWeight: 'Peso externo',
  NoWeight: 'Sin peso',
};

const ImpactLabel: Record<Impact, string> = {
  Low: 'Bajo',
  Medium: 'Medio',
  High: 'Alto',
};

const DifficultyLabel: Record<Difficulty, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
};

export { RepTypeLabel, AgeLabel, LevelLabel, PlaceLabel, PeriodLabel, BlockTypeLabel, ExerciseCategoryLabel, SkillLabel, ChallengeLevelLabel, ElementLabel, WeightTypeLabel, ImpactLabel, DifficultyLabel, ExercisePropLabels };