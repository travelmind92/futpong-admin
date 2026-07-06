enum Age_V3 {
  CHILDREN = 'Children',
  JUVENILES = 'Juveniles',
  ADULT = 'Adult',
  SENIOR_ADULT = 'SeniorAdult'
}

enum Place_V3 {
  GYM = 'Gym',
  FIELD = 'Field',
  PARK = 'Park',
  HOME = 'Home'
}

enum Period_V3 {
  COMPETITION = 'Competition',
  PRESEASON = 'Preseason'
}

enum Level_V3 {
  RECREATIONAL = 'Recreational',
  COMPETITIVE = 'Competitive'
}

enum Gender_V3 {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

enum BlockType_V3 {
  GENERAL_ACTIVATION = 'GeneralActivation',
  CORE = 'Core',
  PHYSICAL_ACTIVATION = 'PhysicalActivation',
  MAIN_BLOCK = 'MainBlock',
  TECHNICAL = 'Technical',
  CHALLENGE = 'Challenge',
  COOL_DOWN = 'CoolDown',
  INJURY_PREVENTION = 'InjuryPrevention'
}

enum RepType_V3 {
  REPETITIONS = 'Repetitions',
  SECONDS = 'Seconds'
}

enum ExerciseCategory_V3 {
  WARM_UP = 'WarmUp',
  UPPER_BODY_STRENGTH = 'UpperBodyStrength',
  LOWER_BODY_STRENGTH = 'LowerBodyStrength',
  CORE = 'Core',
  POWER = 'Power',
  SPEED_AGILITY = 'SpeedAgility',
  TECHNICAL_FOOTBALL = 'TechnicalFootball',
  INJURY_PREVENTION = 'InjuryPrevention',
  COOL_DOWN = 'CoolDown',
  TECHNICAL_CHALLENGE = 'TechnicalChallenge'
}

enum Skill_V3 {
  CONTROL = 'Control',
  PASS = 'Pass',
  DRIBBLING = 'Dribbling',
  SHOT = 'Shot',
  HEAD_SHOT = 'HeadShot'
}

enum ChallengeLevel_V3 {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold'
}

enum Element_V3 {
  BALL = 'Ball',
  DUMBBELLS = 'Dumbbells', // Mancuernas
  BAR = 'Bar',
  ELASTIC_BAND = 'ElasticBand',
  TRX = 'TRX',
  FITBALL = 'Fitball',
  BOSU = 'Bosu',
  PAD = 'Pad', // Colchoneta
  COORDINATION_LADDER = 'CoordinationLadder',
  CONE = 'Cone',
  GOAL = 'Goal',
  NO_EQUIPMENT = 'NoEquipment'
}

enum WeightType_V3 {
  BODY_WEIGHT = 'BodyWeight',
  EXTERNAL_WEIGHT = 'ExternalWeight',
  NO_WEIGHT = 'NoWeight'
}

enum Impact_V3 {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

enum Difficulty_V3 {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

enum TipCategory {
  PSYCHOLOGY = 'Psychology',
  NUTRITION = 'Nutrition',
  SLEEP = 'Sleep',
  INJURIES = 'Injuries',
  PLANNING = 'Planning',
  TACTICS = 'Tactics'
}

export {
  Age_V3, BlockType_V3, ChallengeLevel_V3, Difficulty_V3, Element_V3, ExerciseCategory_V3, Gender_V3, Impact_V3, Level_V3,
  Period_V3,
  Place_V3,
  RepType_V3,
  Skill_V3,
  WeightType_V3,
  TipCategory
};
