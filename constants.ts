import { ChallengeType, LevelConfig, TOTAL_PARTS, LEVELS_PER_PART } from './types';

// Helper to generate a random alphanumeric string of length N
export const randomString = (length: number) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars (I, 1, O, 0)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deterministic generation of levels so they are consistent per "run" but we define them statically here
// for simplicity in this architecture, normally this could be dynamic.
// To satisfy "End-to-End", we generate the config object fully.

export const generateLevels = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];
  
  const getPartType = (p: number): ChallengeType => {
    switch(p) {
      case 1: return ChallengeType.BASIC;
      case 2: return ChallengeType.CONTRAST;
      case 3: return ChallengeType.BLUR;
      case 4: return ChallengeType.DOTS;
      case 5: return ChallengeType.PATTERN;
      case 6: return ChallengeType.MEMORY;
      case 7: return ChallengeType.ILLUSION;
      default: return ChallengeType.BASIC;
    }
  };

  for (let p = 1; p <= TOTAL_PARTS; p++) {
    for (let l = 1; l <= LEVELS_PER_PART; l++) {
      const difficulty = (l - 1) / (LEVELS_PER_PART - 1); // 0 to 1
      // Length increases with part and level
      const length = p < 3 ? 3 : p < 5 ? 4 : 5; 
      
      levels.push({
        id: `p${p}_l${l}`,
        part: p,
        level: l,
        type: getPartType(p),
        answer: randomString(length),
        difficulty: difficulty,
        timeLimit: p === 6 ? 15 : 60 // Shorter timer for memory, regular for others
      });
    }
  }
  return levels;
};

export const ALL_LEVELS = generateLevels();

export const TEXTS = {
  en: {
    appTitle: "Eye Test Challenge",
    tagline: "Test Your Eyes & Brain",
    start: "Start Challenge",
    daily: "Daily Challenge",
    resume: "Resume",
    settings: "Settings",
    disclaimer: "DISCLAIMER: This app is a game designed for entertainment and brain training. It is NOT a medical diagnostic tool. Please consult an optometrist for professional medical advice.",
    part: "PART",
    level: "LEVEL",
    inputPlaceholder: "What did you see?",
    submit: "SUBMIT",
    retry: "Try Again",
    next: "Next Level",
    hint: "Hint",
    resultTitle: "Challenge Complete!",
    totalScore: "Total Score",
    accuracy: "Accuracy",
    category: "Vision Category",
    share: "Share Score",
    home: "Back to Home",
    reset: "Reset Progress",
    darkMode: "Dark Mode",
    sound: "Sound Effects",
    language: "Language",
    correct: "Correct!",
    wrong: "Incorrect!",
    memPhase: "MEMORIZE",
    inputPhase: "ANSWER NOW",
    hintUsed: "Hint Used (-5 pts)"
  },
  hi: {
    appTitle: "दृष्टि परीक्षा",
    tagline: "अपनी आँखों और मस्तिष्क का परीक्षण करें",
    start: "चुनौती शुरू करें",
    daily: "दैनिक चुनौती",
    resume: "जारी रखें",
    settings: "सेटिंग्स",
    disclaimer: "अस्वीकरण: यह ऐप मनोरंजन और मस्तिष्क प्रशिक्षण के लिए बनाया गया एक खेल है। यह कोई चिकित्सा निदान उपकरण नहीं है। कृपया पेशेवर चिकित्सा सलाह के लिए नेत्र रोग विशेषज्ञ से परामर्श लें।",
    part: "भाग",
    level: "स्तर",
    inputPlaceholder: "आपने क्या देखा?",
    submit: "जमा करें",
    retry: "पुनः प्रयास करें",
    next: "अगला स्तर",
    hint: "संकेत",
    resultTitle: "चुनौती पूर्ण!",
    totalScore: "कुल स्कोर",
    accuracy: "शुद्धता",
    category: "दृष्टि श्रेणी",
    share: "स्कोर साझा करें",
    home: "मुख्य पृष्ठ",
    reset: "प्रगति रीसेट करें",
    darkMode: "डार्क मोड",
    sound: "ध्वनि प्रभाव",
    language: "भाषा",
    correct: "सही!",
    wrong: "गलत!",
    memPhase: "याद रखें",
    inputPhase: "उत्तर दें",
    hintUsed: "संकेत का उपयोग (-5 अंक)"
  }
};