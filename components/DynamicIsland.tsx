'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentOrb } from '@/components/AgentOrb';

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

export function DynamicIsland() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<IslandSettings>(loadSettings);
  const [now, setNow] = useState(() => new Date());
  const [hovered, setHovered] = useState(false);
  const [event, setEvent] = useState<IslandEvent | null>(null);
  const [eventVisible, setEventVisible] = useState(false);
  const eventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  if (!mounted || !settings.enabled) return null;

  const timeStr = formatTime(now, settings.clockFormat, settings.showSeconds);
  const dateStr = formatDate(now);

  const isExpanded = hovered || eventVisible;
  const showEvent = eventVisible && event;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Dynamic Island"
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="hud-capsule relative overflow-hidden"
        animate={{
          width: isExpanded ? (showEvent ? 340 : 300) : 130,
          height: isExpanded ? 72 : 34,
          borderRadius: isExpanded ? 24 : 9999,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 28,
          mass: 0.8,
        }}
        style={{
          cursor: 'default',
        }}
      >
        {/* Collapsed: time only */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              key="collapsed"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded: time + date / event */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="expanded"
              className="absolute inset-0 flex items-center justify-between px-[18px]"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, delay: 0.05 }}
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
