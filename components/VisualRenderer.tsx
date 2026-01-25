import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SubTestType, SubModule, GameLevel } from '../types';
import { randomString } from '../constants';
import { 
    Wind, Zap, Eye, Volume2, Play, Brain, Star, ArrowRight, Check, X, 
    Headphones, Activity, ArrowUp, ArrowDown, ArrowLeft, MousePointer, 
    Clock, Square, Heart, Timer, Hand, ShieldAlert,
    Triangle, Circle, Hexagon, Diamond, Ear, Mic, RefreshCw, Sun, Pause,
    Target
} from 'lucide-react';

interface Props {
  subModule: SubModule;
  level: GameLevel;
  onComplete: (score: number, passed: boolean) => void;
  isDarkMode: boolean;
}

// --- CONSTANTS ---
const WORDS_POOL = ["ARM", "BIRD", "CAKE", "DOOR", "EAT", "FISH", "GOAT", "HAND", "ICE", "JUMP", "KEY", "LION", "MOON", "NEST", "OWL", "PEN", "QUEEN", "RAIN", "SUN", "TREE", "UP", "VAN", "WIND", "BOX", "YARD", "ZOO"];

// --- AUDIO SYSTEM ---
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let sharedAudioCtx: AudioContext | null = null;
let activeOscillators: AudioNode[] = []; // Track active sounds to stop them

const getAudioCtx = () => {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContextClass();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    return sharedAudioCtx;
};

const stopAudio = () => {
    try {
        activeOscillators.forEach(node => {
            try { (node as any).stop(); } catch(e) {}
            try { node.disconnect(); } catch(e) {}
        });
        activeOscillators = [];
    } catch (e) { console.error(e); }
};

const playTone = (freq: number, type: OscillatorType, dur: number, vol: number = 0.1, pan: number = 0, startTime: number = 0) => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        let connectNode: AudioNode = gain;

        if (ctx.createStereoPanner && pan !== 0) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = pan;
            osc.connect(panner);
            panner.connect(gain);
        } else {
            osc.connect(gain);
        }
        
        gain.connect(ctx.destination);
        
        const start = ctx.currentTime + startTime;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.02); // Fast Attack
        gain.gain.setValueAtTime(vol, start + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0.001, start + dur); // Release
        
        osc.start(start);
        osc.stop(start + dur + 0.1);
        
        activeOscillators.push(osc);
        osc.onended = () => {
            const idx = activeOscillators.indexOf(osc);
            if (idx > -1) activeOscillators.splice(idx, 1);
        };
    } catch (e) {
        console.error("Audio error", e);
    }
};

const playNoise = (duration: number, volume: number) => {
    try {
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        
        activeOscillators.push(noise);
    } catch(e) { console.error(e); }
};

const vibrate = (ms: number) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

