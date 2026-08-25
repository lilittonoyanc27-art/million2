import React, { useRef, useEffect, useState } from 'react';
import { WheelSector } from './types';
import { soundManager } from './audio';
import { Disc, Play } from 'lucide-react';

export const WHEEL_SECTORS: WheelSector[] = [
  { id: 1, label: '100', type: 'points', value: 100, color: '#FF4E50', textColor: '#ffffff' },
  { id: 2, label: '300', type: 'points', value: 300, color: '#3b82f6', textColor: '#ffffff' },
  { id: 3, label: '+', type: 'plus', value: 0, color: '#10b981', textColor: '#ffffff' },
  { id: 4, label: '500', type: 'points', value: 500, color: '#8b5cf6', textColor: '#ffffff' },
  { id: 5, label: '200', type: 'points', value: 200, color: '#F9D423', textColor: '#1e293b' },
  { id: 6, label: 'x2', type: 'double', value: 2, color: '#e11d48', textColor: '#ffffff' },
  { id: 7, label: '400', type: 'points', value: 400, color: '#06b6d4', textColor: '#ffffff' },
  { id: 8, label: '750', type: 'points', value: 750, color: '#f97316', textColor: '#ffffff' },
  { id: 9, label: '250', type: 'points', value: 250, color: '#6366f1', textColor: '#ffffff' },
  { id: 10, label: '1000', type: 'points', value: 1000, color: '#F9D423', textColor: '#0f172a' },
  { id: 11, label: 'Шанс', type: 'chance', value: 450, color: '#14b8a6', textColor: '#ffffff' },
  { id: 12, label: '600', type: 'points', value: 600, color: '#ec4899', textColor: '#ffffff' },
  { id: 13, label: '350', type: 'points', value: 350, color: '#0284c7', textColor: '#ffffff' },
  { id: 14, label: 'ПРИЗ', type: 'bonus', value: 500, color: '#FF4E50', textColor: '#ffffff' },
  { id: 15, label: '150', type: 'points', value: 150, color: '#84cc16', textColor: '#ffffff' },
  { id: 16, label: '500', type: 'points', value: 500, color: '#a855f7', textColor: '#ffffff' },
];

interface WheelProps {
  onSpinComplete: (sector: WheelSector) => void;
  isSpinning: boolean;
  disabled: boolean;
}

export const Wheel: React.FC<WheelProps> = ({ onSpinComplete, isSpinning, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedSector, setSelectedSector] = useState<WheelSector | null>(null);
  const lastTickSectorRef = useRef<number>(-1);

  const numSectors = WHEEL_SECTORS.length;
  const arcSize = (2 * Math.PI) / numSectors;

  const drawWheel = (currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 16;

    ctx.clearRect(0, 0, width, height);

    // Outer ring with golden rim and metallic gradient
    const outerGrad = ctx.createRadialGradient(centerX, centerY, radius - 4, centerX, centerY, radius + 12);
    outerGrad.addColorStop(0, '#d97706');
    outerGrad.addColorStop(0.5, '#fde68a');
    outerGrad.addColorStop(1, '#b45309');

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = outerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // Draw sectors
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);

    for (let i = 0; i < numSectors; i++) {
      const sector = WHEEL_SECTORS[i];
      const startAngle = i * arcSize;
      const endAngle = startAngle + arcSize;

      // Sector slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sector.color;
      ctx.fill();

      // Sector border line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sector text
      ctx.save();
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = sector.textColor;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText(sector.label, radius - 16, 0);
      ctx.restore();
    }

    // Outer pegs (lights)
    for (let i = 0; i < numSectors * 2; i++) {
      const angle = (i * Math.PI) / numSectors;
      const pegX = Math.cos(angle) * (radius + 2);
      const pegY = Math.sin(angle) * (radius + 2);

      ctx.beginPath();
      ctx.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#fffbeb' : '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 4;
      ctx.fill();
    }

    // Center hub
    const centerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
    centerGrad.addColorStop(0, '#fef08a');
    centerGrad.addColorStop(0.7, '#eab308');
    centerGrad.addColorStop(1, '#854d0e');

    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center decorative inner circle
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#b45309';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, []);

  const spin = () => {
    if (isSpinning || disabled) return;
    soundManager.playClick();

    // Select winning sector
    const randomIndex = Math.floor(Math.random() * numSectors);
    const targetSector = WHEEL_SECTORS[randomIndex];
    setSelectedSector(targetSector);

    // Calculate angle: The pointer is at 3 o'clock (0 radians) or top (3*PI/2)
    // In our coordinate system, top is -PI/2 (or 3*PI/2)
    // Pointer is at the top (angle 3 * Math.PI / 2)
    const pointerAngle = (3 * Math.PI) / 2;
    const sectorCenterAngle = randomIndex * arcSize + arcSize / 2;
    
    // Add random extra turns (5 to 8 full rotations) + jitter within sector
    const jitter = (Math.random() - 0.5) * (arcSize * 0.7);
    const extraRotations = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    
    // Current rotation normalized
    const currentRot = rotationRef.current;
    const targetAngle = pointerAngle - sectorCenterAngle + jitter;
    
    // Total delta angle to rotate
    const delta = ((targetAngle - (currentRot % (2 * Math.PI))) + 2 * Math.PI) % (2 * Math.PI) + extraRotations;
    const finalRotation = currentRot + delta;

    const startTime = performance.now();
    const duration = 4000 + Math.random() * 1000; // 4 to 5 seconds

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3.5);
      const currentAngle = currentRot + delta * easeOut;
      rotationRef.current = currentAngle;

      // Sector sound tick check
      const normAngle = (pointerAngle - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentSectorIdx = Math.floor(normAngle / arcSize);
      if (currentSectorIdx !== lastTickSectorRef.current) {
        lastTickSectorRef.current = currentSectorIdx;
        soundManager.playTick();
      }

      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = finalRotation;
        drawWheel(finalRotation);
        if (targetSector.type === 'bonus' || targetSector.type === 'plus') {
          soundManager.playBonus();
        } else {
          soundManager.playTick();
        }
        setTimeout(() => {
          onSpinComplete(targetSector);
        }, 500);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-slate-900/90 rounded-2xl border-2 border-[#F9D423]/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden" id="wheel-container">
      {/* Top pointer marker */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 pointer-events-none filter drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-[#F9D423]"></div>
          <div className="w-3 h-3 bg-[#FF4E50] rounded-full mx-auto -mt-6 border-2 border-white shadow-sm"></div>
        </div>

        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="max-w-full aspect-square"
          id="wheel-canvas"
        />
      </div>

      {/* Spin Button */}
      <div className="mt-4 w-full flex flex-col items-center gap-2">
        <button
          id="spin-button"
          onClick={spin}
          disabled={isSpinning || disabled}
          className={`w-full max-w-xs py-3.5 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg ${
            isSpinning || disabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
              : 'bg-gradient-to-r from-[#F9D423] via-[#FFD700] to-[#F9D423] hover:from-[#FFF066] hover:to-[#F9D423] text-slate-950 shadow-[0_0_20px_rgba(249,212,35,0.4)] ring-2 ring-white cursor-pointer animate-pulse'
          }`}
        >
          <Disc className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'Բարաբանը պտտվում է... / Вращение...' : 'Պտտել բարաբանը / Вращать барабан!'}
        </button>

        <p className="text-xs text-slate-300 text-center font-medium">
          Պտտեք բարաբանը միավորներ վաստակելու և տառ բացելու համար
        </p>
      </div>
    </div>
  );
};
