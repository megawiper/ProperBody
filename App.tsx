import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings, Play, RotateCcw, Award, CheckCircle, 
  XCircle, Share2, ArrowRight, Eye, Home, Volume2, 
  VolumeX, HelpCircle, Moon, Sun, Lock, RefreshCw
} from 'lucide-react';
import { 
  GameScreen, UserProgress, GameSettings, LevelConfig, 
  TOTAL_PARTS, LEVELS_PER_PART, 
  ChallengeType, SCORE_MAX, SCORE_REFRESH, SCORE_HINT, SCORE_WRONG, SCORE_MIN,
  VISION_CATEGORIES
} from './types';
import { TEXTS, ALL_LEVELS, randomString } from './constants';
import VisualRenderer from './components/VisualRenderer';

// --- MAIN COMPONENT ---
const App: React.FC = () => {
  // --- STATE ---
  const [screen, setScreen] = useState<GameScreen>(GameScreen.SPLASH);
  
  // Persistence Loading
  const loadInitialProgress = (): UserProgress => {
    try {
      const saved = localStorage.getItem('eyeTestProgress');
      return saved ? JSON.parse(saved) : {
        currentPart: 1,
        currentLevel: 1,
        unlockedLevels: ['p1_l1'],
        totalScore: 0,
        scores: {},
        bestScore: 0
      };
    } catch (e) {
      return {
        currentPart: 1,
        currentLevel: 1,
        unlockedLevels: ['p1_l1'],
        totalScore: 0,
        scores: {},
        bestScore: 0
      };
    }
  };

  const loadInitialSettings = (): GameSettings => {
    try {
      const saved = localStorage.getItem('eyeTestSettings');
      return saved ? JSON.parse(saved) : {
        darkMode: false,
        language: 'en',
        soundEnabled: true
      };
    } catch (e) {
      return {
        darkMode: false,
        language: 'en',
        soundEnabled: true
      };
    }
  };

  const [progress, setProgress] = useState<UserProgress>(loadInitialProgress);
  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
  
  // Gameplay State
  const [activeLevel, setActiveLevel] = useState<LevelConfig | null>(null);
  
  // DYNAMIC STATE (New logic)
  const [currentAnswer, setCurrentAnswer] = useState(''); // The actual answer for this run
  const [currentScore, setCurrentScore] = useState(SCORE_MAX); // Starts at 100
  
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [hintUsed, setHintUsed] = useState(false);
  const [memoryPhase, setMemoryPhase] = useState<'memorize' | 'input'>('input');
  const [memoryTimer, setMemoryTimer] = useState(0);

  // Computed
  const t = TEXTS[settings.language];
  const totalLevels = TOTAL_PARTS * LEVELS_PER_PART;
  const completedCount = Object.keys(progress.scores).length;
  const progressPercent = Math.floor((completedCount / totalLevels) * 100);

  // --- EFFECTS ---
  
  // Splash Screen Timer
  useEffect(() => {
    if (screen === GameScreen.SPLASH) {
      const timer = setTimeout(() => setScreen(GameScreen.HOME), 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Dark Mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('eyeTestSettings', JSON.stringify(settings));
  }, [settings]);

  // Save Progress
  useEffect(() => {
    localStorage.setItem('eyeTestProgress', JSON.stringify(progress));
  }, [progress]);

  // Memory Game Logic
  useEffect(() => {
    let interval: any;
    if (activeLevel?.type === ChallengeType.MEMORY && screen === GameScreen.GAMEPLAY) {
      if (memoryPhase === 'memorize') {
        if (memoryTimer > 0) {
          interval = setInterval(() => setMemoryTimer(prev => prev - 1), 1000);
        } else {
          setMemoryPhase('input');
        }
      }
    }
    return () => clearInterval(interval);
  }, [activeLevel, memoryPhase, memoryTimer, screen]);


  // --- ACTIONS ---

  const playSound = (type: 'correct' | 'wrong' | 'click' | 'refresh') => {
    if (!settings.soundEnabled) return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'refresh') {
        // Whoosh sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        // Click
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const startLevel = (levelId: string, isDaily = false, dailyConfig?: LevelConfig) => {
    playSound('click');
    
    let level;
    if (isDaily && dailyConfig) {
      level = dailyConfig;
    } else {
      level = ALL_LEVELS.find(l => l.id === levelId);
    }
    
    if (!level) return;

    setActiveLevel(level);
    
    // GENERATE FRESH ANSWER & RESET SCORE
    // The length depends on difficulty
    const len = level.part < 3 ? 3 : level.part < 5 ? 4 : 5;
    setCurrentAnswer(randomString(len));
    setCurrentScore(SCORE_MAX); // Start with 100

    setInputValue('');
    setFeedback('none');
    setHintUsed(false);
    setScreen(GameScreen.GAMEPLAY);

    if (level.type === ChallengeType.MEMORY) {
      setMemoryPhase('memorize');
      setMemoryTimer(Math.max(1, 3 - (level.difficulty * 2)));
    } else {
      setMemoryPhase('input');
    }
  };

  const refreshLevel = () => {
    if (!activeLevel) return;
    playSound('refresh');
    
    // Deduct points
    setCurrentScore(prev => Math.max(SCORE_MIN, prev + SCORE_REFRESH));
    
    // Generate NEW answer (this causes the image to change completely)
    const len = activeLevel.part < 3 ? 3 : activeLevel.part < 5 ? 4 : 5;
    setCurrentAnswer(randomString(len));
    
    // Reset inputs but NOT the score/hint usage
    setInputValue('');
    setFeedback('none');
    
    // If memory, restart timer
    if (activeLevel.type === ChallengeType.MEMORY) {
      setMemoryPhase('memorize');
      setMemoryTimer(Math.max(1, 3 - (activeLevel.difficulty * 2)));
    }
  };

  const submitAnswer = () => {
    if (!activeLevel) return;

    const normalizedInput = inputValue.trim().toUpperCase();
    const normalizedAnswer = currentAnswer.toUpperCase(); // Use Dynamic Answer

    if (normalizedInput === normalizedAnswer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const handleCorrect = () => {
    setFeedback('correct');
    playSound('correct');
    
    // Final Score Calculation
    // Ensure it doesn't drop below minimum valid score for passing
    const finalPoints = Math.max(SCORE_MIN, currentScore);

    // If Daily Challenge, just add to total and exit
    if (activeLevel?.id === 'daily_challenge') {
      const newTotal = progress.totalScore + finalPoints;
      setTimeout(() => {
        setProgress(prev => ({
          ...prev,
          totalScore: newTotal,
          bestScore: Math.max(prev.bestScore, newTotal)
        }));
        setScreen(GameScreen.RESULT);
      }, 1000);
      return;
    }

    // --- Campaign Logic ---
    const newScores = { ...progress.scores, [activeLevel!.id]: finalPoints };
    
    // Determine next level
    let nextLevelId = '';
    const currentPartIdx = activeLevel!.part;
    const currentLevelIdx = activeLevel!.level;
    
    if (currentLevelIdx < LEVELS_PER_PART) {
      nextLevelId = `p${currentPartIdx}_l${currentLevelIdx + 1}`;
    } else if (currentPartIdx < TOTAL_PARTS) {
      nextLevelId = `p${currentPartIdx + 1}_l1`;
    }

    const newUnlocked = [...progress.unlockedLevels];
    if (nextLevelId && !newUnlocked.includes(nextLevelId)) {
      newUnlocked.push(nextLevelId);
    }

    // Recalculate total score
    const newTotalScore = Object.values(newScores).reduce((a, b) => a + b, 0);

    setTimeout(() => {
      setProgress(prev => ({
        ...prev,
        scores: newScores,
        unlockedLevels: newUnlocked,
        totalScore: newTotalScore,
        bestScore: Math.max(prev.bestScore, newTotalScore),
        currentPart: nextLevelId ? parseInt(nextLevelId.split('_')[0].substring(1)) : prev.currentPart,
        currentLevel: nextLevelId ? parseInt(nextLevelId.split('_')[1].substring(1)) : prev.currentLevel
      }));

      // Check if game complete
      if (currentPartIdx === TOTAL_PARTS && currentLevelIdx === LEVELS_PER_PART) {
        setScreen(GameScreen.RESULT);
      } else {
        // Auto-start next level
        startLevel(nextLevelId);
      }
    }, 1000);
  };

  const handleWrong = () => {
    setFeedback('wrong');
    playSound('wrong');
    // Deduct points
    setCurrentScore(prev => Math.max(SCORE_MIN, prev + SCORE_WRONG));
    setTimeout(() => setFeedback('none'), 800);
  };

  const useHint = () => {
    if (hintUsed) return;
    playSound('click');
    setHintUsed(true);
    // Deduct points
    setCurrentScore(prev => Math.max(SCORE_MIN, prev + SCORE_HINT));
    
    // Reveal first char of dynamic answer
    setInputValue(currentAnswer.substring(0, 1));
  };

  const resetProgress = () => {
    playSound('click');
    if (confirm("Are you sure? This will erase all progress.")) {
      setProgress({
        currentPart: 1,
        currentLevel: 1,
        unlockedLevels: ['p1_l1'],
        totalScore: 0,
        scores: {},
        bestScore: progress.bestScore 
      });
      setScreen(GameScreen.HOME);
    }
  };

  const startDailyChallenge = () => {
    // Generate a COMPLETELY NEW random level
    // It is not part of the standard map
    const types = [
      ChallengeType.DOTS, 
      ChallengeType.PATTERN, 
      ChallengeType.ILLUSION, 
      ChallengeType.CONTRAST
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomDiff = 0.5 + (Math.random() * 0.4); // Medium to Hard
    
    const dailyConfig: LevelConfig = {
      id: 'daily_challenge',
      part: 99,
      level: 99,
      type: randomType,
      answer: randomString(5),
      difficulty: randomDiff
    };
    
    startLevel('daily_challenge', true, dailyConfig);
  };

  const navigateTo = (scr: GameScreen) => {
    playSound('click');
    setScreen(scr);
  }

  // --- RENDERERS ---

  if (screen === GameScreen.SPLASH) {
    return (
      <div className="min-h-screen bg-game-dark flex flex-col items-center justify-center text-white p-4">
        <div className="animate-fade-in flex flex-col items-center">
          <Eye size={80} className="text-game-primary mb-6 animate-pulse-fast" />
          <h1 className="text-4xl font-bold tracking-wider mb-2 text-center">{t.appTitle}</h1>
          <p className="text-gray-400 text-lg">{t.tagline}</p>
        </div>
      </div>
    );
  }

  if (screen === GameScreen.HOME) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
             <Eye className="text-game-primary" />
             <span className="font-bold text-lg dark:text-white">{t.appTitle}</span>
          </div>
          <button onClick={() => navigateTo(GameScreen.SETTINGS)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition">
            <Settings size={24} />
          </button>
        </header>

        <main className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full gap-6">
           {/* Stats Card */}
           <div className="bg-gradient-to-r from-game-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg transform transition hover:scale-105">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-blue-100 text-sm font-medium">{t.totalScore}</p>
                 <h2 className="text-4xl font-bold">{progress.totalScore}</h2>
               </div>
               <Award className="text-yellow-300" size={32} />
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-xs text-blue-100">
                 <span>Progress</span>
                 <span>{progressPercent}%</span>
               </div>
               <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                 <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
             </div>
           </div>

           {/* Main Actions */}
           <button 
             onClick={() => {
                const lastUnlocked = progress.unlockedLevels[progress.unlockedLevels.length - 1];
                startLevel(lastUnlocked);
             }}
             className="bg-game-secondary hover:bg-emerald-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between group transition-all"
           >
             <div className="flex flex-col items-start">
               <span className="text-xl font-bold">{t.start}</span>
               <span className="text-sm opacity-90">{t.part} {progress.currentPart} - {t.level} {progress.currentLevel}</span>
             </div>
             <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition">
               <Play size={24} fill="currentColor" />
             </div>
           </button>

           <button 
             onClick={startDailyChallenge}
             className="bg-game-accent hover:bg-amber-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between transition-all"
           >
             <span className="text-lg font-bold">{t.daily}</span>
             <RotateCcw size={24} />
           </button>

           {/* Parts List (Scrollable) */}
           <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-10">
             <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wide">Campaign</h3>
             {Array.from({ length: TOTAL_PARTS }).map((_, i) => {
               const partNum = i + 1;
               const isPartUnlocked = partNum <= progress.currentPart;
               
               const partScore = ALL_LEVELS
                 .filter(l => l.part === partNum)
                 .reduce((acc, l) => acc + (progress.scores[l.id] || 0), 0);
               
               return (
                 <div key={partNum} className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 ${isPartUnlocked ? 'border-transparent shadow-sm' : 'border-gray-100 dark:border-gray-700 opacity-60'}`}>
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPartUnlocked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                         {isPartUnlocked ? partNum : <Lock size={16} />}
                       </div>
                       <div>
                         <h4 className="font-bold dark:text-white">{t.part} {partNum}</h4>
                         <p className="text-xs text-gray-500">{isPartUnlocked ? `Score: ${partScore}` : 'Locked'}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </main>
      </div>
    );
  }

  if (screen === GameScreen.SETTINGS) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col max-w-md mx-auto">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center gap-4 shadow-sm">
           <button onClick={() => navigateTo(GameScreen.HOME)} className="text-gray-600 dark:text-gray-300">
             <ArrowRight className="rotate-180" />
           </button>
           <h1 className="text-xl font-bold dark:text-white">{t.settings}</h1>
        </header>
        
        <div className="p-6 space-y-6">
           {/* Settings UI remains same, just brief toggle logic */}
           <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
             <div className="flex items-center gap-3 dark:text-white">
               {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
               <span>{t.darkMode}</span>
             </div>
             <button 
                onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-game-primary' : 'bg-gray-300'}`}
             >
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.darkMode ? 'translate-x-6' : ''}`} />
             </button>
           </div>
           
           <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
             <div className="flex items-center gap-3 dark:text-white">
               {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
               <span>{t.sound}</span>
             </div>
             <button 
                onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-game-secondary' : 'bg-gray-300'}`}
             >
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.soundEnabled ? 'translate-x-6' : ''}`} />
             </button>
           </div>

           <button onClick={resetProgress} className="w-full p-4 text-red-500 font-bold bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition">
             {t.reset}
           </button>
        </div>
      </div>
    );
  }

  if (screen === GameScreen.RESULT) {
    let category = VISION_CATEGORIES.WEAK;
    if (progressPercent > 80) category = VISION_CATEGORIES.EXCELLENT;
    else if (progressPercent > 50) category = VISION_CATEGORIES.AVERAGE;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <Award className="w-20 h-20 mx-auto text-game-accent mb-4" />
            <h2 className="text-3xl font-bold mb-2 dark:text-white">{t.resultTitle}</h2>
            <div className="my-6 space-y-2">
               <p className="text-gray-500">{t.totalScore}</p>
               <p className="text-5xl font-black text-game-primary">{progress.totalScore}</p>
            </div>
            <button onClick={() => navigateTo(GameScreen.HOME)} className="w-full p-4 bg-game-primary text-white rounded-xl font-bold">
               {t.home}
            </button>
         </div>
      </div>
    );
  }

  // GAMEPLAY RENDER
  if (screen === GameScreen.GAMEPLAY && activeLevel) {
    const isMem = activeLevel.type === ChallengeType.MEMORY;
    const showViz = !isMem || (isMem && memoryPhase === 'memorize');

    // Create a temporary level object with the DYNAMIC answer
    const renderLevelObj = {
      ...activeLevel,
      answer: currentAnswer
    };

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 shadow-md flex justify-between items-center z-10">
           <button onClick={() => navigateTo(GameScreen.HOME)} className="p-2 text-gray-500">
             <ArrowRight className="rotate-180" />
           </button>
           
           <div className="flex flex-col items-center">
             {activeLevel.id === 'daily_challenge' ? (
                <span className="font-bold text-game-accent">{t.daily}</span>
             ) : (
                <span className="font-bold dark:text-white">{t.part} {activeLevel.part} • {t.level} {activeLevel.level}</span>
             )}
             <span className={`text-xs font-mono font-bold ${currentScore < 50 ? 'text-red-500' : 'text-green-500'}`}>
               PTS: {currentScore}
             </span>
           </div>

           <div className="flex gap-2">
             {/* Refresh Button */}
             <button 
               onClick={refreshLevel} 
               className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition"
               title="Refresh Image (-2 pts)"
             >
               <RefreshCw size={22} />
             </button>

             {/* Hint Button */}
             <button 
               onClick={useHint} 
               disabled={hintUsed || !showViz} 
               className={`p-2 ${hintUsed ? 'text-gray-300' : 'text-amber-500'} transition`}
               title="Hint (-10 pts)"
             >
               <HelpCircle size={24} />
             </button>
           </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
           
           {isMem && memoryPhase === 'memorize' && (
             <div className="absolute top-6 bg-red-500 text-white px-4 py-1 rounded-full font-bold animate-pulse z-20">
               {t.memPhase}: {memoryTimer}s
             </div>
           )}

           {/* Feedback Overlay */}
           {feedback !== 'none' && (
             <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className={`p-6 rounded-2xl shadow-2xl transform scale-125 ${feedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {feedback === 'correct' ? <CheckCircle size={64} /> : <XCircle size={64} />}
                </div>
             </div>
           )}
           
           <VisualRenderer 
             level={renderLevelObj} 
             showContent={showViz}
             isDarkMode={settings.darkMode}
           />

           {hintUsed && (
             <p className="mt-4 text-sm text-amber-500 font-medium">{t.hintUsed}</p>
           )}
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 pb-8 rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
           {isMem && memoryPhase === 'memorize' ? (
             <div className="text-center py-6">
                <p className="text-lg font-bold text-gray-600 dark:text-gray-300 animate-pulse">Memorize the code...</p>
             </div>
           ) : (
             <div className="max-w-md mx-auto space-y-4">
               <input 
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && inputValue.length > 0 && submitAnswer()}
                 placeholder={t.inputPlaceholder}
                 className="w-full p-4 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-game-primary uppercase"
                 maxLength={currentAnswer.length + 2}
                 autoFocus
               />
               <button 
                 onClick={submitAnswer}
                 disabled={inputValue.length === 0}
                 className={`w-full p-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${inputValue.length > 0 ? 'bg-game-primary hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'}`}
               >
                 {t.submit}
               </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  return null;
};

export default App;