// --- VISION CANVAS RENDERER ---
const drawVision = (canvas: HTMLCanvasElement, text: string, type: SubTestType, difficulty: number, isDarkMode: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Setup
    const size = 800;
    canvas.width = size;
    canvas.height = size;
    const bg = isDarkMode ? '#111827' : '#ffffff';
    const fg = isDarkMode ? '#ffffff' : '#000000';
    
    // Reset & Clear
    ctx.clearRect(0,0,size,size);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // -- ISHIHARA (Color Blindness) --
    if (type === SubTestType.VIS_COLOR) {
        const hueBase = Math.random() * 360;
        // Difficulty 0 = 180deg shift (opposite), Difficulty 1 = 15deg shift (very close)
        const hueDiff = Math.max(10, 160 * (1 - difficulty)); 
        const hueText = (hueBase + hueDiff) % 360;

        // 1. Draw Text (Mask)
        ctx.font = `900 ${size*0.55}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(text, size/2, size/2 + size*0.04);

        // 2. Draw Dots in Text (Source-In)
        ctx.globalCompositeOperation = 'source-in';
        for(let i=0; i<3000; i++) {
             const h = hueText + (Math.random()*20 - 10);
             const s = 60 + Math.random()*40;
             const l = isDarkMode ? 40 + Math.random()*20 : 50 + Math.random()*20;
             ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
             ctx.beginPath();
             ctx.arc(Math.random()*size, Math.random()*size, Math.random()*8+2, 0, Math.PI*2);
             ctx.fill();
        }

        // 3. Draw Dots Background (Destination-Over)
        ctx.globalCompositeOperation = 'destination-over';
        for(let i=0; i<8000; i++) {
             const h = hueBase + (Math.random()*20 - 10);
             const s = 60 + Math.random()*40;
             const l = isDarkMode ? 40 + Math.random()*20 : 50 + Math.random()*20;
             ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
             ctx.beginPath();
             ctx.arc(Math.random()*size, Math.random()*size, Math.random()*8+2, 0, Math.PI*2);
             ctx.fill();
        }
        
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,size,size); // Fill gaps
        return;
    }

    // -- STANDARD TEXT PARAMETERS --
    // Acuity: Size drops from 400px to 8px
    let fontSize = type === SubTestType.VIS_ACUITY 
        ? Math.max(8, 400 * Math.pow(0.05, difficulty)) 
        : 250; 
        
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fg;

    // -- EFFECTS --
    if (type === SubTestType.VIS_CONTRAST) {
        // Opacity drops from 1.0 to 0.005
        const opacity = Math.max(0.004, 0.8 * Math.pow(0.01, difficulty));
        ctx.fillStyle = isDarkMode ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
    }
    
    if (type === SubTestType.VIS_FOCUS) {
        const blur = difficulty * 20; // 0px to 20px
        ctx.filter = `blur(${blur}px)`;
    }
    
    if (type === SubTestType.VIS_GLARE) {
        ctx.shadowColor = fg;
        ctx.shadowBlur = 50 + difficulty * 200;
        // Whiteout background for glare
        if (isDarkMode) {
             ctx.fillStyle = `rgba(255,255,255, ${0.1 + difficulty * 0.3})`;
             ctx.fillRect(0,0,size,size);
             ctx.fillStyle = '#fff';
        }
    }

    // -- DRAWING --
    if (type === SubTestType.VIS_GHOSTING) {
        const offset = 4 + difficulty * 60;
        ctx.globalAlpha = 0.5;
        ctx.fillText(text, size/2 - offset, size/2);
        ctx.fillText(text, size/2 + offset, size/2);
    } 
    else if (type === SubTestType.VIS_CROWDING) {
        ctx.fillText(text, size/2, size/2);
        // Draw distracting letters around
        const dist = fontSize * (1.2 - difficulty * 0.5); // Get closer
        ctx.font = `bold ${fontSize*0.8}px sans-serif`;
        const dChars = randomString(4);
        ctx.fillText(dChars[0], size/2 - dist, size/2 - dist);
        ctx.fillText(dChars[1], size/2 + dist, size/2 - dist);
        ctx.fillText(dChars[2], size/2 - dist, size/2 + dist);
        ctx.fillText(dChars[3], size/2 + dist, size/2 + dist);
    }
    else {
        ctx.fillText(text, size/2, size/2);
    }
    
    // -- POST EFFECTS --
    if (type === SubTestType.VIS_NOISE) {
        ctx.filter = 'none';
        const imgData = ctx.getImageData(0,0,size,size);
        const data = imgData.data;
        const noiseAmount = difficulty * 255;
        for(let i=0; i<data.length; i+=4) {
             if (Math.random() > 0.5) {
                 const n = (Math.random() - 0.5) * noiseAmount;
                 data[i] += n; data[i+1] += n; data[i+2] += n;
             }
        }
        ctx.putImageData(imgData, 0, 0);
    }
    
    if (type === SubTestType.VIS_PATTERN) {
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-atop';
        ctx.strokeStyle = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2 + difficulty * 4;
        const lines = 20 + difficulty * 100;
        ctx.beginPath();
        for(let i=0; i<lines; i++) {
            ctx.moveTo(Math.random()*size, Math.random()*size);
            ctx.lineTo(Math.random()*size, Math.random()*size);
        }
        ctx.stroke();
    }
};

export const TestEngine: React.FC<Props> = ({ subModule, level, onComplete, isDarkMode }) => {
    // --- STATE MANAGEMENT ---
    const [phase, setPhase] = useState<'INTRO' | 'GAME' | 'RESULT'>('INTRO');
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    
    const [target, setTarget] = useState<any>(null);
    const [userInput, setUserInput] = useState<any>('');
    const [gameState, setGameState] = useState<any>({}); 
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerRef = useRef<any>(null);
    const startTimeRef = useRef(0);
    const animRef = useRef<any>(null);

    // Reset when level changes
    useEffect(() => {
        stopAudio();
        cleanup();
        setPhase('INTRO');
        setScore(0);
        setFeedback('');
        setGameState({});
        setUserInput('');
        return () => stopAudio(); // Safety
    }, [subModule, level]);

    const cleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (animRef.current) cancelAnimationFrame(animRef.current);
    };

    // --- GAME CONTROL ---
    const startGame = () => {
        // Ensure audio context is ready on user interaction
        if (subModule.id.startsWith('HEARING') || subModule.id.startsWith('REFLEX') || subModule.id.startsWith('MEM')) {
            getAudioCtx();
        }

        // Directly Start Game (Skipping Ready Screen as requested)
        setPhase('GAME');
        initGameLogic();
    };

    const finish = (rawScore: number, passed: boolean, msg: string) => {
        cleanup();
        stopAudio();
        setScore(Math.min(10, Math.max(0, rawScore)));
        setFeedback(msg);
        setPhase('RESULT');
    };

    const initGameLogic = () => {
        setGameState({});
        setUserInput('');
        stopAudio(); // Clear any previous sounds
        startTimeRef.current = Date.now();

        // --- VISION INIT ---
        if (subModule.id.startsWith('VIS')) {
            const txt = randomString(1);
            setTarget(txt);
            // Wait for DOM
            setTimeout(() => {
                if (canvasRef.current) {
                    drawVision(canvasRef.current, txt, subModule.id, level.difficulty, isDarkMode);
                    // Speed Test: Flash canvas then clear
                    if (subModule.id === SubTestType.VIS_SPEED) {
                        const flashTime = Math.max(16, 500 - (level.difficulty * 480)); // 500ms -> 20ms
                        setTimeout(() => {
                            if (canvasRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                if(ctx) { 
                                    ctx.clearRect(0,0,800,800); 
                                    ctx.fillStyle = isDarkMode?'#111827':'#fff'; 
                                    ctx.fillRect(0,0,800,800); 
                                }
                            }
                        }, flashTime);
                    }
                }
            }, 50);
        }

        // --- BREATH INIT ---
        else if (subModule.id.startsWith('BREATH')) {
            const isGuided = [SubTestType.BREATH_RHYTHM, SubTestType.BREATH_SQUARE, SubTestType.BREATH_COHERENCE, SubTestType.BREATH_DEEP].includes(subModule.id);

            if (isGuided) {
                let inhale=4, hold=0, exhale=4, wait=0;
                if (subModule.id === SubTestType.BREATH_SQUARE) { inhale=4; hold=4; exhale=4; wait=4; }
                if (subModule.id === SubTestType.BREATH_RHYTHM) { inhale=4; hold=7; exhale=8; wait=0; }
                if (subModule.id === SubTestType.BREATH_DEEP) { inhale=5; hold=3; exhale=7; wait=0; }
                if (subModule.id === SubTestType.BREATH_COHERENCE) { inhale=6; hold=0; exhale=6; wait=0; }

                const cycles = 3 + Math.floor(level.difficulty * 5); // Increase cycles with level
                
                setGameState({ 
                    mode: 'GUIDED', 
                    config: { inhale, hold, exhale, wait },
                    phase: 'GET READY',
                    duration: 2,
                    cyclesLeft: cycles,
                    instruction: "Get Comfortable"
                });
                
                // Helper to run phases recursively
                const runPhase = (p: string, duration: number, next: () => void) => {
                     setGameState((prev:any) => ({ ...prev, phase: p, duration: duration }));
                     timerRef.current = setTimeout(next, duration * 1000);
                };

                const runCycle = (remaining: number) => {
                    if (remaining <= 0) {
                        finish(10, true, "Session Complete");
                        return;
                    }
                    
                    setGameState((p:any) => ({...p, cyclesLeft: remaining}));
                    
                    // Start Cycle: Inhale -> Hold? -> Exhale -> Wait?
                    runPhase('INHALE', inhale, () => {
                         const nextAfterHold = () => {
                             runPhase('EXHALE', exhale, () => {
                                 const nextAfterWait = () => {
                                     runCycle(remaining - 1);
                                 };
                                 if (wait > 0) runPhase('WAIT', wait, nextAfterWait);
                                 else nextAfterWait();
                             });
                         };
                         if (hold > 0) runPhase('HOLD', hold, nextAfterHold);
                         else nextAfterHold();
                    });
                };

                // Start first cycle after delay
                timerRef.current = setTimeout(() => runCycle(cycles), 2000);
            }
            else if (subModule.id === SubTestType.BREATH_HOLD) {
                setGameState({ mode: 'HOLD', status: 'IDLE', time: 0 });
            } 
            else if (subModule.id === SubTestType.BREATH_TIMING) {
                // Goal: Tap after exactly X seconds (hidden timer)
                const goal = 5 + Math.floor(Math.random() * 10) + Math.floor(level.difficulty * 15);
                setTarget(goal);
                setGameState({ mode: 'TIMING', status: 'IDLE', time: 0 });
            }
            else {
                // Active / Exhale / Count / Generic
                setGameState({ mode: 'ACTIVE_GENERIC', status: 'IDLE', startTime: 0 });
            }
        }

        // --- REFLEX INIT ---
        else if (subModule.id.startsWith('REFLEX')) {
             if (subModule.id === SubTestType.REFLEX_GRID) {
                 // Whack-a-mole: 10 targets
                 const total = 10;
                 // Delay between 1000ms and 300ms based on difficulty
                 const speed = Math.max(300, 1000 - (level.difficulty * 700)); 
                 
                 setGameState({ 
                    mode: 'GRID',
                    score: 0, 
                    totalShown: 0, 
                    maxTargets: total, 
                    activeTile: -1,
                    speed: speed,
                    gameActive: true
                 });
                 
                 // Start loop
                 const nextTile = () => {
                     setGameState((prev:any) => {
                         if (!prev.gameActive) return prev;
                         if (prev.totalShown >= prev.maxTargets) {
                             // End Game
                             finish(Math.max(0, prev.score), true, `${prev.score}/${prev.maxTargets} Hits`);
                             return { ...prev, activeTile: -1, gameActive: false };
                         }
                         
                         const next = Math.floor(Math.random() * 9);
                         timerRef.current = setTimeout(() => {
                             setGameState((p:any) => {
                                 // Auto miss if not clicked logic could go here, but for now we just move on
                                 return { ...p, activeTile: -1 };
                             });
                             // Short pause before next to allow UI to reset
                             setTimeout(() => {
                                  nextTile(); // Recurse
                             }, 150);
                         }, prev.speed);
                         
                         return { ...prev, activeTile: next, totalShown: prev.totalShown + 1 };
                     });
                 };
                 // Initial Delay
                 timerRef.current = setTimeout(nextTile, 1000);
             }
             else if (subModule.id === SubTestType.REFLEX_SEQUENCE) {
                 const count = 4 + Math.floor(level.difficulty * 4); // 4 to 8 items
                 // Grid based positions to prevent overlap (3x4 grid = 12 slots)
                 const slots = Array.from({length: 12}, (_,i) => i).sort(() => Math.random() - 0.5).slice(0, count);
                 const items = slots.map((slot, i) => ({
                     id: i + 1,
                     x: (slot % 3) * 30 + 5 + Math.random() * 10, // 3 cols, ~33% width
                     y: Math.floor(slot / 3) * 20 + 10 + Math.random() * 5 // 4 rows, ~25% height
                 }));
                 
                 setGameState({ items, next: 1, startTime: Date.now() });
             }
             else if (subModule.id === SubTestType.REFLEX_MATH) {
                 const ops = ['+', '-'];
                 const op = ops[Math.floor(Math.random() * ops.length)];
                 const a = Math.floor(Math.random() * 20) + 1;
                 const b = Math.floor(Math.random() * 20) + 1;
                 const ans = op === '+' ? a + b : a - b;
                 
                 // Generate distinct options
                 const wrong1 = ans + Math.floor(Math.random() * 5) + 1;
                 const wrong2 = ans - Math.floor(Math.random() * 5) - 1;
                 const opts = [ans, wrong1, wrong2].sort(() => Math.random() - 0.5);
                 
                 setGameState({ q: `${a} ${op} ${b}`, ans, opts, startTime: Date.now() });
             }
             else if (subModule.id === SubTestType.REFLEX_COLOR) {
                 // Stroop
                 const colors = [
                     { name: 'RED', class: 'text-red-500' }, 
                     { name: 'BLUE', class: 'text-blue-500' }, 
                     { name: 'GREEN', class: 'text-green-500' },
                     { name: 'YELLOW', class: 'text-yellow-500' }
                 ];
                 const textObj = colors[Math.floor(Math.random() * colors.length)];
                 const colorObj = colors[Math.floor(Math.random() * colors.length)];
                 const isMatch = textObj.name === colorObj.name;
                 // 50% chance to force match if it's not (to balance the game)
                 let finalColor = colorObj;
                 if (Math.random() > 0.5 && !isMatch) finalColor = textObj;
                 
                 setGameState({ 
                     text: textObj.name, 
                     colorClass: finalColor.class, 
                     match: textObj.name === finalColor.name,
                     startTime: Date.now()
                 });
             }
             else if (subModule.id === SubTestType.REFLEX_SHAKE) {
                 // Rapid Taps (Simulating shake as it's more reliable on web)
                 setGameState({ taps: 0, timeLeft: 5, active: true });
                 timerRef.current = setInterval(() => {
                     setGameState((p:any) => {
                         if (p.timeLeft <= 1) { 
                             clearInterval(timerRef.current); 
                             // Score: 30 taps = 10pts
                             const score = Math.min(10, Math.floor(p.taps / 3));
                             finish(score, true, `${p.taps} Taps in 5s`); 
                             return { ...p, timeLeft: 0, active: false }; 
                         }
                         return { ...p, timeLeft: p.timeLeft - 1 };
                     });
                 }, 1000);
             }
             else if (subModule.id === SubTestType.REFLEX_MOVING) {
                 // Bouncing Ball
                 const speed = 1 + (level.difficulty * 2.5);
                 setGameState({ 
                    status: 'PLAYING', 
                    x: 50, y: 50, 
                    dx: (Math.random()>0.5?1:-1) * speed, 
                    dy: (Math.random()>0.5?1:-1) * speed,
                    startTime: Date.now()
                 });
                 
                 const loop = () => {
                    setGameState((p:any) => {
                        if (p.status !== 'PLAYING') return p;
                        
                        let nx = p.x + p.dx;
                        let ny = p.y + p.dy;
                        
                        // Bounce off edges (keep within 5% - 95%)
                        if(nx <= 5 || nx >= 90) p.dx *= -1; 
                        if(ny <= 5 || ny >= 90) p.dy *= -1;
                        
                        return {...p, x: nx, y: ny};
                    });
                    animRef.current = requestAnimationFrame(loop);
                 };
                 animRef.current = requestAnimationFrame(loop);
             }
             else if (subModule.id === SubTestType.REFLEX_CHOICE) {
                 // Go / No-Go (Choice)
                 setGameState({ status: 'WAIT' });
                 const delay = 2000 + Math.random() * 3000;
                 timerRef.current = setTimeout(() => {
                     const isGo = Math.random() > 0.4; // 60% Go
                     setGameState({ status: 'GO', targetType: isGo ? 'GREEN' : 'RED', startTime: Date.now() });
                     
                     // If RED, wait 2s to win
                     if (!isGo) {
                         setTimeout(() => {
                             // If still on this screen and haven't failed
                             setGameState((curr:any) => {
                                 if (curr.status === 'GO') { // User didn't tap
                                     finish(10, true, "Good inhibition!");
                                 }
                                 return curr;
                             });
                         }, 1500);
                     }
                 }, delay);
             }
             else {
                 // Standard Visual/Audio/Stop
                 setGameState({ status: 'WAIT' });
                 const delay = 1500 + Math.random() * 3000;
                 timerRef.current = setTimeout(() => {
                     setGameState({ status: 'GO', startTime: Date.now() });
                     if (subModule.id === SubTestType.REFLEX_AUDIO) {
                         playTone(800, 'square', 0.2);
                     }
                 }, delay);
             }
        }

        // --- HEARING INIT ---
        else if (subModule.id.startsWith('HEARING')) {
            setGameState({ playing: true });
            
            setTimeout(() => {
                if (subModule.id === SubTestType.HEARING_FREQ) {
                    const hasSound = Math.random() > 0.5;
                    setTarget(hasSound);
                    
                    if (hasSound) {
                        const freq = 8000 + (level.difficulty * 8000); 
                        playTone(freq, 'sine', 1.0, 0.8);
                    }
                    setTimeout(() => setGameState(p=>({...p, playing: false})), 1200);
                } 
                else if (subModule.id === SubTestType.HEARING_VOLUME) {
                    const hasSound = Math.random() > 0.5;
                    setTarget(hasSound);

                    if (hasSound) {
                        const vol = 0.1 * (1 - (level.difficulty * 0.98));
                        playTone(1000, 'sine', 0.8, vol);
                    }
                    setTimeout(() => setGameState(p=>({...p, playing: false})), 1200);
                }
                else if (subModule.id === SubTestType.HEARING_PITCH) {
                    const base = 440;
                    const diff = Math.max(5, 50 * (1 - level.difficulty)); 
                    const isHigh = Math.random() > 0.5;
                    setTarget(isHigh ? 'HIGH' : 'LOW');
                    
                    playTone(base, 'sine', 0.4);
                    setTimeout(() => playTone(isHigh ? base+diff : base-diff, 'sine', 0.4), 600);
                    setTimeout(() => setGameState(p=>({...p, playing: false})), 1200);
                }
                else if (subModule.id === SubTestType.HEARING_STEREO) {
                    const isLeft = Math.random() > 0.5;
                    setTarget(isLeft ? 'LEFT' : 'RIGHT');
                    playTone(500, 'triangle', 0.8, 0.5, isLeft ? -1 : 1);
                    setTimeout(() => setGameState(p=>({...p, playing: false})), 1000);
                }
                else if (subModule.id === SubTestType.HEARING_RHYTHM) {
                    const bpm = 80 + Math.floor(level.difficulty * 60);
                    const interval = 60000 / bpm;
                    
                    setGameState({ playing: true, beatsLeft: 3, interval: interval });
                    
                    let beatCount = 0;
                    const beatLoop = () => {
                        if (beatCount < 3) {
                            playTone(800, 'square', 0.1, 0.2);
                            beatCount++;
                            timerRef.current = setTimeout(beatLoop, interval);
                        } else {
                            const expectedTime = Date.now() + interval;
                            setGameState({ playing: false, mode: 'WAIT_FOR_TAP', expectedTime: expectedTime, interval: interval });
                        }
                    };
                    beatLoop();
                    return;
                }
                else if (subModule.id === SubTestType.HEARING_NOISE) {
                    const hasTone = Math.random() > 0.5;
                    setTarget(hasTone);
                    playNoise(1.5, 0.2 + level.difficulty * 0.3);
                    if (hasTone) {
                        setTimeout(() => playTone(1000, 'sine', 0.5, 0.1), 500);
                    }
                    setTimeout(() => setGameState(p=>({...p, playing: false})), 1600);
                }
                else if (subModule.id === SubTestType.HEARING_MEMORY) {
                    const len = 3 + Math.floor(level.difficulty * 4);
                    const seq = Array.from({length:len}, () => Math.random()>0.5?'H':'L');
                    setTarget(seq);
                    setGameState({ playing: true, seq, userSeq: [] });
                    
                    let i = 0;
                    const iv = setInterval(() => {
                        if (i >= len) { clearInterval(iv); setGameState(p=>({...p, playing:false})); return; }
                        playTone(seq[i]==='H'?880:440, 'sine', 0.4, 0.3);
                        i++;
                    }, 800);
                    timerRef.current = iv;
                    return;
                }
                
            }, 500);
        }

        // --- MEMORY INIT ---
        else if (subModule.id.startsWith('MEM')) {
            const diff = Math.floor(level.difficulty * 5) + 3; // 3 to 8
            
            if (subModule.id === SubTestType.MEM_NUMBERS) {
                const num = Array.from({length: diff}, () => Math.floor(Math.random()*10)).join('');
                setTarget(num);
                setGameState({ showing: true });
                setTimeout(() => setGameState({ showing: false }), 1500 + diff * 500);
            }
            else if (subModule.id === SubTestType.MEM_WORDS) {
                const count = Math.min(WORDS_POOL.length, diff);
                const words = [...WORDS_POOL].sort(()=>Math.random()-0.5).slice(0, count);
                setTarget(words);
                setGameState({ showing: true, selected: [] });
                setTimeout(() => setGameState((p:any)=>({...p, showing:false})), 2000 + count * 600);
            }
            else if (subModule.id === SubTestType.MEM_NBACK) {
                const len = 10 + diff * 2;
                const pool = ['A','B','C'];
                const seq = Array.from({length: len}, () => pool[Math.floor(Math.random()*pool.length)]);
                setGameState({ seq, idx: 0, score: 0, current: null });
                
                const next = (i: number, s: number) => {
                    if (i >= len) { finish(Math.min(10, Math.floor(s/2)), true, `Score: ${s}`); return; }
                    setGameState({ seq, idx: i, score: s, current: seq[i], showing: true });
                    setTimeout(() => {
                        setGameState((p:any)=>({...p, showing: false}));
                        setTimeout(() => next(i+1, s), 500);
                    }, 1500);
                };
                setTimeout(() => next(0,0), 1000);
            }
            else if (subModule.id === SubTestType.MEM_PAIRS) {
                const pairs = Math.min(8, diff + 2);
                const cards = Array.from({length: pairs}, (_,i)=>i);
                const deck = [...cards, ...cards].sort(()=>Math.random()-0.5);
                setGameState({ deck, matched: [], selected: [], locked: false });
            }
            else {
                // Sequence types (Simon, Path, etc)
                let seq: any[] = [];
                if (subModule.id === SubTestType.MEM_POSITIONS || subModule.id === SubTestType.MEM_PATH) 
                    seq = Array.from({length: diff}, () => Math.floor(Math.random()*9));
                else 
                    seq = Array.from({length: diff}, () => Math.floor(Math.random()*4));
                
                setTarget(seq);
                setGameState({ showing: true, userSeq: [], activeItem: null });
                
                let i = 0;
                const iv = setInterval(() => {
                    if (i >= diff) { clearInterval(iv); setGameState((p:any)=>({...p, showing: false, activeItem: null})); return; }
                    
                    const val = seq[i];
                    setGameState((p:any)=>({...p, activeItem: val}));
                    
                    // Audio
                    if (subModule.id === SubTestType.MEM_AUDIO || subModule.id === SubTestType.MEM_SEQUENCE) 
                        playTone([300,500,700,900][val], 'sine', 0.2);

                    setTimeout(() => setGameState((p:any)=>({...p, activeItem: null})), 500);
                    i++;
                }, 1000);
                timerRef.current = iv;
            }
        }
    };

    // --- INPUT HANDLERS ---
    const handleVisionInput = () => {
        if (userInput.toUpperCase() === target) {
             const time = (Date.now() - startTimeRef.current) / 1000;
             // Faster = Better
             const bonus = Math.max(0, 5 - time);
             finish(Math.min(10, 5 + Math.floor(bonus)), true, `Time: ${time.toFixed(2)}s`);
        } else {
             finish(0, false, `Incorrect. Was: ${target}`);
        }
    };

    const handleHearingInput = (val: any) => {
        // Special case for Rhythm
        if (subModule.id === SubTestType.HEARING_RHYTHM) {
            if (gameState.mode !== 'WAIT_FOR_TAP') return;
            
            const tapTime = Date.now();
            const diff = Math.abs(tapTime - gameState.expectedTime);
            // Margin of error based on interval (25% window)
            const margin = gameState.interval * 0.35; 
            
            if (diff < margin) {
                // Precision bonus
                const score = 10 - Math.floor((diff / margin) * 5);
                finish(Math.max(5, score), true, `Perfect! off by ${diff}ms`);
            } else {
                finish(0, false, `Too ${tapTime < gameState.expectedTime ? 'early' : 'late'} by ${diff}ms`);
            }
            return;
        }

        if (subModule.id === SubTestType.HEARING_MEMORY) {
             const idx = gameState.userSeq.length;
             if (val !== target[idx]) {
                 finish(0, false, "Wrong Tone");
                 return;
             }
             playTone(val==='H'?880:440, 'sine', 0.2, 0.2);
             const ns = [...gameState.userSeq, val];
             setGameState((p:any) => ({...p, userSeq: ns}));
             if (ns.length === target.length) finish(10, true, "Perfect");
             return;
        }

        // Generic checks (Frequency, Volume, Pitch, Stereo, Noise)
        if (val === target) {
            finish(10, true, "Correct");
        } else {
            finish(0, false, "Incorrect");
        }
    };

    const handleReflexInput = (val?: any) => {
        // Prevent interaction if phase is RESULT or INTRO (safety)
        if (phase !== 'GAME') return;

        // --- GRID ---
        if (subModule.id === SubTestType.REFLEX_GRID) {
            if (val === gameState.activeTile) {
                setGameState((p:any) => ({ 
                    ...p, 
                    score: p.score+1, 
                    activeTile: -1 // Hide immediately to prevent double tap
                }));
                vibrate(20);
            }
            return;
        }

        // --- SEQUENCE ---
        if (subModule.id === SubTestType.REFLEX_SEQUENCE) {
             if (val === gameState.next) {
                 if (gameState.next === gameState.items.length) {
                     const time = Date.now() - gameState.startTime;
                     finish(Math.max(0, 10 - Math.floor(time/1000)), true, `${(time/1000).toFixed(2)}s`);
                 } else {
                     setGameState((p:any) => ({...p, next: p.next+1}));
                 }
             } else {
                 finish(0, false, "Wrong Order");
             }
             return;
        }

        // --- MATH ---
        if (subModule.id === SubTestType.REFLEX_MATH) {
             const isCorrect = val === gameState.ans;
             const time = Date.now() - gameState.startTime;
             if (isCorrect) finish(Math.max(0, 10 - Math.floor(time/1000)), true, `${time}ms`);
             else finish(0, false, "Wrong Answer");
             return;
        }

        // --- COLOR ---
        if (subModule.id === SubTestType.REFLEX_COLOR) {
            const isMatch = val === 'MATCH';
            const correct = gameState.match === isMatch;
            const time = Date.now() - gameState.startTime;
            if (correct) finish(Math.max(0, 10 - Math.floor(time/500)), true, `${time}ms`);
            else finish(0, false, "Wrong");
            return;
        }

        // --- SHAKE / RAPID TAP ---
        if (subModule.id === SubTestType.REFLEX_SHAKE) {
             if (gameState.active) {
                 setGameState((p:any) => ({...p, taps: p.taps+1}));
                 vibrate(10);
             }
             return;
        }

        // --- MOVING ---
        if (subModule.id === SubTestType.REFLEX_MOVING) {
             if (gameState.status === 'PLAYING') {
                cancelAnimationFrame(animRef.current);
                const time = Date.now() - gameState.startTime;
                finish(Math.max(0, 10 - Math.floor(time/2000)), true, `${(time/1000).toFixed(2)}s`);
             }
             return;
        }

        // --- CHOICE (STOP/GO) ---
        if (subModule.id === SubTestType.REFLEX_CHOICE) {
            if (gameState.status === 'WAIT') {
                finish(0, false, "Too Early!");
                return;
            }
            if (gameState.status === 'GO') {
                if (gameState.targetType === 'RED') {
                    finish(0, false, "Don't tap Red!");
                } else {
                    const diff = Date.now() - gameState.startTime;
                    finish(Math.max(0, 10 - Math.floor(diff/100)), true, `${diff}ms`);
                }
            }
            return;
        }
        
        // --- BASIC REACTION (Visual/Audio/Stop) ---
        if (gameState.status === 'WAIT') {
             finish(0, false, "Too Early!");
        } else if (gameState.status === 'GO') {
             const diff = Date.now() - gameState.startTime;
             finish(Math.max(0, 10 - Math.floor(diff/100)), true, `${diff}ms`);
        }
    };

    const handleMemoryInput = (val: any) => {
        if (gameState.showing) return;

        // Numbers
        if (subModule.id === SubTestType.MEM_NUMBERS) {
            if (val === 'DEL') setUserInput((s:string) => s.slice(0,-1));
            else if (val === 'OK') {
                if (userInput === target) finish(10, true, "Correct!");
                else finish(0, false, `Was ${target}`);
            }
            else setUserInput((s:string) => s+val);
            return;
        }
        
        // Words
        if (subModule.id === SubTestType.MEM_WORDS) {
            if (gameState.selected.includes(val)) return;
            const newSel = [...gameState.selected, val];
            setGameState((p:any) => ({...p, selected: newSel}));
            
            if (!target.includes(val)) {
                finish(0, false, "Wrong Word");
                return;
            }
            if (newSel.length === target.length) finish(10, true, "Perfect Recall");
            return;
        }

        // Pairs
        if (subModule.id === SubTestType.MEM_PAIRS) {
            if (gameState.locked || gameState.matched.includes(val) || gameState.selected.includes(val)) return;
            const newSel = [...gameState.selected, val];
            setGameState((p:any) => ({...p, selected: newSel}));
            
            if (newSel.length === 2) {
                setGameState((p:any) => ({...p, locked: true}));
                const [a,b] = newSel;
                if (gameState.deck[a] === gameState.deck[b]) {
                     setTimeout(() => {
                         setGameState((p:any) => {
                             const nm = [...p.matched, a, b];
                             if (nm.length === p.deck.length) finish(10, true, "All Matched");
                             return { ...p, matched: nm, selected: [], locked: false };
                         });
                     }, 500);
                } else {
                     setTimeout(() => setGameState((p:any) => ({...p, selected: [], locked: false})), 1000);
                }
            }
            return;
        }
        
        // N-Back
        if (subModule.id === SubTestType.MEM_NBACK) {
             if (gameState.answered) return;
             const prev = gameState.seq[gameState.idx - 1];
             const curr = gameState.seq[gameState.idx];
             if (prev === curr) {
                 setGameState((p:any) => ({...p, score: p.score+2, answered: true}));
             } else {
                 setGameState((p:any) => ({...p, score: p.score-1, answered: true}));
             }
             return;
        }

        // Sequences
        playTone(600, 'sine', 0.1);
        const idx = gameState.userSeq.length;
        if (val !== target[idx]) {
            finish(0, false, "Wrong Sequence");
            return;
        }
        const ns = [...gameState.userSeq, val];
        setGameState((p:any) => ({...p, userSeq: ns}));
        if (ns.length === target.length) finish(10, true, "Perfect");
    };

    // --- RENDER ---
    
    // 1. INTRO SCREEN
    if (phase === 'INTRO') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-6">
                    <Activity size={48} />
                </div>
                <h1 className="text-3xl font-black dark:text-white mb-2">Level {level.id}</h1>
                <p className="text-gray-500 mb-8 max-w-xs">{subModule.description}</p>
                <button onClick={startGame} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform flex gap-2 items-center">
                    <Play fill="currentColor" /> Start
                </button>
            </div>
        );
    }

    // 2. RESULT SCREEN
    if (phase === 'RESULT') {
         return (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-slide-up">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center">
                    <div className="flex justify-center gap-2 mb-6">
                        {[1,2,3].map(i => <Star key={i} size={40} className={i <= (score>=9?3:score>=7?2:1) && score > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'} />)}
                    </div>
                    <h2 className="text-2xl font-black dark:text-white">{score > 0 ? "PASSED" : "FAILED"}</h2>
                    <div className={`text-6xl font-black my-4 ${score > 0 ? 'text-blue-500' : 'text-red-500'}`}>{score}<span className="text-2xl text-gray-400">/10</span></div>
                    <p className="text-gray-500 mb-8 font-medium">{feedback}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={()=>setPhase('INTRO')} className="py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-200">Retry</button>
                        <button onClick={()=>onComplete(score, score>0)} className="py-3 bg-blue-600 text-white rounded-xl font-bold">Next</button>
                    </div>
                </div>
            </div>
         );
    }

    // 3. GAME RENDERING
    
    // --- VISION ---
    if (subModule.id.startsWith('VIS')) {
         return (
             <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
                 <div className="flex-1 flex items-center justify-center p-4">
                     <div className="w-full max-w-sm aspect-square bg-white shadow-xl rounded-3xl overflow-hidden border-4 border-white dark:border-gray-800 relative">
                         <canvas ref={canvasRef} className="w-full h-full" />
                         {subModule.id === SubTestType.VIS_SPEED && <div className="absolute inset-0 pointer-events-none border-4 border-blue-500/20 rounded-3xl" />}
                     </div>
                 </div>
                 <div className="p-6 bg-white dark:bg-gray-900 rounded-t-[2rem] shadow-lg">
                     <p className="text-center text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Type What You Saw</p>
                     <div className="flex gap-4">
                         <input 
                           autoFocus 
                           value={userInput} 
                           onChange={e => setUserInput(e.target.value)} 
                           className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl text-center text-4xl font-black uppercase focus:ring-4 ring-blue-500/20 outline-none" 
                           maxLength={1}
                         />
                         <button onClick={handleVisionInput} className="flex-1 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform">
                             CHECK
                         </button>
                     </div>
                 </div>
             </div>
         );
    }
    
    // --- BREATH ---
    if (subModule.id.startsWith('BREATH')) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950 text-center">
                {gameState.mode === 'GUIDED' ? (
                     <>
                        <div className="relative mb-12 w-80 h-80 flex items-center justify-center">
                             {/* Background Ring */}
                            <div className="absolute inset-0 border-8 border-gray-100 dark:border-gray-800 rounded-full" />
                            
                            {/* Animated Circle */}
                            <div 
                                className={`rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-xl flex items-center justify-center text-white transition-all ease-in-out`}
                                style={{ 
                                    width: gameState.phase === 'INHALE' || gameState.phase === 'HOLD' ? '100%' : '30%',
                                    height: gameState.phase === 'INHALE' || gameState.phase === 'HOLD' ? '100%' : '30%',
                                    transitionDuration: `${gameState.duration}s`,
                                    opacity: gameState.phase === 'GET READY' ? 0.5 : 1
                                }}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-black tracking-wider">{gameState.phase}</span>
                                    {gameState.phase !== 'GET READY' && <span className="text-sm font-bold opacity-80 mt-1">{gameState.cyclesLeft} Left</span>}
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">{gameState.instruction || "Follow the rhythm"}</p>
                     </>
                ) : gameState.mode === 'HOLD' ? (
                    <>
                         <h3 className="mb-8 text-gray-400 font-bold uppercase tracking-widest">Test Your Lungs</h3>
                         <button 
                            onMouseDown={()=>{ setGameState((p:any)=>({...p, holding:true, status: 'HOLDING', time: 0})); timerRef.current = setInterval(()=>setGameState((p:any)=>({...p, time: p.time+0.1})), 100); }} 
                            onMouseUp={()=>{ clearInterval(timerRef.current); finish(Math.min(10, Math.floor(gameState.time/3)), true, `Held: ${gameState.time.toFixed(1)}s`); }} 
                            onTouchStart={(e)=>{ e.preventDefault(); setGameState((p:any)=>({...p, holding:true, status: 'HOLDING', time: 0})); timerRef.current = setInterval(()=>setGameState((p:any)=>({...p, time: p.time+0.1})), 100); }} 
                            onTouchEnd={(e)=>{ e.preventDefault(); clearInterval(timerRef.current); finish(Math.min(10, Math.floor(gameState.time/3)), true, `Held: ${gameState.time.toFixed(1)}s`); }} 
                            className={`w-72 h-72 rounded-full border-8 border-gray-100 dark:border-gray-800 font-black text-3xl shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center select-none
                                ${gameState.holding ? 'bg-blue-600 text-white scale-105' : 'bg-white dark:bg-gray-900 text-blue-600'}
                            `}
                        >
                            {gameState.holding ? gameState.time.toFixed(1) : "HOLD"}
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50 mt-2">{gameState.holding ? "Release to Stop" : "Press & Hold"}</span>
                        </button>
                    </>
                ) : gameState.mode === 'TIMING' ? (
                     <>
                        <h3 className="mb-12 text-gray-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">Tap after exactly <span className="text-blue-500 text-xl">{target}</span> seconds</h3>
                        <button 
                            onMouseDown={() => {
                                 if (gameState.status === 'IDLE') {
                                     setGameState({ ...gameState, status: 'RUNNING', startTime: Date.now() });
                                 } else {
                                     const diff = (Date.now() - gameState.statusStart) / 1000; // Not used here, calculating below
                                     const elapsed = (Date.now() - gameState.startTime) / 1000;
                                     const err = Math.abs(elapsed - target);
                                     if (err < 1.5) finish(10 - Math.floor(err*2), true, `${elapsed.toFixed(2)}s (Target: ${target}s)`);
                                     else finish(0, false, `${elapsed.toFixed(2)}s (Target: ${target}s)`);
                                 }
                            }}
                            className={`w-64 h-64 rounded-full font-black text-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center
                                ${gameState.status === 'RUNNING' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-blue-600 text-white'}
                            `}
                        >
                            {gameState.status === 'RUNNING' ? "..." : "START"}
                        </button>
                     </>
                ) : (
                    <div className="flex flex-col items-center">
                         <h3 className="mb-8 text-gray-400 font-bold uppercase tracking-widest">Exhale Test</h3>
                         <div className="text-6xl font-black mb-12 dark:text-white">
                             {gameState.status === 'RUNNING' ? ((Date.now() - gameState.startTime)/1000).toFixed(1) : '0.0'}s
                         </div>
                         <button 
                            onClick={() => {
                                if (gameState.status === 'IDLE') {
                                    setGameState({ ...gameState, status: 'RUNNING', startTime: Date.now() });
                                    timerRef.current = setInterval(() => setGameState((p:any) => ({...p})), 100);
                                } else {
                                    clearInterval(timerRef.current);
                                    const t = (Date.now() - gameState.startTime) / 1000;
                                    finish(Math.min(10, Math.floor(t/2)), true, `Exhaled: ${t.toFixed(1)}s`);
                                }
                            }}
                            className={`px-10 py-5 rounded-2xl font-black text-xl shadow-lg transition-transform active:scale-95
                                ${gameState.status === 'RUNNING' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}
                            `}
                         >
                             {gameState.status === 'RUNNING' ? "STOP" : "START EXHALE"}
                         </button>
                    </div>
                )}
            </div>
        );
    }
    
    // --- REFLEX ---
    if (subModule.id.startsWith('REFLEX')) {
        // 1. REFLEX GRID (Whack-a-mole)
        if (subModule.id === SubTestType.REFLEX_GRID) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="mb-8 flex flex-col items-center">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Reflex Grid</span>
                        <div className="text-4xl font-black dark:text-white">{gameState.score}<span className="text-gray-400 text-lg">/{gameState.maxTargets}</span></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm aspect-square bg-white dark:bg-gray-900 p-3 rounded-3xl shadow-xl">
                        {[0,1,2,3,4,5,6,7,8].map(i => (
                            <button 
                                key={i} 
                                onMouseDown={()=>handleReflexInput(i)}
                                onTouchStart={(e)=>{e.preventDefault(); handleReflexInput(i);}}
                                disabled={gameState.activeTile !== i}
                                className={`rounded-2xl transition-all duration-75 relative overflow-hidden
                                    ${gameState.activeTile === i 
                                        ? 'bg-blue-500 scale-100 shadow-lg ring-4 ring-blue-200 dark:ring-blue-900' 
                                        : 'bg-gray-100 dark:bg-gray-800 scale-95 opacity-50'}
                                `}
                            >
                                {gameState.activeTile === i && <div className="absolute inset-0 bg-white opacity-20 animate-ping" />}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        
        // 2. REFLEX SEQUENCE
        if (subModule.id === SubTestType.REFLEX_SEQUENCE) {
             return (
                 <div className="h-full relative overflow-hidden bg-gray-50 dark:bg-gray-950">
                     <div className="absolute top-6 w-full text-center">
                         <div className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-sm font-bold text-gray-500">
                             Tap in Order: <span className="text-blue-600 text-lg ml-1">{gameState.next}</span>
                         </div>
                     </div>
                     {gameState.items?.map((it:any) => (
                         <button 
                             key={it.id} 
                             onMouseDown={()=>handleReflexInput(it.id)}
                             onTouchStart={(e)=>{e.preventDefault(); handleReflexInput(it.id);}}
                             style={{ top: `${it.y}%`, left: `${it.x}%` }}
                             className={`absolute w-16 h-16 rounded-full font-black text-xl shadow-xl active:scale-90 transition-all duration-300 flex items-center justify-center border-4
                                 ${it.id < gameState.next 
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 scale-75 border-transparent opacity-50' 
                                    : 'bg-white dark:bg-gray-900 dark:text-white border-blue-500 scale-100 z-10'}
                             `}
                         >
                             {it.id}
                         </button>
                     ))}
                 </div>
             );
        }
        
        // 3. REFLEX MATH
        if (subModule.id === SubTestType.REFLEX_MATH) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 mb-8">
                        <div className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Solve Fast</div>
                        <div className="text-7xl font-black text-center dark:text-white">{gameState.q}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                         {gameState.opts?.map((o:number) => (
                             <button 
                                key={o} 
                                onMouseDown={(e)=>{e.stopPropagation(); handleReflexInput(o);}} 
                                className="h-24 bg-white dark:bg-gray-800 rounded-3xl text-3xl font-black shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                             >
                                 {o}
                             </button>
                         ))}
                     </div>
                </div>
            );
        }

        // 4. REFLEX COLOR (Stroop)
        if (subModule.id === SubTestType.REFLEX_COLOR) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-6">
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-12">Does text match color?</h3>
                    <div className="w-full max-w-xs aspect-square bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-2xl mb-12 border-8 border-gray-50 dark:border-gray-800">
                        <div className={`text-6xl font-black ${gameState.colorClass}`}>
                            {gameState.text}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                         <button onMouseDown={(e)=>{e.stopPropagation(); handleReflexInput('NO');}} className="h-24 bg-red-100 text-red-600 rounded-3xl font-black text-2xl shadow-lg">NO</button>
                         <button onMouseDown={(e)=>{e.stopPropagation(); handleReflexInput('MATCH');}} className="h-24 bg-green-100 text-green-600 rounded-3xl font-black text-2xl shadow-lg">YES</button>
                    </div>
                </div>
            );
        }

        // 5. REFLEX SHAKE (Rapid Tap)
        if (subModule.id === SubTestType.REFLEX_SHAKE) {
             return (
                 <div 
                    onMouseDown={() => handleReflexInput()}
                    onTouchStart={(e) => { e.preventDefault(); handleReflexInput(); }}
                    className="h-full flex flex-col items-center justify-center bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer text-white"
                 >
                     <div className="text-9xl font-black mb-4 animate-pulse">{gameState.taps}</div>
                     <div className="font-bold text-blue-200 uppercase tracking-widest">Tap Fast!</div>
                     <div className="absolute bottom-10 font-mono text-xl opacity-50">{gameState.timeLeft}s</div>
                 </div>
             );
        }

        // 6. REFLEX MOVING (Bouncing Ball)
        if (subModule.id === SubTestType.REFLEX_MOVING) {
            return (
                <div className="h-full relative bg-gray-50 dark:bg-gray-950 overflow-hidden cursor-crosshair">
                    <div 
                        onMouseDown={() => handleReflexInput()}
                        onTouchStart={(e) => { e.preventDefault(); handleReflexInput(); }}
                        style={{ top: `${gameState.y}%`, left: `${gameState.x}%` }}
                        className="absolute w-24 h-24 -ml-12 -mt-12 bg-red-500 rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"
                    >
                        <Target size={40} />
                    </div>
                    <div className="absolute bottom-10 w-full text-center text-gray-400 font-bold uppercase tracking-widest pointer-events-none">
                        Catch the ball
                    </div>
                </div>
            );
        }

        // 7. GENERIC REACTION (Visual/Audio/Choice)
        // This handles: REFLEX_VISUAL, REFLEX_AUDIO, REFLEX_CHOICE, REFLEX_STOP
        
        let bgColor = 'bg-white dark:bg-gray-900';
        let content = <div className="text-gray-400 font-bold">Wait...</div>;
        
        if (gameState.status === 'GO') {
            if (subModule.id === SubTestType.REFLEX_CHOICE && gameState.targetType === 'RED') {
                bgColor = 'bg-red-500';
                content = <div className="text-white font-black text-6xl">STOP</div>;
            } else {
                bgColor = 'bg-green-500';
                content = <div className="text-white font-black text-6xl">TAP!</div>;
            }
        }
        
        return (
            <div 
                onMouseDown={() => handleReflexInput()} 
                onTouchStart={(e) => { e.preventDefault(); handleReflexInput(); }}
                className={`h-full flex flex-col items-center justify-center transition-colors duration-100 cursor-pointer ${bgColor}`}
            >
                {content}
                {gameState.status === 'WAIT' && subModule.id === SubTestType.REFLEX_AUDIO && (
                    <div className="mt-8 text-gray-300">
                        <Volume2 size={48} className="animate-pulse" />
                    </div>
                )}
            </div>
        );
    }
    
    // --- HEARING ---
    if (subModule.id.startsWith('HEARING')) {
        // Special UI for Rhythm
        if (subModule.id === SubTestType.HEARING_RHYTHM) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950">
                    <h2 className="text-3xl font-black mb-8 dark:text-white text-center">
                        {gameState.playing ? "Listen..." : "TAP on 4th Beat!"}
                    </h2>
                    <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-200 
                        ${gameState.playing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-600 shadow-2xl scale-110'}`}
                    >
                         {gameState.playing ? (
                             <div className="flex gap-2">
                                 {[0,1,2].map(i => (
                                     <div key={i} className={`w-4 h-4 rounded-full ${i < (3 - gameState.beatsLeft) ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                 ))}
                             </div>
                         ) : (
                             <button 
                                onMouseDown={() => handleHearingInput(true)}
                                onTouchStart={(e) => { e.preventDefault(); handleHearingInput(true); }}
                                className="w-full h-full rounded-full flex items-center justify-center"
                             >
                                 <Hand size={64} className="text-white animate-pulse" />
                             </button>
                         )}
                    </div>
                </div>
            );
        }

        // Standard Hearing UI
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950">
                <div className={`mb-12 transition-all duration-300 ${gameState.playing ? 'scale-110' : 'scale-100'}`}>
                    {gameState.playing ? <Volume2 size={80} className="text-blue-500 animate-pulse" /> : <Ear size={80} className="text-gray-400" />}
                </div>
                <h2 className="text-2xl font-black mb-12 dark:text-white">{gameState.playing ? 'Listening...' : 'Select Answer'}</h2>
                
                {!gameState.playing && (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {subModule.id === SubTestType.HEARING_PITCH ? (
                            <>
                                <button onClick={()=>handleHearingInput('HIGH')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">HIGH</button>
                                <button onClick={()=>handleHearingInput('LOW')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">LOW</button>
                            </>
                        ) : subModule.id === SubTestType.HEARING_STEREO ? (
                             <>
                                <button onClick={()=>handleHearingInput('LEFT')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">LEFT</button>
                                <button onClick={()=>handleHearingInput('RIGHT')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">RIGHT</button>
                            </>
                        ) : subModule.id === SubTestType.HEARING_MEMORY ? (
                             <>
                                <button onClick={()=>handleHearingInput('L')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">LOW</button>
                                <button onClick={()=>handleHearingInput('H')} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors dark:text-white">HIGH</button>
                             </>
                        ) : (
                            <>
                                <button onClick={()=>handleHearingInput(false)} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xl text-gray-500 hover:text-red-500 transition-colors">Silence</button>
                                <button onClick={()=>handleHearingInput(true)} className="h-32 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform">Sound</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    // --- MEMORY ---
    if (subModule.id.startsWith('MEM')) {
        // NUMBERS
        if (subModule.id === SubTestType.MEM_NUMBERS) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="h-32 flex items-center justify-center text-5xl font-black tracking-widest dark:text-white">
                        {gameState.showing ? target : userInput}
                    </div>
                    {!gameState.showing && (
                        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                            {[1,2,3,4,5,6,7,8,9, 'DEL', 0, 'OK'].map(n => (
                                <button 
                                    key={n} 
                                    onClick={()=>handleMemoryInput(n)} 
                                    className={`h-20 rounded-2xl font-bold text-xl active:scale-95 transition-transform 
                                        ${n==='OK'?'bg-green-500 text-white':n==='DEL'?'bg-red-100 text-red-500':'bg-gray-100 dark:bg-gray-800 dark:text-white'}
                                    `}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        
        // WORDS
        if (subModule.id === SubTestType.MEM_WORDS) {
             if (gameState.showing) {
                 return (
                     <div className="h-full flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
                         <h3 className="text-gray-400 font-bold uppercase tracking-widest">Memorize</h3>
                         {target.map((w:string) => <div key={w} className="text-4xl font-black dark:text-white">{w}</div>)}
                     </div>
                 );
             }
             return (
                 <div className="h-full flex flex-col items-center justify-center p-4">
                     <h3 className="mb-8 text-gray-400 font-bold uppercase tracking-widest">Select Words</h3>
                     <div className="flex flex-wrap gap-3 justify-center">
                         {WORDS_POOL.slice(0, 12).map(w => (
                             <button 
                                 key={w} 
                                 onClick={()=>handleMemoryInput(w)}
                                 className={`px-6 py-3 rounded-xl font-bold transition-all border-2 
                                     ${gameState.selected.includes(w) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-gray-200 dark:border-gray-800 dark:text-white'}
                                 `}
                             >
                                 {w}
                             </button>
                         ))}
                     </div>
                 </div>
             );
        }
        
        // N-BACK
        if (subModule.id === SubTestType.MEM_NBACK) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8">
                     <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-8xl font-black dark:text-white mb-12 shadow-inner">
                         {gameState.showing && gameState.current}
                     </div>
                     <button onClick={()=>handleMemoryInput(true)} className="w-full max-w-sm h-24 bg-blue-600 text-white rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-transform">
                         MATCH
                     </button>
                     <p className="mt-6 text-gray-400 font-bold">Tap if same as previous letter</p>
                </div>
            );
        }
        
        // VISUAL PATTERNS (Grid, Simon, Colors)
        const isGrid = subModule.id === SubTestType.MEM_POSITIONS || subModule.id === SubTestType.MEM_PATH;
        const isSimon = subModule.id === SubTestType.MEM_SEQUENCE || subModule.id === SubTestType.MEM_AUDIO;
        const isPairs = subModule.id === SubTestType.MEM_PAIRS;
        const isColors = subModule.id === SubTestType.MEM_COLORS || subModule.id === SubTestType.MEM_SHAPES;

        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className={`grid gap-3 w-full max-w-sm aspect-square 
                    ${isGrid ? 'grid-cols-3' : isPairs ? 'grid-cols-4' : 'grid-cols-2'}
                `}>
                    {(isGrid ? [0,1,2,3,4,5,6,7,8] : isPairs ? gameState.deck : [0,1,2,3]).map((item:any, i:number) => {
                        // Determine visual state
                        let isActive = false;
                        let content = null;
                        let style = "bg-gray-200 dark:bg-gray-800";
                        
                        if (isGrid) {
                            isActive = gameState.activeCell === item;
                            if (isActive) style = "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]";
                        } 
                        else if (isSimon) {
                            isActive = gameState.activeIdx === item;
                            const colors = ['bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500'];
                            style = `${colors[item]} ${isActive ? 'brightness-125 scale-95' : 'opacity-80'}`;
                        }
                        else if (isPairs) {
                            const isOpen = gameState.matched?.includes(i) || gameState.selected?.includes(i);
                            style = isOpen ? "bg-white dark:bg-gray-800 border-2 border-blue-500" : "bg-blue-600";
                            if (isOpen) content = <span className="font-bold text-xl dark:text-white">{item}</span>;
                        }
                        else if (isColors) {
                            // Colors/Shapes logic would go here if refined, simplified for now
                            const cols = ['bg-red-500','bg-blue-500','bg-green-500','bg-yellow-500'];
                            style = cols[item];
                        }
                        
                        return (
                            <button 
                                key={i} 
                                onClick={()=>handleMemoryInput(isPairs ? i : item)}
                                className={`rounded-2xl transition-all duration-200 flex items-center justify-center ${style}`}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return <div>Module Not Found</div>;
};

export default TestEngine;