enum Age {
  CHILDREN = 'Children',
  JUVENILES = 'Juveniles',
  ADULT = 'Adult',
  SENIOR_ADULT = 'SeniorAdult'
}

enum Place_2 {
  GYM = 'Gym',
  FIELD = 'Field',
  PARK = 'Park',
  HOME = 'Home'
}

enum Period_2 {
  COMPETITION = 'Competition',
  PRESEASON = 'Preseason'
}

enum Level {
  RECREATIONAL = 'Recreational',
  COMPETITIVE = 'Competitive'
}

enum Gender_2 {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

enum BlockType {
  GENERAL_ACTIVATION = 'GeneralActivation',
  CORE = 'Core',
  PHYSICAL_ACTIVATION = 'PhysicalActivation',
  MAIN_BLOCK = 'MainBlock',
  TECHNICAL = 'Technical',
  CHALLENGE = 'Challenge',
  COOL_DOWN = 'CoolDown',
  INJURY_PREVENTION = 'InjuryPrevention'
}

enum RepType_2 {
  REPETITIONS = 'Repetitions',
  SECONDS = 'Seconds'
}

enum ExerciseCategory {
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

enum Skill {
  CONTROL = 'Control',
  PASS = 'Pass',
  DRIBBLING = 'Dribbling',
  SHOT = 'Shot',
  HEAD_SHOT = 'HeadShot'
}

enum ChallengeLevel {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold'
}

enum Element {
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

enum WeightType {
  BODY_WEIGHT = 'BodyWeight',
  EXTERNAL_WEIGHT = 'ExternalWeight',
  NO_WEIGHT = 'NoWeight'
}

enum Impact {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

enum Difficulty {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export {
  Age, BlockType, ChallengeLevel, Difficulty, Element, ExerciseCategory, Gender_2, Impact, Level,
  Period_2,
  Place_2,
  RepType_2,
  Skill,
  WeightType
};

