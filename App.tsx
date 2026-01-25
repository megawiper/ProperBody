import React, { useState, useEffect } from 'react';
import { 
  Settings, Home, ChevronRight, ArrowLeft, BarChart2, Star, Lock, Play, 
  Activity, Wind, Zap, Eye, Ear, Brain, Download, Smartphone, Check, X, Shield,
  AlertTriangle
} from 'lucide-react';
import { 
  AppScreen, Tab, TestModule, UserData, SubModule, GameLevel, LevelResult
} from './types';
import { BODY_MODULES, ONBOARDING_SLIDES, APP_NAME } from './constants';
import { TestEngine } from './components/VisualRenderer';
import Logo from './components/Logo';

const App: React.FC = () => {
  // --- STATE ---
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('properBodyData_v3');
    return saved ? JSON.parse(saved) : {
      onboardingComplete: false,
      progress: {}, 
      totalScore: 0,
      settings: { darkMode: false, soundEnabled: true }
    };
  });

  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  
  // Navigation Stack
  const [screen, setScreen] = useState<AppScreen>(AppScreen.ONBOARDING);
  const [activeModule, setActiveModule] = useState<TestModule | null>(null);
  const [activeSubModule, setActiveSubModule] = useState<SubModule | null>(null);
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);

  // Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('properBodyData_v3', JSON.stringify(userData));
    if (userData.settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [userData]);

  useEffect(() => {
    if (userData.onboardingComplete && screen === AppScreen.ONBOARDING) {
      setScreen(AppScreen.DASHBOARD);
    }
  }, []);

  // Check if app is already installed
  useEffect(() => {
      const checkInstalled = () => {
          if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
              setIsInstalled(true);
          }
      };
      checkInstalled();
      window.addEventListener('resize', checkInstalled);
      return () => window.removeEventListener('resize', checkInstalled);
  }, []);

  // Capture Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- HELPERS ---
  const getLevelResult = (modId: string, subId: string, lvlId: number) => {
    return userData.progress[modId]?.[subId]?.[lvlId];
  };

  const isLevelUnlocked = (modId: string, subId: string, lvlId: number) => {
    if (lvlId === 1) return true;
    const prev = getLevelResult(modId, subId, lvlId - 1);
    return !!prev && prev.score > 0;
  };

  const getSubModuleProgress = (modId: string, subId: string, totalLevels: number) => {
    const subProgress = userData.progress[modId]?.[subId] || {};
    const completedCount = Object.values(subProgress).filter((r: any) => r.score > 0).length;
    return Math.round((completedCount / totalLevels) * 100);
  };

  const getModuleIcon = (iconName: string, size: number = 24, className?: string) => {
    switch(iconName) {
      case 'Eye': return <Eye size={size} className={className} />;
      case 'Wind': return <Wind size={size} className={className} />;
      case 'Ear': return <Ear size={size} className={className} />;
      case 'Zap': return <Zap size={size} className={className} />;
      case 'Brain': return <Brain size={size} className={className} />;
      case 'Layers': return <Download size={size} className={className} />; // Placeholder
      case 'Minimize': return <Activity size={size} className={className} />; // Placeholder
      default: return <Activity size={size} className={className} />;
    }
  };

  // --- ACTIONS ---

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleLevelComplete = (score: number, passed: boolean) => {
    if (!activeModule || !activeSubModule || !activeLevel) return;

    let stars = 0;
    if (passed) {
       if (score >= 9) stars = 3;
       else if (score >= 7) stars = 2;
       else stars = 1;
    }

    const modId = activeModule.id;
    const subId = activeSubModule.id;
    const lvlId = activeLevel.id;

    const newProgress = { ...userData.progress };
    if (!newProgress[modId]) newProgress[modId] = {};
    if (!newProgress[modId][subId]) newProgress[modId][subId] = {};
    
    // Only update if score is better or didn't exist
    const existing = newProgress[modId][subId][lvlId];
    if (!existing || score > existing.score) {
        newProgress[modId][subId][lvlId] = {
            score,
            stars,
            date: Date.now()
        };
    }

    // Update total score
    const oldScore = existing ? existing.score : 0;
    const pointsDiff = Math.max(0, score - oldScore);

    setUserData(prev => ({
        ...prev,
        progress: newProgress,
        totalScore: prev.totalScore + pointsDiff
    }));

    setScreen(AppScreen.LEVEL_SELECT);
  };

  // --- COMPONENT: ONBOARDING ---
  const Onboarding = () => {
    const [slide, setSlide] = useState(-1); // -1 is Splash

    // Auto advance splash
    useEffect(() => {
      if (slide === -1) {
        const t = setTimeout(() => setSlide(0), 2000);
        return () => clearTimeout(t);
      }
    }, [slide]);

    if (slide === -1) {
      return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center animate-fade-in">
           <Logo size={120} className="mb-6 animate-pulse-fast" />
           <h1 className="text-4xl font-black tracking-tight dark:text-white">{APP_NAME}</h1>
           <p className="text-gray-400 mt-2">v2.2</p>
        </div>
      );
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-fade-in">
            {/* Logo Header */}
            <div className="pt-12 pb-4 flex justify-center">
              <Logo size={60} />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-8 text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700 transform transition-all duration-300">
                    <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                       {getModuleIcon(ONBOARDING_SLIDES[slide].icon, 32)}
                    </div>
                    <h2 className="text-2xl font-black mb-4 dark:text-white">{ONBOARDING_SLIDES[slide].title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">{ONBOARDING_SLIDES[slide].desc}</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-8 pb-12">
                <div className="flex justify-center gap-2 mb-8">
                    {ONBOARDING_SLIDES.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                </div>

                <button 
                  onClick={() => { 
                      if (slide < ONBOARDING_SLIDES.length - 1) setSlide(s=>s+1); 
                      else { setUserData(p => ({...p, onboardingComplete: true})); setScreen(AppScreen.DASHBOARD); }
                  }} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    {slide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
  };

  // --- COMPONENT: TAB - HOME ---
  const HomeTab = () => (
    <div className="pb-28">
        {/* BRANDING HEADER */}
        <div className="pt-8 px-6 pb-4 flex justify-between items-center bg-white dark:bg-gray-950 sticky top-0 z-20">
            <div className="flex items-center gap-3">
               <Logo size={40} />
               <span className="text-2xl font-black dark:text-white tracking-tight">{APP_NAME}</span>
            </div>
            <div className="flex gap-2">
                 <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 dark:text-white">
                    <Star size={12} className="text-yellow-500" fill="currentColor" /> {userData.totalScore}
                 </div>
            </div>
        </div>

        {/* HERO SECTION */}
        <div className="mx-6 relative h-56 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 overflow-hidden mb-8 group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-10 -translate-x-10 pointer-events-none"></div>
             
             <div className="relative z-10 h-full flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-3 opacity-80">
                    <Activity size={16} />
                    <span className="text-xs font-bold tracking-widest uppercase">Daily Checkup</span>
                 </div>
                 <h1 className="text-3xl font-black leading-tight mb-2">Your Body,<br/>Your Data.</h1>
                 <p className="opacity-90 text-sm max-w-[180px]">Complete today's challenges to maintain your streak.</p>
             </div>

             <div className="absolute right-4 bottom-4 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                 <Logo size={120} />
             </div>
        </div>

        {/* MODULES GRID */}
        <div className="px-6">
            <h2 className="text-xl font-bold dark:text-white mb-5 flex items-center gap-2">
               Categories
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {BODY_MODULES.map(module => (
                    <button 
                      key={module.id}
                      onClick={() => { setActiveModule(module); setScreen(AppScreen.MODULE_DETAIL); }}
                      className="aspect-square bg-white dark:bg-gray-900 rounded-[2rem] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 dark:border-gray-800 group flex flex-col justify-between items-start text-left relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${module.gradient} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform duration-500`} />
                        
                        <div className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform`}>
                            {getModuleIcon(module.icon)}
                        </div>
                        
                        <div>
                           <h3 className="font-bold text-lg dark:text-white leading-tight mb-1">{module.title}</h3>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{module.subModules.length} Tests</p>
                        </div>

                        <div className="absolute bottom-5 right-5 text-gray-200 dark:text-gray-700 group-hover:text-blue-500 transition-colors">
                           <ChevronRight size={24} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );

  // --- COMPONENT: TAB - HISTORY ---
  const HistoryTab = () => (
    <div className="p-6 pb-28 pt-12">
        <h2 className="text-3xl font-black dark:text-white mb-8">Health Report</h2>
        <div className="space-y-6">
            {Object.keys(userData.progress).map(modId => {
                const mod = BODY_MODULES.find(m => m.id === modId);
                if (!mod) return null;
                return (
                    <div key={modId} className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-10 h-10 rounded-2xl ${mod.color} flex items-center justify-center text-white shadow-md`}>
                               {getModuleIcon(mod.icon, 20)}
                            </div>
                            <h3 className="text-xl font-bold dark:text-white">{mod.title}</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.keys(userData.progress[modId]).map(subId => {
                                const sub = mod.subModules.find(s => s.id === subId);
                                const levels = userData.progress[modId][subId];
                                const maxLvl = Math.max(...Object.keys(levels).map(Number));
                                
                                // Calculate Totals
                                const values = Object.values(levels) as LevelResult[];
                                const totalEarned = values.reduce((acc, curr) => acc + curr.score, 0);
                                const totalPossible = sub ? sub.levels.length * 10 : 700; // 10 per level

                                return (
                                    <div key={subId} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-sm dark:text-white mb-1">{sub?.title || subId}</h4>
                                            <div className="flex gap-1 text-xs text-gray-500 font-medium">
                                                Score: <span className="text-blue-500 font-bold">{totalEarned}</span> / {totalPossible}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lvl {maxLvl}</div>
                                           <div className="flex gap-1 mt-1">
                                             {[1,2,3].map(i => <Star key={i} size={8} className="text-yellow-400" fill={i <= (totalEarned > totalPossible*0.8 ? 3 : totalEarned > totalPossible*0.5 ? 2 : 1) ? "currentColor" : "none"} />)}
                                           </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {Object.keys(userData.progress).length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <BarChart2 size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 font-bold">No data recorded yet.</p>
                </div>
            )}
        </div>
    </div>
  );

  // --- COMPONENT: SUB-MODULE LIST ---
  if (screen === AppScreen.MODULE_DETAIL && activeModule) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
              {/* Header Image/Gradient */}
              <div className={`h-64 bg-gradient-to-br ${activeModule.gradient} p-8 text-white relative flex flex-col justify-end shadow-xl rounded-b-[3rem] overflow-hidden`}>
                   {/* Abstract shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                  
                  <button onClick={() => setScreen(AppScreen.DASHBOARD)} className="absolute top-8 left-6 p-3 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-md transition-colors z-20">
                      <ArrowLeft size={24} />
                  </button>
                  
                  <div className="absolute top-10 right-10 opacity-20 transform scale-150 rotate-12">
                      {getModuleIcon(activeModule.icon, 120)}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg">
                       {getModuleIcon(activeModule.icon, 32)}
                    </div>
                    <h1 className="text-4xl font-black mb-2">{activeModule.title}</h1>
                    <p className="opacity-90 text-lg max-w-xs leading-relaxed">{activeModule.description}</p>
                  </div>
              </div>

              <div className="p-6 grid gap-4 animate-slide-up pb-20 -mt-8 relative z-10">
                  {activeModule.subModules.map(sub => {
                      const percent = getSubModuleProgress(activeModule.id, sub.id, sub.levels.length);
                      
                      return (
                      <button 
                        key={sub.id}
                        onClick={() => { setActiveSubModule(sub); setScreen(AppScreen.LEVEL_SELECT); }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-lg shadow-gray-200/50 dark:shadow-none flex items-center gap-5 border border-white dark:border-gray-800 hover:scale-[1.02] transition-transform"
                      >
                          <div className={`w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors shrink-0`}>
                              {getModuleIcon(sub.icon, 28)}
                          </div>
                          <div className="flex-1 text-left">
                              <h3 className="font-bold text-xl dark:text-white mb-1">{sub.title}</h3>
                              <p className="text-sm text-gray-400 line-clamp-1">{sub.description}</p>
                              
                              <div className="flex items-center gap-2 mt-3">
                                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full ${activeModule.color} transition-all duration-1000`} 
                                        style={{ width: `${percent}%` }}
                                     /> 
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-300 min-w-[30px] text-right">{percent}%</span>
                              </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300">
                             <Play size={16} fill="currentColor" />
                          </div>
                      </button>
                  )})}
              </div>
          </div>
      );
  }

  // --- COMPONENT: LEVEL SELECT ---
  if (screen === AppScreen.LEVEL_SELECT && activeModule && activeSubModule) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
               <header className="p-6 pt-8 bg-white dark:bg-gray-950 sticky top-0 z-10 flex items-center gap-4">
                  <button onClick={() => setScreen(AppScreen.MODULE_DETAIL)} className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                      <ArrowLeft className="dark:text-white" size={24}/>
                  </button>
                  <div className="flex-1">
                      <h2 className="font-black text-2xl dark:text-white leading-none mb-1">{activeSubModule.title}</h2>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Select Difficulty</p>
                  </div>
               </header>
               
               {/* Updated grid to 5 columns for better density with 50 items */}
               <div className="p-6 grid grid-cols-5 gap-3 animate-slide-up overflow-y-auto pb-10">
                  {activeSubModule.levels.map(lvl => {
                      const unlocked = isLevelUnlocked(activeModule.id, activeSubModule.id, lvl.id);
                      const result = getLevelResult(activeModule.id, activeSubModule.id, lvl.id);
                      
                      return (
                          <button
                            key={lvl.id}
                            disabled={!unlocked}
                            onClick={() => { setActiveLevel(lvl); setScreen(AppScreen.TEST_ACTIVE); }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative border transition-all duration-300 group overflow-hidden
                                ${!unlocked 
                                  ? 'bg-gray-100 dark:bg-gray-900 border-transparent opacity-50 grayscale' 
                                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-500'}
                            `}
                          >
                              {/* Level Number */}
                              <div className={`text-xl font-black mb-0
                                 ${result ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}
                              `}>
                                 {unlocked ? lvl.id : <Lock size={16} className="text-gray-400" />}
                              </div>
                              
                              {result && (
                                  <div className="flex flex-col items-center mt-1">
                                    <div className="flex -space-x-1">
                                        {[1,2,3].map(i => <Star key={i} size={8} className="text-yellow-400" fill={result.stars >= i ? "currentColor" : "none"} />)}
                                    </div>
                                    <span className={`text-[9px] font-black mt-0.5 ${result.score === 10 ? 'text-green-500' : 'text-gray-400'}`}>
                                        {result.score}
                                    </span>
                                  </div>
                              )}
                          </button>
                      );
                  })}
               </div>
          </div>
      );
  }

  // --- COMPONENT: ACTIVE TEST WRAPPER ---
  if (screen === AppScreen.TEST_ACTIVE && activeSubModule && activeLevel) {
      return (
          <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col z-50 animate-fade-in">
               <header className="px-6 py-4 flex justify-between items-center bg-white dark:bg-gray-950 sticky top-0 z-20">
                   <button onClick={() => setScreen(AppScreen.LEVEL_SELECT)} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                       <ArrowLeft className="dark:text-white" />
                   </button>
                   <div className="text-center">
                       <h3 className="font-bold dark:text-white text-lg">{activeSubModule.title}</h3>
                       <div className="inline-flex items-center justify-center gap-1 text-[10px] text-blue-600 font-black uppercase bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mt-1 tracking-widest">
                          Level {activeLevel.id}
                       </div>
                   </div>
                   <div className="w-10"></div>
               </header>
               <div className="flex-1 relative bg-gray-50 dark:bg-gray-950">
                   <TestEngine 
                     subModule={activeSubModule} 
                     level={activeLevel} 
                     onComplete={handleLevelComplete}
                     isDarkMode={userData.settings.darkMode}
                   />
               </div>
          </div>
      );
  }

  // --- ROOT: DASHBOARD ---
  if (screen === AppScreen.DASHBOARD) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {currentTab === Tab.HOME && <HomeTab />}
                {currentTab === Tab.HISTORY && <HistoryTab />}
                {currentTab === Tab.SETTINGS && (
                    <div className="p-6 pt-12">
                        <h2 className="text-3xl font-black dark:text-white mb-8">Settings</h2>
                        
                        {/* Install App Section */}
                        <div className="grid gap-4 mb-8">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 shadow-lg text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-xl mb-2">Install App</h3>
                                    <p className="text-blue-100 text-sm mb-4 leading-relaxed">Add to home screen for full experience.</p>
                                    
                                    {isInstalled ? (
                                        <div className="w-full bg-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/30 backdrop-blur-md">
                                            <Check size={18} /> Installed
                                        </div>
                                    ) : (
                                        <button 
                                          onClick={handleInstallClick}
                                          className="w-full bg-white text-blue-600 px-5 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                        >
                                            <Smartphone size={18} /> Add to Home Screen
                                        </button>
                                    )}
                                </div>
                                <div className="absolute -right-6 -bottom-10 opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Logo size={140} /> 
                                </div>
                            </div>
                        </div>

                        {/* Install Guide Modal (For iOS/Unsupported Browsers/Rejections) */}
                        {showInstallGuide && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowInstallGuide(false)}>
                                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setShowInstallGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                        <X size={24} />
                                    </button>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                                            <Shield size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold dark:text-white mb-2">Install Manually</h3>
                                        <p className="text-gray-500 text-sm mb-6">
                                            Browser security prevented automatic installation. Please install manually:
                                        </p>
                                        <div className="text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3 text-sm">
                                            <div className="flex gap-3">
                                                <div className="font-bold text-blue-600">1.</div>
                                                <div className="dark:text-gray-200">Tap your browser menu (<span className="font-bold">⋮</span> or Share).</div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="font-bold text-blue-600">2.</div>
                                                <div className="dark:text-gray-200">Select <span className="font-bold">Add to Home Screen</span> or <span className="font-bold">Install App</span>.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="dark:text-white font-bold text-lg block">Dark Mode</span>
                                    <span className="text-xs text-gray-400">Easier on the eyes at night</span>
                                </div>
                                <button 
                                  onClick={() => setUserData(p => ({...p, settings: {...p.settings, darkMode: !p.settings.darkMode}}))}
                                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${userData.settings.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 shadow-sm ${userData.settings.darkMode ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                            
                            <hr className="border-gray-100 dark:border-gray-800" />
                            
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Zone</h3>
                                <button 
                                  onClick={() => { if(confirm("Reset all progress?")) { setUserData({onboardingComplete:false, progress:{}, totalScore:0, settings:{darkMode:false, soundEnabled:true}}); setScreen(AppScreen.ONBOARDING); }}} 
                                  className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-2xl hover:bg-red-100 transition"
                                >
                                    Reset All Data
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 text-center opacity-30">
                            <Logo size={40} className="mx-auto mb-3 grayscale" />
                            <p className="text-[10px] font-bold tracking-widest">PROPERBODY VERSION 2.2</p>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM NAV */}
            <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-4 pb-8 flex justify-between items-center sticky bottom-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
                <button 
                  onClick={() => setCurrentTab(Tab.HOME)} 
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ${currentTab === Tab.HOME ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Home size={24} strokeWidth={currentTab === Tab.HOME ? 2.5 : 2} />
                    {currentTab === Tab.HOME && <span className="text-sm font-bold">Home</span>}
                </button>
                
                <button 
                  onClick={() => setCurrentTab(Tab.HISTORY)} 
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ${currentTab === Tab.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <BarChart2 size={24} strokeWidth={currentTab === Tab.HISTORY ? 2.5 : 2} />
                    {currentTab === Tab.HISTORY && <span className="text-sm font-bold">Stats</span>}
                </button>
                
                <button 
                  onClick={() => setCurrentTab(Tab.SETTINGS)} 
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ${currentTab === Tab.SETTINGS ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Settings size={24} strokeWidth={currentTab === Tab.SETTINGS ? 2.5 : 2} />
                    {currentTab === Tab.SETTINGS && <span className="text-sm font-bold">Set</span>}
                </button>
            </div>
        </div>
    );
  }

  return <Onboarding />;
};

export default App;