import { Age_V3, BlockType_V3, ChallengeLevel_V3, Difficulty_V3, Element_V3, ExerciseCategory_V3, Focus, Impact_V3, Level_V3, Period_V3, Place_V3, Position, RepType_V3, Skill_V3, TipCategory, WeightType_V3 } from "./enums";
import { Exercise_V3 } from "./types";

const ExercisePropLabels: Record<keyof Exercise_V3, string> = {
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

const RepTypeLabel: Record<RepType_V3, string> = {
  Repetitions: 'Repeticiones',
  Seconds: 'Segundos',
};

const AgeLabel: Record<Age_V3, string> = {
  Children: 'Infantiles',
  Juveniles: 'Juveniles',
  Adult: 'Adulto',
  SeniorAdult: 'Adulto mayor',
};

const LevelLabel: Record<Level_V3, string> = {
  Recreational: 'Recreativo',
  Competitive: 'Competitivo',
};

const PlaceLabel: Record<Place_V3, string> = {
  Gym: 'Gimnasio',
  Field: 'Cancha',
  Park: 'Plaza',
  Home: 'Casa',
};


const PeriodLabel: Record<Period_V3, string> = {
  Competition: 'Competencia',
  Preseason: 'Pretemporada',
};

const TipCategoryLabel: Record<TipCategory, string> = {
  Psychology: 'Psicología',
  Nutrition: 'Nutrición',
  Sleep: 'Sueño',
  Injuries: 'Lesiones',
  Planning: 'Planificación',
  Tactics: 'Táctica',
};

const BlockTypeLabel: Record<BlockType_V3, string> = {
  GeneralActivation: 'Movilidad',
  Core: 'Core',
  PhysicalActivation: 'Activación física',
  MainBlock: 'Bloque principal',
  Technical: 'Técnico',
  Challenge: 'Desafío',
  CoolDown: 'Vuelta a la Calma',
  InjuryPrevention: 'Prevención de lesiones',
};

const ExerciseCategoryLabel: Record<ExerciseCategory_V3, string> = {
  WarmUp: 'Calentamiento',
  UpperBodyStrength: 'Fuerza superior',
  LowerBodyStrength: 'Fuerza inferior',
  Core: 'Core',
  Power: 'Potencia',
  SpeedAgility: 'Velocidad y agilidad',
  TechnicalFootball: 'Técnico de fútbol',
  InjuryPrevention: 'Prevención de lesiones',
  CoolDown: 'Vuelta a la Calma',
  TechnicalChallenge: 'Desafío técnico',
};

const SkillLabel: Record<Skill_V3, string> = {
  Control: 'Control',
  Pass: 'Pase',
  Dribbling: 'Regate',
  Shot: 'Tiro',
  HeadShot: 'Cabezazo',
};

const ChallengeLevelLabel: Record<ChallengeLevel_V3, string> = {
  Bronze: 'Bronce',
  Silver: 'Plata',
  Gold: 'Oro',
};

const ElementLabel: Record<Element_V3, string> = {
  Ball: 'Pelota',
  Dumbbells: 'Mancuernas',
  Bar: 'Barra',
  Plates: 'Discos',
  Kettlebells: 'Pesas rusas',
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

const WeightTypeLabel: Record<WeightType_V3, string> = {
  BodyWeight: 'Peso corporal',
  ExternalWeight: 'Peso externo',
  NoWeight: 'Sin peso',
};

const ImpactLabel: Record<Impact_V3, string> = {
  Low: 'Bajo',
  Medium: 'Medio',
  High: 'Alto',
};

const DifficultyLabel: Record<Difficulty_V3, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
};

const PositionLabel: Record<Position, string> = {
  Goalkeeper: 'Arquero',
  CenterBack: 'Defensor Central',
  FullBack: 'Defensor Lateral',
  DefensiveMidfielder: 'Mediocampista Defensivo',
  AttackingMidfielder: 'Mediocampista Ofensivo',
  Winger: 'Extremo',
  Striker: 'Delantero',
};

const FocusLabel: Record<Focus, string> = {
  General: 'General',
  Strength: 'Fuerza',
  Explosiveness: 'Explosividad',
  Endurance: 'Resistencia',
  SpeedAgility: 'Velocidad y agilidad',
  StabilityPrevention: 'Estabilidad y Prevención',
};

export { RepTypeLabel, AgeLabel, LevelLabel, PlaceLabel, PeriodLabel, BlockTypeLabel, TipCategoryLabel, ExerciseCategoryLabel, SkillLabel, ChallengeLevelLabel, ElementLabel, WeightTypeLabel, ImpactLabel, DifficultyLabel, ExercisePropLabels, PositionLabel, FocusLabel };
