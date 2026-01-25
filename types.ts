export enum AppScreen {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  MODULE_DETAIL = 'MODULE_DETAIL',
  LEVEL_SELECT = 'LEVEL_SELECT',
  TEST_ACTIVE = 'TEST_ACTIVE',
}

export enum Tab {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export enum TestCategory {
  VISION = 'VISION',
  HEARING = 'HEARING',
  BREATH = 'BREATH',
  REFLEX = 'REFLEX',
  MEMORY = 'MEMORY'
}

export enum SubTestType {
  // Vision Types
  VIS_ACUITY = 'VIS_ACUITY',
  VIS_CONTRAST = 'VIS_CONTRAST',
  VIS_COLOR = 'VIS_COLOR',
  VIS_FOCUS = 'VIS_FOCUS',
  VIS_PATTERN = 'VIS_PATTERN',
  VIS_SPEED = 'VIS_SPEED',
  VIS_NOISE = 'VIS_NOISE',
  VIS_GHOSTING = 'VIS_GHOSTING',
  VIS_CROWDING = 'VIS_CROWDING',
  VIS_GLARE = 'VIS_GLARE',
  
  // Hearing Types
  HEARING_FREQ = 'HEARING_FREQ',
  HEARING_VOLUME = 'HEARING_VOLUME',
  HEARING_PITCH = 'HEARING_PITCH',
  HEARING_STEREO = 'HEARING_STEREO',
  HEARING_RHYTHM = 'HEARING_RHYTHM',
  HEARING_NOISE = 'HEARING_NOISE',
  HEARING_MEMORY = 'HEARING_MEMORY',

  // Breath Types (10)
  BREATH_HOLD = 'BREATH_HOLD',
  BREATH_RHYTHM = 'BREATH_RHYTHM', // 4-7-8
  BREATH_EXHALE = 'BREATH_EXHALE', // Sustained control
  BREATH_SQUARE = 'BREATH_SQUARE', // Box breathing
  BREATH_DEEP = 'BREATH_DEEP', // Capacity (Simulated)
  BREATH_COUNT = 'BREATH_COUNT', // Counting cadence
  BREATH_TIMING = 'BREATH_TIMING', // Time perception 
  BREATH_STAMINA = 'BREATH_STAMINA', // Fast rhythm
  BREATH_COHERENCE = 'BREATH_COHERENCE', // Heart coherence
  BREATH_POWER = 'BREATH_POWER', // Burst speed

  // Reflex Types (10)
  REFLEX_VISUAL = 'REFLEX_VISUAL',
  REFLEX_AUDIO = 'REFLEX_AUDIO',
  REFLEX_CHOICE = 'REFLEX_CHOICE', // Red vs Green
  REFLEX_GRID = 'REFLEX_GRID', // Whack-a-mole
  REFLEX_SEQUENCE = 'REFLEX_SEQUENCE', // 1-2-3
  REFLEX_MOVING = 'REFLEX_MOVING', // Catch moving ball
  REFLEX_STOP = 'REFLEX_STOP', // Release on stop
  REFLEX_MATH = 'REFLEX_MATH', // Quick math
  REFLEX_COLOR = 'REFLEX_COLOR', // Color text match
  REFLEX_SHAKE = 'REFLEX_SHAKE', // Shake/Tap reaction

  // Memory Types (10)
  MEM_SEQUENCE = 'MEM_SEQUENCE', // Simon Visual
  MEM_AUDIO = 'MEM_AUDIO', // Simon Audio
  MEM_NUMBERS = 'MEM_NUMBERS', // Digit span
  MEM_POSITIONS = 'MEM_POSITIONS', // Spatial span
  MEM_PAIRS = 'MEM_PAIRS', // Card match
  MEM_COLORS = 'MEM_COLORS', // Color sequence
  MEM_SHAPES = 'MEM_SHAPES', // Shape recall
  MEM_PATH = 'MEM_PATH', // Grid path
  MEM_NBACK = 'MEM_NBACK', // N-Back
  MEM_WORDS = 'MEM_WORDS', // Word recall
}

export interface GameLevel {
  id: number; // 1-50
  difficulty: number; // 0.0 to 1.0
  target: any; // Context specific (e.g., time to beat, text length)
}

export interface SubModule {
  id: SubTestType;
  title: string;
  description: string;
  icon: string;
  levels: GameLevel[];
}

export interface TestModule {
  id: TestCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  subModules: SubModule[];
}

export interface LevelResult {
  score: number; // 0-10
  stars: number; // 1-3
  date: number;
}

// Map: ModuleID -> SubModuleID -> LevelID -> Result
export interface UserProgressMap {
  [moduleId: string]: {
    [subId: string]: {
      [levelId: number]: LevelResult
    }
  }
}

export interface UserData {
  onboardingComplete: boolean;
  progress: UserProgressMap;
  totalScore: number;
  settings: {
    darkMode: boolean;
    soundEnabled: boolean;
  };
}

export const SCORE_MAX = 10;