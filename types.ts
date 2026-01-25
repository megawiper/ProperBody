export enum GameScreen {
  SPLASH = 'SPLASH',
  HOME = 'HOME',
  GAMEPLAY = 'GAMEPLAY',
  RESULT = 'RESULT',
  SETTINGS = 'SETTINGS'
}

export enum ChallengeType {
  BASIC = 'BASIC',         // Part 1: High Contrast
  CONTRAST = 'CONTRAST',   // Part 2: Low Contrast
  BLUR = 'BLUR',           // Part 3: Focus
  DOTS = 'DOTS',           // Part 4: Color perception (Ishihara-like)
  PATTERN = 'PATTERN',     // Part 5: Confusion
  MEMORY = 'MEMORY',       // Part 6: Flash memory
  ILLUSION = 'ILLUSION'    // Part 7: Optical Illusion
}

export interface LevelConfig {
  id: string;
  part: number;
  level: number;
  type: ChallengeType;
  answer: string; // Default answer, but overridden in gameplay
  difficulty: number; // 0 to 1 scale
  timeLimit?: number; // Optional custom time limit
}

export interface UserProgress {
  currentPart: number;
  currentLevel: number; // Within the part (1-7)
  unlockedLevels: string[]; // List of Level IDs
  totalScore: number;
  scores: Record<string, number>; // LevelID -> Score
  bestScore: number;
}

export interface GameSettings {
  darkMode: boolean;
  language: 'en' | 'hi';
  soundEnabled: boolean;
}

export const TOTAL_PARTS = 7;
export const LEVELS_PER_PART = 7;

// NEW SCORING SYSTEM
export const SCORE_MAX = 100;       // Start with 100
export const SCORE_REFRESH = -2;    // Penalty for getting a new image
export const SCORE_HINT = -10;      // Penalty for hint
export const SCORE_WRONG = -10;     // Penalty for wrong guess
export const SCORE_MIN = 10;        // Minimum points if completed

export const VISION_CATEGORIES = {
  EXCELLENT: 'God Vision',
  AVERAGE: 'Normal Vision',
  WEAK: 'Needs Training'
};