'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentOrb } from '@/components/AgentOrb';
import { getRemainingSeconds, loadPomodoroState } from '@/lib/pomodoro-state';

interface IslandEvent {
  title: string;
  subtitle?: string;
  icon?: string;
  duration?: number;
}

interface IslandSettings {
  enabled: boolean;
  showSeconds: boolean;
  autoExpand: boolean;
  clockFormat: '12' | '24';
}

interface PomodoroIslandState {
  active: boolean;
  remainingSeconds: number;
  endsAt: number | null;
}

function loadIslandPomodoroState(): PomodoroIslandState | null {
  const state = loadPomodoroState();
  if (!state) return null;
  const remainingSeconds = getRemainingSeconds(state);
  return {
    active: state.isRunning && remainingSeconds > 0,
    remainingSeconds,
    endsAt: state.endsAt,
  };
}

function loadSettings(): IslandSettings {
  if (typeof window === 'undefined') {
    return { enabled: true, showSeconds: false, autoExpand: true, clockFormat: '24' };
  }
  return {
    enabled: localStorage.getItem('dynamicIsland') !== 'false',
    showSeconds: localStorage.getItem('dynamicIslandSeconds') === 'true',
    autoExpand: localStorage.getItem('dynamicIslandExpand') !== 'false',
    clockFormat: (localStorage.getItem('clockFormat') as '12' | '24') || '24',
  };
}

