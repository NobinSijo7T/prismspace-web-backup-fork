/**
 * Copyright 2026 Nobin Sijo (NobinSijo7T).
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { useEffect, useRef, useState } from 'react';

interface MatrixDisplayProps {
  onClose?: () => void;
  rows?: number;
  cols?: number;
  size?: number;
  gap?: number;
  fps?: number;
  brightness?: number;
}

type AnimationType = 'wave' | 'pulse' | 'loader' | 'snake' | 'rain' | 'spiral';

interface SnakeSegment {
  x: number;
  y: number;
}

interface SnakeGame {
  body: SnakeSegment[];
  direction: { x: number; y: number };
  nextDirection: { x: number; y: number };
  food: SnakeSegment | null;
  score: number;
  gameOver: boolean;
  speed: number;
  lastMoveTime: number;
}

export function MatrixDisplay({
  onClose,
  rows = 7,
  cols = 7,
  size = 10,
  gap = 2,
  fps = 20,
  brightness = 1,
}: MatrixDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pixelsRef = useRef<(SVGCircleElement | null)[][]>([]);
  const animationIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const currentFrameIndexRef = useRef<number>(0);
  const framesRef = useRef<number[][][]>([]);

  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('wave');
  const [showSnakeDialog, setShowSnakeDialog] = useState(false);
  const [snakeGame, setSnakeGame] = useState<SnakeGame | null>(null);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  const animationTypes: AnimationType[] = ['wave', 'pulse', 'loader', 'snake', 'rain', 'spiral'];

  // Create empty frame
  const createEmptyFrame = (): number[][] => {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  };

  // Set pixel value in frame
  const setPixel = (frame: number[][], row: number, col: number, value: number) => {
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      frame[row][col] = Math.max(0, Math.min(1, value));
    }
  };

  // Create wave animation frames
  const createWaveFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const frameCount = 24;

    for (let frame = 0; frame < frameCount; frame++) {
      const f = createEmptyFrame();
      const phase = (frame / frameCount) * Math.PI * 2;

      for (let col = 0; col < cols; col++) {
        const colPhase = (col / cols) * Math.PI * 2;
        const height = Math.sin(phase + colPhase) * 2.5 + 3.5;
        const row = Math.floor(height);

        if (row >= 0 && row < rows) {
          setPixel(f, row, col, 1);
          const frac = height - row;
          if (row > 0) setPixel(f, row - 1, col, 1 - frac);
          if (row < rows - 1) setPixel(f, row + 1, col, frac);
        }
      }
      frames.push(f);
    }

    return frames;
  };

  // Create pulse animation frames
  const createPulseFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const frameCount = 16;
    const center = Math.floor(rows / 2);

    for (let frame = 0; frame < frameCount; frame++) {
      const f = createEmptyFrame();
      const phase = (frame / frameCount) * Math.PI * 2;
      const intensity = (Math.sin(phase) + 1) / 2;

      setPixel(f, center, center, 1);

      const radius = Math.floor((1 - intensity) * 3) + 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - radius) < 0.7) {
            setPixel(f, center + dy, center + dx, intensity * 0.6);
          }
        }
      }
      frames.push(f);
    }

    return frames;
  };

  // Create loader animation frames
  const createLoaderFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const frameCount = 12;
    const center = Math.floor(rows / 2);
    const radius = 2.5;

    for (let frame = 0; frame < frameCount; frame++) {
      const f = createEmptyFrame();
      for (let i = 0; i < 8; i++) {
        const angle = (frame / frameCount) * Math.PI * 2 + (i / 8) * Math.PI * 2;
        const x = Math.round(center + Math.cos(angle) * radius);
        const y = Math.round(center + Math.sin(angle) * radius);
        const brightnessVal = 1 - i / 10;
        setPixel(f, y, x, Math.max(0.2, brightnessVal));
      }
      frames.push(f);
    }

    return frames;
  };

  // Create snake animation frames
  const createSnakeFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const path: [number, number][] = [];
    let x = 0, y = 0, dx = 1, dy = 0;
    const visited = new Set<string>();

    while (path.length < rows * cols) {
      path.push([y, x]);
      visited.add(`${y},${x}`);

      const nextX = x + dx;
      const nextY = y + dy;

      if (nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows && !visited.has(`${nextY},${nextX}`)) {
        x = nextX;
        y = nextY;
      } else {
        const newDx = -dy;
        const newDy = dx;
        dx = newDx;
        dy = newDy;

        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows && !visited.has(`${nextY},${nextX}`)) {
          x = nextX;
          y = nextY;
        } else {
          break;
        }
      }
    }

    const snakeLength = 5;
    for (let frame = 0; frame < path.length; frame++) {
      const f = createEmptyFrame();

      for (let i = 0; i < snakeLength; i++) {
        const idx = frame - i;
        if (idx >= 0 && idx < path.length) {
          const [y, x] = path[idx];
          const brightnessVal = 1 - i / snakeLength;
          setPixel(f, y, x, brightnessVal);
        }
      }
      frames.push(f);
    }

    return frames;
  };

  // Create rain animation frames
  const createRainFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const frameCount = 20;
    const dropCount = Math.ceil(cols / 2);

    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.floor(Math.random() * cols),
      y: -Math.floor(Math.random() * rows),
      speed: 0.5 + Math.random() * 1.5,
      length: 2 + Math.floor(Math.random() * 3),
    }));

    for (let frame = 0; frame < frameCount; frame++) {
      const f = createEmptyFrame();

      drops.forEach((drop) => {
        drop.y += drop.speed;

        if (drop.y - drop.length > rows) {
          drop.y = -Math.floor(Math.random() * 3);
          drop.x = Math.floor(Math.random() * cols);
        }

        for (let i = 0; i < drop.length; i++) {
          const y = Math.floor(drop.y) - i;
          if (y >= 0 && y < rows) {
            const brightnessVal = 1 - i / drop.length;
            setPixel(f, y, drop.x, brightnessVal);
          }
        }
      });

      frames.push(f);
    }

    return frames;
  };

  // Create spiral animation frames
  const createSpiralFrames = (): number[][][] => {
    const frames: number[][][] = [];
    const frameCount = 24;
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const maxRadius = Math.max(rows, cols);

    for (let frame = 0; frame < frameCount; frame++) {
      const f = createEmptyFrame();
      const phase = (frame / frameCount) * Math.PI * 2;

      for (let radius = 0.5; radius < maxRadius; radius += 0.5) {
        const angle = phase + radius * 0.8;
        const x = Math.floor(centerX + Math.cos(angle) * radius);
        const y = Math.floor(centerY + Math.sin(angle) * radius);

        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          const brightnessVal = 1 - radius / maxRadius;
          setPixel(f, y, x, brightnessVal);
        }
      }

      frames.push(f);
    }

    return frames;
  };

  // Create animation frames based on type
  const createAnimationFrames = (type: AnimationType): number[][][] => {
    switch (type) {
      case 'wave':
        return createWaveFrames();
      case 'pulse':
        return createPulseFrames();
      case 'loader':
        return createLoaderFrames();
      case 'snake':
        return createSnakeFrames();
      case 'rain':
        return createRainFrames();
      case 'spiral':
        return createSpiralFrames();
      default:
        return createWaveFrames();
    }
  };

  // Update frame rendering
  const updateFrame = () => {
    if (!framesRef.current || framesRef.current.length === 0) return;

    const currentFrame = framesRef.current[currentFrameIndexRef.current];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pixel = pixelsRef.current[row]?.[col];
        if (!pixel) continue;

        const value = currentFrame[row]?.[col] || 0;
        const opacity = Math.max(0, Math.min(1, brightness * value));
        const isActive = opacity > 0.5;

        pixel.setAttribute('opacity', opacity > 0.05 ? opacity.toString() : '0.1');

        if (isActive) {
          pixel.classList.add('matrix-pixel-active');
        } else {
          pixel.classList.remove('matrix-pixel-active');
        }
      }
    }
  };

  // Animation loop
  const animate = (timestamp: number) => {
    const deltaTime = timestamp - lastFrameTimeRef.current;
    const frameInterval = 1000 / fps;

    if (deltaTime >= frameInterval) {
      updateFrame();
      currentFrameIndexRef.current = (currentFrameIndexRef.current + 1) % framesRef.current.length;
      lastFrameTimeRef.current = timestamp;
    }

    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Cycle through animations
  const cycleAnimation = () => {
    const currentIndex = animationTypes.indexOf(currentAnimation);
    const nextIndex = (currentIndex + 1) % animationTypes.length;
    setCurrentAnimation(animationTypes[nextIndex]);
  };

  // Snake game functions
  const initSnakeGame = () => {
    const newGame: SnakeGame = {
      body: [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      food: null,
      score: 0,
      gameOver: false,
      speed: 200,
      lastMoveTime: 0,
    };
    
    placeFood(newGame);
    setSnakeGame(newGame);
  };

  const placeFood = (game: SnakeGame) => {
    const emptyCells: SnakeSegment[] = [];
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isSnake = game.body.some(seg => seg.x === x && seg.y === y);
        if (!isSnake) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      game.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  };

  const updateSnakeGame = () => {
    if (!snakeGame || snakeGame.gameOver) return;

    const newGame = { ...snakeGame };
    newGame.direction = newGame.nextDirection;

    const head = newGame.body[0];
    const newHead = {
      x: head.x + newGame.direction.x,
      y: head.y + newGame.direction.y,
    };

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      newGame.gameOver = true;
      setSnakeGame(newGame);
      return;
    }

    // Check self collision
    if (newGame.body.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      newGame.gameOver = true;
      setSnakeGame(newGame);
      return;
    }

    newGame.body.unshift(newHead);

    // Check food
    if (newGame.food && newHead.x === newGame.food.x && newHead.y === newGame.food.y) {
      newGame.score++;
      placeFood(newGame);
      if (newGame.speed > 50) {
        newGame.speed -= 5;
      }
    } else {
      newGame.body.pop();
    }

    setSnakeGame(newGame);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!snakeGame || !showSnakeDialog) return;

    switch (e.key) {
      case 'ArrowUp':
        if (snakeGame.direction.y !== 1) {
          setSnakeGame(prev => prev ? { ...prev, nextDirection: { x: 0, y: -1 } } : null);
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (snakeGame.direction.y !== -1) {
          setSnakeGame(prev => prev ? { ...prev, nextDirection: { x: 0, y: 1 } } : null);
        }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (snakeGame.direction.x !== 1) {
          setSnakeGame(prev => prev ? { ...prev, nextDirection: { x: -1, y: 0 } } : null);
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (snakeGame.direction.x !== -1) {
          setSnakeGame(prev => prev ? { ...prev, nextDirection: { x: 1, y: 0 } } : null);
        }
        e.preventDefault();
        break;
      case ' ':
        if (snakeGame.gameOver) {
          initSnakeGame();
        }
        e.preventDefault();
        break;
      case 'Escape':
        setShowSnakeDialog(false);
        setSnakeGame(null);
        e.preventDefault();
        break;
    }
  };

  // Initialize SVG and pixels
  useEffect(() => {
    if (!svgRef.current) return;

    // Create pixel elements
    const newPixels: (SVGCircleElement | null)[][] = [];
    for (let row = 0; row < rows; row++) {
      newPixels[row] = [];
      for (let col = 0; col < cols; col++) {
        const pixel = svgRef.current.querySelector(`#pixel-${row}-${col}`) as SVGCircleElement | null;
        newPixels[row][col] = pixel;
      }
    }
    pixelsRef.current = newPixels;
  }, [rows, cols]);

  // Initialize animation frames
  useEffect(() => {
    framesRef.current = createAnimationFrames(currentAnimation);
    currentFrameIndexRef.current = 0;
  }, [currentAnimation, rows, cols]);

  // Start animation loop
  useEffect(() => {
    lastFrameTimeRef.current = performance.now();
    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [currentAnimation]);

  // Snake game loop
  useEffect(() => {
    if (!snakeGame || !showSnakeDialog) return;

    const gameLoop = setInterval(() => {
      updateSnakeGame();
    }, snakeGame.speed);

    return () => clearInterval(gameLoop);
  }, [snakeGame, showSnakeDialog]);

  // Keyboard controls
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [snakeGame, showSnakeDialog]);

  const width = cols * (size + gap) - gap;
  const height = rows * (size + gap) - gap;

  return (
    <div className="min-h-screen bg-black text-[#00ff88] p-12 font-mono">
      <h1 className="text-3xl mb-4">Matrix Component Test</h1>

      <div className="bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] rounded-lg p-4 mb-6">
        <h3 className="text-lg mb-2">✨ Enhanced Matrix Component Features:</h3>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li><strong>Glassy Background:</strong> Semi-transparent with blur effect</li>
          <li><strong>Multiple Animations:</strong> Wave → Pulse → Loader → Snake → Rain → Spiral</li>
          <li><strong>Click to Cycle:</strong> Click the matrix to change animations</li>
          <li><strong>Playable Snake Game:</strong> Right-click the matrix to open the game in a dialog box</li>
          <li><strong>Game Mechanics:</strong> Use arrow keys to control the snake, collect food to grow and earn points</li>
          <li><strong>Hover Effects:</strong> Enhanced glow and scale on hover</li>
        </ul>
        <p className="mt-2 text-sm italic">
          Click the matrix to cycle through animations. Right-click to open the Snake Game!
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative inline-flex items-center justify-center min-w-[60px] min-h-[48px] bg-[rgba(0,0,0,0.3)] backdrop-blur-md border border-[rgba(0,255,136,0.3)] rounded-xl p-1.5 cursor-pointer transition-all hover:bg-[rgba(0,255,136,0.15)] hover:scale-105 hover:border-[rgba(0,255,136,0.5)] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] m-5"
        onClick={cycleAnimation}
        onContextMenu={(e) => {
          e.preventDefault();
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDialogPosition({ x: rect.right + 20, y: rect.top });
          }
          setShowSnakeDialog(true);
          initSnakeGame();
        }}
        title={`Matrix Display - ${currentAnimation} animation (Click to change)`}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block overflow-visible"
        >
          <defs>
            <radialGradient id="matrix-pixel-on" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="matrix-pixel-off" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" stopOpacity="0.7" />
            </radialGradient>
            <filter id="matrix-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {Array.from({ length: rows }).map((_, row) =>
            Array.from({ length: cols }).map((_, col) => {
              const cx = col * (size + gap) + size / 2;
              const cy = row * (size + gap) + size / 2;
              const r = (size / 2) * 0.9;

              return (
                <circle
                  key={`${row}-${col}`}
                  id={`pixel-${row}-${col}`}
                  className="matrix-pixel transition-all duration-200 ease-out"
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="url(#matrix-pixel-off)"
                  opacity="0.1"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Snake Game Dialog */}
      {showSnakeDialog && snakeGame && (
        <div
          className="fixed bg-[rgba(0,0,0,0.8)] backdrop-blur-md border border-[rgba(0,255,136,0.5)] rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5),0_0_10px_rgba(0,255,136,0.3)] z-50 flex flex-col gap-4 min-w-[200px]"
          style={{ left: dialogPosition.x, top: dialogPosition.y }}
        >
          <div className="bg-[rgba(0,0,0,0.5)] border border-[rgba(0,255,136,0.3)] rounded-lg p-2.5 flex items-center justify-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {Array.from({ length: rows }).map((_, row) =>
                Array.from({ length: cols }).map((_, col) => {
                  const cx = col * (size + gap) + size / 2;
                  const cy = row * (size + gap) + size / 2;
                  const r = (size / 2) * 0.9;
                  
                  const isSnake = snakeGame.body.some(seg => seg.x === col && seg.y === row);
                  const isFood = snakeGame.food?.x === col && snakeGame.food?.y === row;
                  const opacity = isSnake || isFood ? 1 : 0.1;

                  return (
                    <circle
                      key={`game-${row}-${col}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="#00ff88"
                      opacity={opacity}
                      className={isSnake || isFood ? 'matrix-pixel-active' : ''}
                    />
                  );
                })
              )}
            </svg>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="font-bold">Score: <span>{snakeGame.score}</span></div>
            <div className="text-xs opacity-80">Use ↑ ↓ ← → to move, ESC to exit</div>
            <button
              onClick={initSnakeGame}
              className="bg-[rgba(0,255,136,0.2)] border border-[rgba(0,255,136,0.5)] rounded px-2.5 py-1 cursor-pointer transition-all hover:bg-[rgba(0,255,136,0.4)] hover:scale-105"
            >
              Restart
            </button>
            <button
              onClick={() => {
                setShowSnakeDialog(false);
                setSnakeGame(null);
              }}
              className="bg-[rgba(0,255,136,0.2)] border border-[rgba(0,255,136,0.5)] rounded px-2.5 py-1 cursor-pointer transition-all hover:bg-[rgba(0,255,136,0.4)] hover:scale-105"
            >
              Close
            </button>
          </div>

          {snakeGame.gameOver && (
            <div className="text-center text-sm font-bold animate-pulse">
              Game Over! Press Space to restart
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .matrix-pixel-active {
          filter: drop-shadow(0 0 3px currentColor);
        }
      `}</style>
    </div>
  );
}
