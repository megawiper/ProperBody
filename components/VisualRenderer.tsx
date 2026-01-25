import React, { useEffect, useRef } from 'react';
import { ChallengeType, LevelConfig } from '../types';

interface Props {
  level: LevelConfig;
  showContent: boolean;
  isDarkMode: boolean;
}

const VisualRenderer: React.FC<Props> = ({ level, showContent, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- HELPER FUNCTIONS ---

  // Generate a random color close to a base color (for camouflage)
  const getCamouflageColor = (baseH: number, baseS: number, baseL: number, difficulty: number) => {
    // As difficulty increases, the variance decreases (colors look more alike)
    const variance = 40 - (difficulty * 35); // Level 7 variance is tiny (5 degrees)
    const h = baseH + (Math.random() * variance - (variance/2));
    const s = baseS + (Math.random() * 10 - 5);
    const l = baseL + (Math.random() * 10 - 5);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const drawNoise = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity;
      data[i] += noise;     // R
      data[i+1] += noise;   // G
      data[i+2] += noise;   // B
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // --- RENDERERS ---

  const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. CLEAR & BACKGROUND
    // Base colors based on mode
    const baseH = isDarkMode ? 220 : 220; 
    const baseS = isDarkMode ? 10 : 5;
    const baseL = isDarkMode ? 15 : 95; // Dark Grey or White-ish

    ctx.fillStyle = `hsl(${baseH}, ${baseS}%, ${baseL}%)`;
    ctx.fillRect(0, 0, width, height);

    // 2. CONFIGURE DIFFICULTY
    // This makes Level 7 insanely hard (0.95 difficulty -> 0.05 visibility)
    const visFactor = 1 - (level.difficulty * 0.92); 

    // --- STRATEGY PER TYPE ---
    
    if (level.type === ChallengeType.DOTS) {
      // --- ISHIHARA TEST (Advanced) ---
      // We draw thousands of dots. The text is formed by dots slightly different in hue.
      
      const dotCount = 2500;
      // Pre-calculate text shape
      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.font = 'bold 120px Arial';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(level.answer, width/2, height/2);
      }
      const textData = offCtx?.getImageData(0, 0, width, height).data;

      for (let i = 0; i < dotCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 4 + 1.5;
        
        const pxIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
        const isText = textData ? textData[pxIndex + 3] > 100 : false;

        // Difficulty Math:
        // Easy: Hue Diff = 50deg. Hard: Hue Diff = 5deg.
        const hueDiff = 50 * visFactor; 
        const baseHue = Math.random() * 360;
        
        const dotHue = isText ? baseHue + hueDiff : baseHue;
        const dotSat = 60 + Math.random() * 20;
        const dotLight = isDarkMode ? 40 + Math.random()*20 : 50 + Math.random()*20;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${dotHue}, ${dotSat}%, ${dotLight}%)`;
        ctx.fill();
      }

    } else if (level.type === ChallengeType.PATTERN) {
      // --- CONFUSION / CAMOUFLAGE ---
      // Draw "Distractors". If answer is "H", draw "I", "-", "L", "F" everywhere.
      
      const numDistractors = 50 + (level.difficulty * 200);
      
      ctx.font = `${Math.floor(Math.random() * 40 + 20)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw Distractors (Background Layer)
      for (let i = 0; i < numDistractors; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const rot = Math.random() * Math.PI * 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        
        // Distractor color is VERY similar to text color
        const alpha = 0.3 + (Math.random() * 0.4);
        ctx.fillStyle = isDarkMode 
          ? `rgba(255, 255, 255, ${alpha})` 
          : `rgba(0, 0, 0, ${alpha})`;
          
        // Pick random char that is NOT the answer
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      // Draw REAL Text
      ctx.save();
      ctx.translate(width/2, height/2);
      ctx.rotate((Math.random() - 0.5) * 0.5); // Random tilt
      
      ctx.font = 'bold 100px monospace';
      
      // Text opacity drops as difficulty rises
      // At diff 1.0, alpha is ~0.15 (barely visible over distractors)
      const textAlpha = 0.15 + (visFactor * 0.85); 
      
      ctx.fillStyle = isDarkMode 
        ? `rgba(255, 255, 255, ${textAlpha})` 
        : `rgba(0, 0, 0, ${textAlpha})`;
      
      // Add a stroke to make it slightly distinguishable from distractors, but fade that too
      ctx.strokeStyle = isDarkMode ? '#000' : '#fff';
      ctx.lineWidth = 1;
      
      ctx.fillText(level.answer, 0, 0);
      ctx.strokeText(level.answer, 0, 0);
      ctx.restore();
      
      // Draw Distractors (Foreground Layer - Occlusion)
      const fgCount = level.difficulty * 20; // Up to 20 blocking items
      for(let i=0; i<fgCount; i++) {
         ctx.beginPath();
         ctx.moveTo(Math.random()*width, Math.random()*height);
         ctx.lineTo(Math.random()*width, Math.random()*height);
         ctx.strokeStyle = isDarkMode ? `rgba(20,20,20,0.8)` : `rgba(240,240,240,0.8)`;
         ctx.lineWidth = 2 + Math.random()*5;
         ctx.stroke();
      }

    } else if (level.type === ChallengeType.BLUR) {
      // --- GAUSSIAN BLUR ---
      // We draw sharp text, then apply blur filter on context
      
      // Calculate Blur amount. Level 7 -> 20px blur (very high)
      const blurAmount = 4 + (level.difficulty * 16); 
      
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.fillText(level.answer, width/2, height/2);
      
      ctx.filter = 'none'; // Reset filter

    } else if (level.type === ChallengeType.CONTRAST) {
      // --- EXTREME LOW CONTRAST ---
      
      // Background Color (Greyish)
      const bgVal = 128;
      ctx.fillStyle = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;
      ctx.fillRect(0,0,width,height);
      
      // Text Color
      // Level 1 Diff: 60. Level 7 Diff: 2 (Almost identical)
      const diff = 60 * visFactor; 
      
      // Randomize if text is lighter or darker
      const direction = Math.random() > 0.5 ? 1 : -1;
      const textVal = bgVal + (diff * direction);
      
      ctx.font = 'bold 100px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgb(${textVal}, ${textVal}, ${textVal})`;
      ctx.fillText(level.answer, width/2, height/2);
      
      // Add heavy noise to bridge the gap between colors
      drawNoise(ctx, width, height, 40 + (level.difficulty * 40));

    } else if (level.type === ChallengeType.ILLUSION) {
       // --- MOVING ILLUSION ---
       
       // Draw a spiral or concentric circles
       const cx = width/2;
       const cy = height/2;
       
       ctx.save();
       ctx.translate(cx, cy);
       // Rotate entire background over time (handled by re-renders in hook, 
       // but here we just do static for the frame)
       const time = Date.now() / 1000;
       ctx.rotate(time);
       
       for(let i=0; i<30; i++) {
         ctx.beginPath();
         ctx.arc(0, 0, i * 15, 0, Math.PI * 2);
         ctx.strokeStyle = i % 2 === 0 ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? '#333' : '#ddd');
         ctx.lineWidth = 8;
         ctx.stroke();
       }
       ctx.restore();
       
       // Draw Text inside
       ctx.font = 'bold 100px Arial';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       // Text moves slightly opposite to background
       ctx.save();
       ctx.translate(cx, cy);
       ctx.rotate(-time * 0.5); 
       
       ctx.fillStyle = isDarkMode ? '#ff0055' : '#cc0000'; // Contrasting color but moving is hard
       ctx.globalAlpha = 0.6; // See-through
       ctx.fillText(level.answer, 0, 0);
       ctx.restore();

    } else {
       // --- BASIC (But still styled) ---
       // Even basic gets noise at high levels
       
       ctx.font = 'bold 100px Arial';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       // Text color fades with difficulty
       const val = isDarkMode ? 255 - (level.difficulty * 100) : 0 + (level.difficulty * 100);
       ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
       
       ctx.fillText(level.answer, width/2, height/2);
       
       // Add subtle noise
       drawNoise(ctx, width, height, level.difficulty * 30);
    }
    
    // 3. FINAL GLOBAL NOISE LAYER (The "Dirty Screen" effect)
    // Applies to ALL modes to make them gritty
    if (level.type !== ChallengeType.DOTS) { // Dots has its own noise logic
       drawNoise(ctx, width, height, 10 + (level.difficulty * 30));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set resolution (HiDPI support)
    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current?.getBoundingClientRect();
    
    // Default size if rect missing
    const w = rect?.width || 300;
    const h = rect?.height || 300;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale context
    ctx.scale(dpr, dpr);

    if (showContent) {
      // Pass logical width/height
      drawScene(ctx, w, h);
    } else {
      // Clear
      ctx.clearRect(0,0,w,h);
    }

  }, [level, showContent, isDarkMode]); // Re-run when level/mode changes

  // Use a RequestAnimation frame loop only for illusion to animate it
  useEffect(() => {
    if (level.type !== ChallengeType.ILLUSION || !showContent) return;
    
    let animId: number;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const w = canvas?.width ? canvas.width / (window.devicePixelRatio||1) : 300;
      const h = canvas?.height ? canvas.height / (window.devicePixelRatio||1) : 300;
      
      if (ctx) {
        ctx.setTransform(window.devicePixelRatio||1, 0, 0, window.devicePixelRatio||1, 0, 0); // Reset transform
        drawScene(ctx, w, h);
      }
      animId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [level, showContent, isDarkMode]);

  // --- DOM RENDER ---

  if (!showContent) {
    return (
      <div 
        ref={containerRef}
        className="w-full aspect-square max-w-sm mx-auto bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 flex items-center justify-center"
      >
         <span className="text-6xl text-gray-300 dark:text-gray-600 animate-pulse">?</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-square max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-4 border-gray-300 dark:border-gray-600 overflow-hidden relative"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
        style={{ imageRendering: 'auto' }} // Ensure smooth scaling
      />
    </div>
  );
};

export default VisualRenderer;