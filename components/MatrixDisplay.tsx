/**
 * Copyright 2026 Nobin Sijo (NobinSijo7T).
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { useEffect, useRef, useState } from 'react';

type Matrix = number[][];
type IdleAnimation =
  | 'blink'
  | 'heartbeat'
  | 'matrixRain'
  | 'spinner'
  | 'scan'
  | 'wave'
  | 'orbit'
  | 'breathing'
  | 'spark'
  | 'equalizer';
type EasterEgg =
  | 'smile'
  | 'heart'
  | 'ghost'
  | 'alien'
  | 'rocket'
  | 'coffee'
  | 'checkmark'
  | 'questionMark'
  | 'hello'
  | 'fortyTwo';

const ROWS = 5;
const COLS = 5;
const FRAME_RATE = 15;
const FRAME_MS = 1000 / FRAME_RATE;
const IDLE_MIN_MS = 6000;
const IDLE_MAX_MS = 10000;
const EGG_DURATION_MS = 2000;
const HOVER_BOOST = 1.2;
const HOVER_SPEED = 1.5;
const EGG_TRIGGER_CHANCE = 0.05;

const IDLE_ANIMATIONS: IdleAnimation[] = [
  'blink',
  'heartbeat',
  'matrixRain',
  'spinner',
  'scan',
  'wave',
  'orbit',
  'breathing',
  'spark',
  'equalizer',
];

const EGG_ANIMATIONS: EasterEgg[] = [
  'smile',
  'heart',
  'ghost',
  'alien',
  'rocket',
  'coffee',
  'checkmark',
  'questionMark',
  'hello',
  'fortyTwo',
];

const PERIMETER_PATH: Array<[number, number]> = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [4, 2],
  [4, 1],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
];

const TINY_FONT: Record<string, string[]> = {
  H: ['10', '10', '11', '10', '10'],
  I: ['11', '01', '01', '01', '11'],
  '4': ['10', '10', '11', '01', '01'],
  '2': ['11', '01', '10', '10', '11'],
};

const SMILE_SPRITE = ['00000', '01010', '00000', '10001', '01110'];
const HEART_SPRITE = ['01010', '11111', '11111', '01110', '00100'];
const GHOST_SPRITE = ['01110', '11111', '11011', '11111', '10101'];
const ALIEN_SPRITE = ['01110', '10101', '11111', '10101', '10001'];
const ROCKET_SPRITE = ['00100', '01110', '11111', '01110', '00100'];
const COFFEE_SPRITE = ['00100', '01110', '11111', '10001', '01110'];
const CHECK_SPRITE = ['00001', '00010', '00100', '01000', '10000'];
const QUESTION_SPRITE = ['01110', '00001', '00110', '00000', '00100'];

function createMatrix(fill = 0): Matrix {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => fill));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function hash(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function easeOutExpo(value: number): number {
  const t = clamp01(value);
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function pickDifferent<T>(items: T[], current: T): T {
  const options = items.filter((item) => item !== current);
  return options[Math.floor(Math.random() * options.length)] ?? current;
}

function getIdleDelay(): number {
  return IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
}

function drawSprite(matrix: Matrix, sprite: string[], offsetX: number, offsetY: number, intensity = 1): void {
  sprite.forEach((row, spriteRow) => {
    row.split('').forEach((pixel, spriteCol) => {
      if (pixel !== '1') {
        return;
      }

      const rowIndex = spriteRow + offsetY;
      const colIndex = spriteCol + offsetX;

      if (rowIndex < 0 || rowIndex >= ROWS || colIndex < 0 || colIndex >= COLS) {
        return;
      }

      matrix[rowIndex][colIndex] = clamp01(matrix[rowIndex][colIndex] + intensity);
    });
  });
}

function drawTinyText(matrix: Matrix, text: string, offsetX: number, offsetY: number, intensity = 1): void {
  const glyphWidth = 2;
  const glyphGap = 1;

  Array.from(text.toUpperCase()).forEach((character, characterIndex) => {
    const glyph = TINY_FONT[character];
    if (!glyph) {
      return;
    }

    const xOffset = offsetX + characterIndex * (glyphWidth + glyphGap);

    glyph.forEach((row, glyphRow) => {
      row.split('').forEach((pixel, glyphCol) => {
        if (pixel !== '1') {
          return;
        }

        const rowIndex = offsetY + glyphRow;
        const colIndex = xOffset + glyphCol;

        if (rowIndex < 0 || rowIndex >= ROWS || colIndex < 0 || colIndex >= COLS) {
          return;
        }

        matrix[rowIndex][colIndex] = clamp01(matrix[rowIndex][colIndex] + intensity);
      });
    });
  });
}

function renderIdleFrame(animation: IdleAnimation, elapsed: number, hovered: boolean): Matrix {
  const matrix = createMatrix(0);
  const speedScale = hovered ? HOVER_SPEED : 1;
  const time = elapsed * speedScale;

  switch (animation) {
    case 'blink': {
      const step = Math.floor(time / 140);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const seed = row * 19 + col * 11 + step * 7;
          const spark = hash(seed);
          const pulse = hash(seed + 3.17);
          matrix[row][col] = spark > 0.7 ? 0.45 + pulse * 0.55 : 0.06 + pulse * 0.14;
        }
      }
      break;
    }

    case 'heartbeat': {
      const pulse = easeOutExpo((Math.sin(time / 320) + 1) / 2);
      const waveRadius = (time / 700) % 3.5;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const distance = Math.hypot(row - 2, col - 2);
          const ring = Math.max(0, 1 - Math.abs(distance - waveRadius) / 1.15);
          matrix[row][col] = clamp01(ring * (0.35 + pulse * 0.65));
        }
      }
      break;
    }

    case 'matrixRain': {
      for (let col = 0; col < COLS; col++) {
        const trailSeed = hash(col * 8.3);
        const headPosition = ((time / 110 + trailSeed * (ROWS + 2)) % (ROWS + 3)) - 2;
        for (let row = 0; row < ROWS; row++) {
          const distance = headPosition - row;
          const headGlow = Math.max(0, 1 - Math.abs(distance) / 1.3);
          const tailGlow = Math.max(0, 1 - Math.abs(distance + 1.15) / 2.2);
          matrix[row][col] = clamp01(headGlow * 0.95 + tailGlow * 0.4);
        }
      }
      break;
    }

    case 'spinner': {
      const head = Math.floor(time / 110) % PERIMETER_PATH.length;
      PERIMETER_PATH.forEach(([row, col], index) => {
        const distance = (index - head + PERIMETER_PATH.length) % PERIMETER_PATH.length;
        const brightness = distance === 0 ? 1 : distance === 1 ? 0.7 : distance === 2 ? 0.35 : 0.08;
        matrix[row][col] = Math.max(matrix[row][col], brightness);
      });
      matrix[2][2] = 0.18;
      break;
    }

    case 'scan': {
      const scanPosition = (time / 140) % (ROWS + 1);
      for (let row = 0; row < ROWS; row++) {
        const scanGlow = Math.max(0, 1 - Math.abs(row - scanPosition) / 0.6);
        for (let col = 0; col < COLS; col++) {
          const grain = 0.15 + hash(row * 13 + col * 17 + Math.floor(time / 90)) * 0.35;
          matrix[row][col] = clamp01(grain + scanGlow * 0.85);
        }
      }
      break;
    }

    case 'wave': {
      const phase = time / 180;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const crest = (Math.sin(col * 1.2 - phase) + 1) / 2;
          const verticalFalloff = 1 - Math.abs(row - 2) / 2.6;
          const shimmer = 0.18 + hash(row * 7 + col * 5 + Math.floor(time / 160)) * 0.18;
          matrix[row][col] = clamp01(shimmer + crest * verticalFalloff * 0.78);
        }
      }
      break;
    }

    case 'orbit': {
      const head = Math.floor(time / 120) % PERIMETER_PATH.length;
      PERIMETER_PATH.forEach(([row, col], index) => {
        const distance = (index - head + PERIMETER_PATH.length) % PERIMETER_PATH.length;
        const brightness = distance === 0 ? 1 : distance === 1 ? 0.62 : distance === 2 ? 0.3 : 0.06;
        matrix[row][col] = Math.max(matrix[row][col], brightness);
      });

      matrix[1][2] = Math.max(matrix[1][2], 0.18);
      matrix[2][1] = Math.max(matrix[2][1], 0.18);
      matrix[2][3] = Math.max(matrix[2][3], 0.18);
      matrix[3][2] = Math.max(matrix[3][2], 0.18);
      break;
    }

    case 'breathing': {
      const breath = 0.28 + 0.72 * ((Math.sin(time / 1500) + 1) / 2);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const distance = Math.hypot(row - 2, col - 2);
          const falloff = 1 - distance / 3.4;
          matrix[row][col] = clamp01(breath * Math.max(0.08, falloff));
        }
      }
      break;
    }

    case 'spark': {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          matrix[row][col] = 0.05 + hash(row * 29 + col * 31 + Math.floor(time / 140)) * 0.08;
        }
      }

      const sparkCount = 1 + Math.floor(hash(Math.floor(time / 130)) * 3);
      for (let spark = 0; spark < sparkCount; spark++) {
        const sparkSeed = Math.floor(time / 130) * (spark + 1.5);
        const anchorRow = Math.floor(hash(sparkSeed + 3.2) * ROWS);
        const anchorCol = Math.floor(hash(sparkSeed + 7.4) * COLS);
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            const distance = Math.hypot(row - anchorRow, col - anchorCol);
            const burst = Math.max(0, 1 - distance / 1.6);
            matrix[row][col] = Math.max(matrix[row][col], burst * (0.65 + hash(sparkSeed + row + col) * 0.35));
          }
        }
      }
      break;
    }

    case 'equalizer': {
      for (let col = 0; col < COLS; col++) {
        const wobble = (Math.sin(time / 260 + col * 0.9) + 1) / 2;
        const seed = hash(col * 17.3 + Math.floor(time / 170));
        const barHeight = 1 + Math.floor((wobble * 0.6 + seed * 0.4) * ROWS);
        for (let row = 0; row < ROWS; row++) {
          const level = ROWS - row;
          const lit = level <= barHeight;
          const fade = lit ? lerp(0.4, 1, level / Math.max(1, barHeight)) : 0.08;
          matrix[row][col] = Math.max(matrix[row][col], fade);
        }
      }
      break;
    }
  }

  return matrix;
}

function renderEggFrame(animation: EasterEgg, elapsed: number, hovered: boolean): Matrix {
  const matrix = createMatrix(0);
  const hoverScale = hovered ? HOVER_SPEED : 1;
  const time = elapsed * hoverScale;
  const progress = clamp01(time / EGG_DURATION_MS);

  switch (animation) {
    case 'smile': {
      const pulse = 0.82 + 0.18 * (Math.sin(time / 300) + 1) / 2;
      drawSprite(matrix, SMILE_SPRITE, 0, 0, pulse);
      break;
    }

    case 'heart': {
      const beat = (Math.sin(progress * Math.PI * 4) + 1) / 2;
      drawSprite(matrix, HEART_SPRITE, 0, 0, 0.72 + beat * 0.28);
      matrix[2][2] = Math.max(matrix[2][2], 0.4 + beat * 0.6);
      break;
    }

    case 'ghost': {
      const travel = -1 + progress * 6;
      const bob = Math.round(Math.sin(progress * Math.PI * 4) * 0.4);
      drawSprite(matrix, GHOST_SPRITE, Math.round(travel), 1 + bob, 0.95);
      break;
    }

    case 'alien': {
      const blink = progress > 0.68 && progress < 0.82 ? 0.4 : 1;
      drawSprite(matrix, ALIEN_SPRITE, 0, 0, 0.88 * blink);
      matrix[1][1] = Math.max(matrix[1][1], 0.9 * blink);
      matrix[1][3] = Math.max(matrix[1][3], 0.9 * blink);
      break;
    }

    case 'rocket': {
      const y = Math.round(4 - progress * 6);
      drawSprite(matrix, ROCKET_SPRITE, 1, y, 0.98);
      for (let row = Math.max(0, y + 3); row < ROWS; row++) {
        const trailIntensity = Math.max(0, 0.7 - (row - (y + 3)) * 0.18);
        if (trailIntensity > 0) {
          matrix[row][2] = Math.max(matrix[row][2], trailIntensity);
        }
      }
      break;
    }

    case 'coffee': {
      drawSprite(matrix, COFFEE_SPRITE, 0, 0, 0.9);
      const steamPulse = (Math.sin(time / 180) + 1) / 2;
      matrix[0][1] = Math.max(matrix[0][1], 0.35 + steamPulse * 0.4);
      matrix[0][3] = Math.max(matrix[0][3], 0.35 + (1 - steamPulse) * 0.4);
      break;
    }

    case 'checkmark': {
      const flash = 0.4 + 0.6 * (1 - Math.abs(progress - 0.35) / 0.35);
      drawSprite(matrix, CHECK_SPRITE, 0, 0, Math.max(0.2, flash));
      break;
    }

    case 'questionMark': {
      const bob = Math.sin(progress * Math.PI * 2) * 0.2;
      const fade = 1 - progress * 0.25;
      drawSprite(matrix, QUESTION_SPRITE, 0, Math.round(bob), fade);
      break;
    }

    case 'hello': {
      const textWidth = 5;
      const offsetX = -COLS + Math.round(progress * (COLS + textWidth));
      drawTinyText(matrix, 'HI', offsetX, 0, 0.92);
      break;
    }

    case 'fortyTwo': {
      const pulse = 0.82 + 0.18 * (Math.sin(time / 220) + 1) / 2;
      drawTinyText(matrix, '42', 0, 0, pulse);
      break;
    }
  }

  return matrix;
}

// MatrixDisplay rendered as an inline element (no fixed positioning).
// QuickActions is responsible for placing it in the bottom bar.
export function MatrixDisplay() {
  const [pattern, setPattern] = useState<Matrix>(() => createMatrix(0));
  const hoveredRef = useRef(false);
  const currentIdleRef = useRef<IdleAnimation>(IDLE_ANIMATIONS[0]);
  const activeEggRef = useRef<EasterEgg | null>(null);
  const idleStartRef = useRef(0);
  const eggStartRef = useRef(0);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eggTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  const renderCurrentFrame = (now: number) => {
    const hovered = hoveredRef.current;
    const activeEgg = activeEggRef.current;

    if (activeEgg) {
      const elapsed = now - eggStartRef.current;
      setPattern(
        renderEggFrame(activeEgg, elapsed, hovered).map((row) =>
          row.map((cell) => clamp01(cell * (hovered ? HOVER_BOOST : 1))),
        ),
      );
      return;
    }

    const elapsed = now - idleStartRef.current;
    setPattern(
      renderIdleFrame(currentIdleRef.current, elapsed, hovered).map((row) =>
        row.map((cell) => clamp01(cell * (hovered ? HOVER_BOOST : 1))),
      ),
    );
  };

  const clearTimers = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }

    if (eggTimeoutRef.current) {
      clearTimeout(eggTimeoutRef.current);
      eggTimeoutRef.current = null;
    }
  };

  const scheduleNextIdleSwap = () => {
    if (prefersReducedMotionRef.current) {
      return;
    }

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      currentIdleRef.current = pickDifferent(IDLE_ANIMATIONS, currentIdleRef.current);
      idleStartRef.current = performance.now();
      renderCurrentFrame(idleStartRef.current);
      scheduleNextIdleSwap();
    }, getIdleDelay());
  };

  const endEasterEgg = () => {
    activeEggRef.current = null;
    idleStartRef.current = performance.now();
    renderCurrentFrame(idleStartRef.current);
    scheduleNextIdleSwap();
  };

  const triggerEasterEgg = (egg: EasterEgg) => {
    if (prefersReducedMotionRef.current) {
      return;
    }

    clearTimers();
    activeEggRef.current = egg;
    eggStartRef.current = performance.now();
    renderCurrentFrame(eggStartRef.current);
    eggTimeoutRef.current = setTimeout(endEasterEgg, EGG_DURATION_MS);
  };

  const cycleAnimation = () => {
    clearTimers();
    activeEggRef.current = null;
    const currentIndex = IDLE_ANIMATIONS.indexOf(currentIdleRef.current);
    currentIdleRef.current = IDLE_ANIMATIONS[(currentIndex + 1) % IDLE_ANIMATIONS.length];
    idleStartRef.current = performance.now();
    renderCurrentFrame(idleStartRef.current);
    scheduleNextIdleSwap();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
      clearTimers();

      if (mediaQuery.matches) {
        activeEggRef.current = null;
        currentIdleRef.current = 'breathing';
      } else {
        currentIdleRef.current = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
      }

      idleStartRef.current = performance.now();
      renderCurrentFrame(idleStartRef.current);

      setMotionEnabled(!mediaQuery.matches);
      if (!mediaQuery.matches) {
        scheduleNextIdleSwap();
      }

      setIsReady(true);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
      clearTimers();
    };
    // The animation engine uses refs, so the effect only needs to run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isReady || !motionEnabled) {
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const frameLoop = (now: number) => {
      if (prefersReducedMotionRef.current) {
        return;
      }

      if (!frameTimeRef.current || now - frameTimeRef.current >= FRAME_MS) {
        frameTimeRef.current = now;
        renderCurrentFrame(now);
      }

      rafRef.current = requestAnimationFrame(frameLoop);
    };

    rafRef.current = requestAnimationFrame(frameLoop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // The frame loop reads from refs and intentionally remains stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, motionEnabled]);

  const handlePointerEnter = () => {
    hoveredRef.current = true;
    triggerEasterEgg(EGG_ANIMATIONS[Math.floor(Math.random() * EGG_ANIMATIONS.length)]);
  };

  const handlePointerLeave = () => {
    hoveredRef.current = false;
  };

  const handleClick = () => {
    if (prefersReducedMotionRef.current) {
      cycleAnimation();
      return;
    }

    if (Math.random() < EGG_TRIGGER_CHANCE) {
      triggerEasterEgg(EGG_ANIMATIONS[Math.floor(Math.random() * EGG_ANIMATIONS.length)]);
      return;
    }

    cycleAnimation();
  };

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className="bg-black/30 backdrop-blur-md border border-[#00ff88]/30 rounded-xl p-1.5
                 cursor-pointer transition-all duration-300 flex items-center justify-center
                 w-12 h-12 shadow-[0_4px_15px_rgba(0,0,0,0.2)]
                 hover:bg-[#00ff88]/15 hover:scale-105
                 hover:border-[#00ff88]/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
      title="Matrix Display"
      aria-label="Retro matrix display"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="text-[#00ff88] flex flex-col gap-0.5">
        {pattern.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0.5">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className="w-1 h-1 rounded-sm transition-opacity duration-200"
                style={{
                  backgroundColor: '#00ff88',
                  opacity: clamp01(cell),
                  boxShadow: cell > 0.2 ? '0 0 3px currentColor' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
