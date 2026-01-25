import { TestCategory, TestModule, SubTestType } from './types';

export const APP_NAME = "ProperBody";

export const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: "Complete Body Analysis",
    desc: "Your pocket laboratory. Test your vision, hearing, lungs, and reflexes with medical-grade precision tools.",
    icon: "Activity"
  },
  {
    id: 2,
    title: "Level Up Your Senses",
    desc: "Challenge yourself through 50 progressively difficult tiers for 50 distinct tests.",
    icon: "Layers"
  },
  {
    id: 3,
    title: "Track & Improve",
    desc: "Detailed history and analytics help you monitor your health trends over weeks and months.",
    icon: "TrendingUp"
  }
];

// Helper: Generates 50 levels. 
// Base difficulty 0.0 -> 1.0.
const generateLevels = (baseDiff: number) => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    difficulty: Math.min(1.0, baseDiff + (i * 0.018)), 
    target: null // Target is dynamically calculated in the renderer based on difficulty usually
  }));
};

export const BODY_MODULES: TestModule[] = [
  {
    id: TestCategory.VISION,
    title: "Vision",
    description: "Visual Acuity & Perception",
    icon: "Eye",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-400",
    subModules: [
      { id: SubTestType.VIS_ACUITY, title: "Acuity", description: "Identify the smallest text.", icon: "Type", levels: generateLevels(0.05) },
      { id: SubTestType.VIS_CONTRAST, title: "Contrast", description: "Read low contrast text.", icon: "Sun", levels: generateLevels(0.1) },
      { id: SubTestType.VIS_COLOR, title: "Color Blindness", description: "Find the hidden character.", icon: "Palette", levels: generateLevels(0.15) },
      { id: SubTestType.VIS_FOCUS, title: "Focus", description: "Read through blur.", icon: "Aperture", levels: generateLevels(0.1) },
      { id: SubTestType.VIS_PATTERN, title: "Pattern", description: "Text inside patterns.", icon: "Grid", levels: generateLevels(0.2) },
      { id: SubTestType.VIS_SPEED, title: "Speed", description: "Fast flashing text.", icon: "Zap", levels: generateLevels(0.3) },
      { id: SubTestType.VIS_NOISE, title: "Noise", description: "Text inside static.", icon: "Wind", levels: generateLevels(0.2) },
      { id: SubTestType.VIS_GHOSTING, title: "Ghosting", description: "Double vision test.", icon: "Layers", levels: generateLevels(0.15) },
      { id: SubTestType.VIS_CROWDING, title: "Crowding", description: "Focus on the center.", icon: "Minimize", levels: generateLevels(0.2) },
      { id: SubTestType.VIS_GLARE, title: "Glare", description: "Light bloom test.", icon: "Sun", levels: generateLevels(0.2) }
    ]
  },
  {
    id: TestCategory.HEARING,
    title: "Hearing",
    description: "Auditory Processing",
    icon: "Ear",
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-500",
    subModules: [
      { id: SubTestType.HEARING_FREQ, title: "Frequency", description: "High frequency tones.", icon: "Activity", levels: generateLevels(0.0) },
      { id: SubTestType.HEARING_VOLUME, title: "Threshold", description: "Faint sound detection.", icon: "Volume2", levels: generateLevels(0.1) },
      { id: SubTestType.HEARING_PITCH, title: "Pitch", description: "Higher or Lower?", icon: "Music", levels: generateLevels(0.05) },
      { id: SubTestType.HEARING_STEREO, title: "Stereo", description: "Left or Right channel?", icon: "Headphones", levels: generateLevels(0.1) },
      { id: SubTestType.HEARING_RHYTHM, title: "Rhythm", description: "Tap to the beat.", icon: "Play", levels: generateLevels(0.1) },
      { id: SubTestType.HEARING_NOISE, title: "In Noise", description: "Hear tones in static.", icon: "Wifi", levels: generateLevels(0.1) },
      { id: SubTestType.HEARING_MEMORY, title: "Tone Memory", description: "Recall tone sequences.", icon: "Brain", levels: generateLevels(0.1) }
    ]
  },
  {
    id: TestCategory.BREATH,
    title: "Breathing",
    description: "Lungs & Control",
    icon: "Wind",
    color: "bg-teal-500",
    gradient: "from-teal-500 to-emerald-400",
    subModules: [
      { id: SubTestType.BREATH_HOLD, title: "Max Hold", description: "Hold breath test.", icon: "Clock", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_RHYTHM, title: "4-7-8 Relax", description: "Relaxation technique.", icon: "Activity", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_SQUARE, title: "Box Breath", description: "4-4-4-4 technique.", icon: "Square", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_COHERENCE, title: "Coherence", description: "Heart rate variability.", icon: "Heart", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_EXHALE, title: "Exhale", description: "Controlled release.", icon: "Wind", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_DEEP, title: "Capacity", description: "Deep inhale training.", icon: "Maximize", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_STAMINA, title: "Stamina", description: "Fast paced breathing.", icon: "Zap", levels: generateLevels(0.2) },
      { id: SubTestType.BREATH_COUNT, title: "Cadence", description: "Count the cycles.", icon: "Hash", levels: generateLevels(0.1) },
      { id: SubTestType.BREATH_TIMING, title: "Time Sense", description: "Estimate breath length.", icon: "Watch", levels: generateLevels(0.2) },
      { id: SubTestType.BREATH_POWER, title: "Power", description: "Burst intensity.", icon: "Activity", levels: generateLevels(0.1) },
    ]
  },
  {
    id: TestCategory.REFLEX,
    title: "Reflex",
    description: "Reaction Time",
    icon: "Zap",
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-400",
    subModules: [
      { id: SubTestType.REFLEX_VISUAL, title: "Visual", description: "Tap on color change.", icon: "MousePointer", levels: generateLevels(0.1) },
      { id: SubTestType.REFLEX_AUDIO, title: "Audio", description: "Tap on sound.", icon: "Volume2", levels: generateLevels(0.1) },
      { id: SubTestType.REFLEX_CHOICE, title: "Choice", description: "Green vs Red.", icon: "CheckSquare", levels: generateLevels(0.2) },
      { id: SubTestType.REFLEX_GRID, title: "Grid", description: "Whack-a-mole.", icon: "Grid", levels: generateLevels(0.2) },
      { id: SubTestType.REFLEX_SEQUENCE, title: "Sequence", description: "Tap 1-2-3.", icon: "ListOrdered", levels: generateLevels(0.2) },
      { id: SubTestType.REFLEX_MOVING, title: "Moving", description: "Catch the target.", icon: "Crosshair", levels: generateLevels(0.3) },
      { id: SubTestType.REFLEX_MATH, title: "Math", description: "Solve fast.", icon: "Plus", levels: generateLevels(0.3) },
      { id: SubTestType.REFLEX_COLOR, title: "Stroop", description: "Color vs Text.", icon: "Palette", levels: generateLevels(0.3) },
      { id: SubTestType.REFLEX_STOP, title: "Inhibition", description: "Release on stop.", icon: "StopCircle", levels: generateLevels(0.2) },
      { id: SubTestType.REFLEX_SHAKE, title: "Shake", description: "Shake reaction.", icon: "Vibrate", levels: generateLevels(0.1) },
    ]
  },
  {
    id: TestCategory.MEMORY,
    title: "Memory",
    description: "Recall & Patterns",
    icon: "Brain",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-violet-500",
    subModules: [
      { id: SubTestType.MEM_SEQUENCE, title: "Simon Visual", description: "Light sequence.", icon: "Grid", levels: generateLevels(0.1) },
      { id: SubTestType.MEM_AUDIO, title: "Simon Audio", description: "Tone sequence.", icon: "Music", levels: generateLevels(0.1) },
      { id: SubTestType.MEM_NUMBERS, title: "Numbers", description: "Digit span.", icon: "Hash", levels: generateLevels(0.1) },
      { id: SubTestType.MEM_POSITIONS, title: "Positions", description: "Spatial recall.", icon: "MapPin", levels: generateLevels(0.2) },
      { id: SubTestType.MEM_PAIRS, title: "Pairs", description: "Card matching.", icon: "Copy", levels: generateLevels(0.2) },
      { id: SubTestType.MEM_COLORS, title: "Colors", description: "Color order.", icon: "Palette", levels: generateLevels(0.2) },
      { id: SubTestType.MEM_SHAPES, title: "Shapes", description: "Shape order.", icon: "Hexagon", levels: generateLevels(0.2) },
      { id: SubTestType.MEM_PATH, title: "Path", description: "Retrace path.", icon: "TrendingUp", levels: generateLevels(0.2) },
      { id: SubTestType.MEM_NBACK, title: "N-Back", description: "N steps back.", icon: "RotateCcw", levels: generateLevels(0.3) },
      { id: SubTestType.MEM_WORDS, title: "Words", description: "Word list.", icon: "Type", levels: generateLevels(0.2) },
    ]
  }
];

export const randomString = (length: number) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};