function formatTime(date: Date, format: '12' | '24', showSeconds: boolean): string {
  if (format === '12') {
    let h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return showSeconds ? `${h}:${m}:${s} ${ampm}` : `${h}:${m} ${ampm}`;
  }
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const islandTransition = {
  duration: 0.24,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

const islandContentTransition = {
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export function DynamicIsland() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<IslandSettings>(loadSettings);
  const [now, setNow] = useState(() => new Date());
  const [hovered, setHovered] = useState(false);
  const [event, setEvent] = useState<IslandEvent | null>(null);
  const [eventVisible, setEventVisible] = useState(false);
  const [pomodoro, setPomodoro] = useState<PomodoroIslandState | null>(loadIslandPomodoroState);
  const eventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerEnter = useCallback(() => {
    if (hoverEndTimerRef.current) clearTimeout(hoverEndTimerRef.current);
    setHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (hoverEndTimerRef.current) clearTimeout(hoverEndTimerRef.current);
    hoverEndTimerRef.current = setTimeout(() => setHovered(false), 80);
  }, []);

  useEffect(() => () => {
    if (hoverEndTimerRef.current) clearTimeout(hoverEndTimerRef.current);
  }, []);

  // Mark mounted on client & load settings
  useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handler = () => setSettings(loadSettings());
    window.addEventListener('prism:island-settings', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('prism:island-settings', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Listen for event notifications
  const handleIslandEvent = useCallback((e: Event) => {
    if (!settings.autoExpand) return;
    const detail = (e as CustomEvent<IslandEvent>).detail;
    if (!detail?.title) return;

    // Clear any pending timers
    if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    setEvent(detail);
    setEventVisible(true);

    const duration = detail.duration ?? 3000;
    // Fade out slightly before removing
    eventTimerRef.current = setTimeout(() => {
      setEventVisible(false);
      dismissTimerRef.current = setTimeout(() => setEvent(null), 400);
    }, duration);
  }, [settings.autoExpand]);

  useEffect(() => {
    window.addEventListener('prism:island-event', handleIslandEvent);
    return () => window.removeEventListener('prism:island-event', handleIslandEvent);
  }, [handleIslandEvent]);

  useEffect(() => {
    const handlePomodoroState = (e: Event) => {
      const detail = (e as CustomEvent<PomodoroIslandState>).detail;
      if (detail) setPomodoro(detail);
    };

    window.addEventListener('prism:pomodoro-state', handlePomodoroState);
    return () => window.removeEventListener('prism:pomodoro-state', handlePomodoroState);
  }, []);

  useEffect(() => {
    if (!pomodoro?.active || !pomodoro.endsAt) return;

    const syncPomodoroCountdown = () => {
      const remainingSeconds = Math.max(0, Math.ceil((pomodoro.endsAt! - Date.now()) / 1000));
      if (remainingSeconds > 0) {
        setPomodoro((current) => current ? { ...current, remainingSeconds } : current);
        return;
      }

      setPomodoro((current) => current ? { ...current, active: false, remainingSeconds: 0, endsAt: null } : current);
      window.dispatchEvent(
        new CustomEvent('prism:island-event', {
          detail: {
            title: 'Focus session complete',
            subtitle: 'Pomodoro timer finished',
            duration: 4000,
          },
        }),
      );
    };

    syncPomodoroCountdown();
    const interval = setInterval(syncPomodoroCountdown, 1000);
    return () => clearInterval(interval);
  }, [pomodoro?.active, pomodoro?.endsAt]);

  if (!mounted || !settings.enabled) return null;

  const timeStr = formatTime(now, settings.clockFormat, settings.showSeconds);
  const dateStr = formatDate(now);

  const isPomodoroActive = pomodoro?.active === true;
  const isExpanded = hovered || eventVisible;
  const showEvent = eventVisible && event;
  const islandWidth = showEvent ? 340 : isExpanded ? (isPomodoroActive ? 370 : 300) : isPomodoroActive ? 224 : 130;
  const islandHeight = isExpanded ? 72 : 34;

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '340px',
        height: '72px',
      }}
      aria-label="Dynamic Island"
    >
      <motion.div
        className="hud-capsule relative overflow-hidden"
        animate={{
          width: islandWidth,
          height: islandHeight,
          borderRadius: isExpanded ? 24 : 9999,
        }}
        transition={islandTransition}
        style={{
          cursor: 'default',
          transformOrigin: 'center top',
          willChange: 'width, height, border-radius',
          isolation: 'isolate',
          contain: 'layout paint',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {/* Collapsed: time only */}
        <AnimatePresence initial={false}>
          {!isExpanded && (
            <motion.div
              key="collapsed"
              className="absolute inset-0 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={islandContentTransition}
              style={{ pointerEvents: 'none' }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.92)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {timeStr}
              </span>
              {isPomodoroActive && (
                <>
                  <span
                    style={{
                      width: '1px',
                      height: '14px',
                      background: 'rgba(0, 223, 129, 0.35)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#00df81',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    POMO {formatDuration(pomodoro.remainingSeconds)}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded: time + date / event */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              className="absolute inset-0 flex items-center justify-between px-[18px]"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={islandContentTransition}
              style={{ pointerEvents: 'none' }}
            >
              {showEvent ? (
                // Event notification layout
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {event.icon && (
                      <span style={{ fontSize: '22px', lineHeight: 1 }}>{event.icon}</span>
                    )}
                    <div>
                      <div
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'rgba(255, 255, 255, 0.95)',
                          lineHeight: 1.2,
                        }}
                      >
                        {event.title}
                      </div>
                      {event.subtitle && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '2px',
                            lineHeight: 1.2,
                          }}
                        >
                          {event.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {timeStr}
                    </div>
                  </div>
                </>
              ) : (
                // Default expanded: time + date + status
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '22px',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.95)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {timeStr}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#94a3b8',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {dateStr}
                    </span>
                  </div>

                  {/* Status pill — live-status-badge pattern */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <div className="live-status-badge">
                      <AgentOrb size="18px" provider="groq" />
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        AGENT ACTIVE
                      </span>
                    </div>
                    {isPomodoroActive && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#00df81',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '0.04em',
                        }}
                      >
                        POMODORO {formatDuration(pomodoro.remainingSeconds)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle inner shine */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.04), transparent)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </div>
  );
}
