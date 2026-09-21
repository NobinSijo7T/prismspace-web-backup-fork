'use client';

/**
 * components/SearchBar.tsx
 * ────────────────────────
 * A premium search bar placed under the clock on the hero screen.
 *
 * Features:
 * - Mode toggle: Search Engine ↔ Agent Swarm
 * - Search engine selector: Google, Brave, DuckDuckGo, Bing, Perplexity, Kagi
 *   with SVG logos + dropdown picker
 * - Keyboard: Enter to search / submit
 * - Persists engine choice and mode to localStorage
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentOrb } from './AgentOrb';

// ── Search engine definitions ─────────────────────────────────────────────────

type EngineId = 'google' | 'brave' | 'duckduckgo' | 'bing' | 'perplexity' | 'kagi';

interface Engine {
  id: EngineId;
  name: string;
  url: (q: string) => string;
  color: string;       // brand accent for the active indicator
  logo: React.ReactNode;
}

// ── Engine favicon helper (uses each site's own favicon for pixel-perfect logos) ──
// We use img tags with the Google favicon proxy — always accurate, no custom SVG needed.
const EngineFavicon = ({ domain, name }: { domain: string; name: string }) => (
  /* eslint-disable @next/next/no-img-element */
  <img
    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
    alt={name}
    width={18}
    height={18}
    style={{ borderRadius: '3px', display: 'block', flexShrink: 0 }}
    onError={(e) => {
      // Fallback: first letter in brand color
      const el = e.currentTarget;
      el.style.display = 'none';
      const next = el.nextElementSibling as HTMLElement | null;
      if (next) next.style.display = 'flex';
    }}
  />
);

const AgentIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#00df81" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#00df81" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="18" cy="6" r="2" fill="#00df81" opacity="0.7"/>
    <path d="M18 4v1m0 2v1m-1-3h1m2 0h1" stroke="#00df81" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2"/>
    <path d="M20 20L16.2 16.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const SwarmIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="6" r="2" fill="currentColor"/>
    <path d="M18 3.5v1m0 3v1m-1.5-2.5h1m2 0h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Logo component per engine — uses real favicon image with letter fallback
const EngineLogo = ({ domain, name, color }: { domain: string; name: string; color: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', width: 18, height: 18, flexShrink: 0 }}>
    <EngineFavicon domain={domain} name={name} />
    {/* Letter fallback (hidden by default, shown if favicon fails) */}
    <span
      style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: 3,
        background: color,
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {name[0]}
    </span>
  </span>
);

const ENGINES: Engine[] = [
  {
    id: 'google',
    name: 'Google',
    url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    color: '#4285F4',
    logo: <EngineLogo domain="google.com" name="Google" color="#4285F4" />,
  },
  {
    id: 'brave',
    name: 'Brave',
    url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    color: '#FB542B',
    logo: <EngineLogo domain="brave.com" name="Brave" color="#FB542B" />,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    color: '#DE5833',
    logo: <EngineLogo domain="duckduckgo.com" name="DuckDuckGo" color="#DE5833" />,
  },
  {
    id: 'bing',
    name: 'Bing',
    url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    color: '#0078D4',
    logo: <EngineLogo domain="bing.com" name="Bing" color="#0078D4" />,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
    color: '#20B2AA',
    logo: <EngineLogo domain="perplexity.ai" name="Perplexity" color="#20B2AA" />,
  },
  {
    id: 'kagi',
    name: 'Kagi',
    url: (q) => `https://kagi.com/search?q=${encodeURIComponent(q)}`,
    color: '#F6C14E',
    logo: <EngineLogo domain="kagi.com" name="Kagi" color="#F6C14E" />,
  },
];

type Mode = 'search' | 'agent';

interface SearchBarProps {
  onAgentSubmit?: (query: string) => void; // called when in agent mode
}

export function SearchBar({ onAgentSubmit }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('search');
  const [engineId, setEngineId] = useState<EngineId>('google');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Restore preferences from localStorage
  useEffect(() => {
    setMounted(true);
    const savedEngine = localStorage.getItem('searchEngine') as EngineId | null;
    const savedMode = localStorage.getItem('searchMode') as Mode | null;
    if (savedEngine && ENGINES.find((e) => e.id === savedEngine)) setEngineId(savedEngine);
    if (savedMode) setMode(savedMode);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeEngine = ENGINES.find((e) => e.id === engineId) ?? ENGINES[0];

  const handleModeToggle = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    localStorage.setItem('searchMode', m);
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  const handleEngineSelect = (id: EngineId) => {
    setEngineId(id);
    localStorage.setItem('searchEngine', id);
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    if (mode === 'search') {
      window.open(activeEngine.url(q), '_blank', 'noopener,noreferrer');
    } else {
      onAgentSubmit?.(q);
    }
    setQuery('');
  }, [query, mode, activeEngine, onAgentSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setDropdownOpen(false);
  };

  if (!mounted) return null;

  return (
    <div
      className="flex flex-col items-center gap-3 w-full"
      style={{ maxWidth: '640px' }}
    >
      {/* ── Mode toggle ──────────────────────────────────────────────────── */}
      <div
        className="relative flex items-center p-1 rounded-[12px] select-none"
        style={{
          background: '#090c12',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {([
          { id: 'search' as const, label: 'Search', icon: <SearchIcon /> },
          { id: 'agent' as const, label: 'Agent Swarm', icon: <SwarmIcon /> },
        ]).map(({ id, label, icon }) => {
          const isActive = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleModeToggle(id)}
              title={id === 'agent' ? 'Run query through Agent Swarm' : 'Search the web'}
              className="relative z-10 flex items-center gap-2 px-5 py-1.5 rounded-[8px] text-[12px] font-mono font-[700] tracking-[0.02em] transition-colors duration-150 outline-none cursor-pointer"
              style={{
                color: isActive
                  ? id === 'agent'
                    ? '#00df81'
                    : '#ffffff'
                  : 'rgba(255, 255, 255, 0.45)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-search-mode-pill"
                  className="absolute inset-0 rounded-[8px] pointer-events-none"
                  style={{
                    background:
                      id === 'agent'
                        ? 'rgba(0, 223, 129, 0.12)'
                        : 'rgba(255, 255, 255, 0.08)',
                    border:
                      id === 'agent'
                        ? '1px solid rgba(0, 223, 129, 0.35)'
                        : '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow:
                      id === 'agent'
                        ? '0 0 16px rgba(0, 223, 129, 0.25)'
                        : 'none',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {icon}
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search input row ──────────────────────────────────────────────── */}
      <motion.div
        className="flex items-center w-full architecture-board micro-grid"
        style={{
          padding: '0',
          borderColor: mode === 'agent'
            ? 'rgba(0, 223, 129, 0.35)'
            : 'rgba(0, 0, 0, 0.25)',
          boxShadow: mode === 'agent'
            ? '0 0 24px rgba(0, 223, 129, 0.1), 0 30px 60px -15px rgba(0, 0, 0, 0.5)'
            : '0 30px 60px -15px rgba(0, 0, 0, 0.5)',
        }}
        animate={{
          borderColor: mode === 'agent' ? 'rgba(0, 223, 129, 0.35)' : 'rgba(0, 0, 0, 0.25)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Engine selector (search mode) / Agent icon (agent mode) */}
        <AnimatePresence mode="wait">
          {mode === 'search' ? (
            <motion.div
              key="search-engine"
              className="relative flex-shrink-0"
              ref={dropdownRef}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                title="Change search engine"
                className="flex items-center gap-2 px-4 py-3.5 rounded-l-[18px] transition-all duration-150 outline-none group"
                style={{
                  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                  background: dropdownOpen ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                id="engine-selector-btn"
              >
                {activeEngine.logo}
                <svg
                  viewBox="0 0 10 6"
                  width="10"
                  height="6"
                  className="transition-transform duration-200"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    role="listbox"
                    aria-labelledby="engine-selector-btn"
                    className="absolute z-[9999] rounded-[10px] overflow-hidden"
                    style={{
                      background: '#090c12',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                      width: '180px',
                      top: 'calc(100% + 4px)',
                      left: 0,
                    }}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {ENGINES.map((eng) => (
                      <button
                        key={eng.id}
                        role="option"
                        aria-selected={eng.id === engineId}
                        onClick={() => handleEngineSelect(eng.id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[12px] font-mono text-left transition-colors duration-150 outline-none"
                        style={{
                          background:
                            eng.id === engineId
                              ? 'rgba(0, 223, 129, 0.08)'
                              : 'transparent',
                          color: eng.id === engineId ? '#00df81' : 'rgba(255, 255, 255, 0.55)',
                          borderLeft: eng.id === engineId
                            ? '2px solid #00df81'
                            : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            eng.id === engineId ? 'rgba(0, 223, 129, 0.08)' : 'transparent';
                        }}
                      >
                        <span className="flex-shrink-0">{eng.logo}</span>
                        <span className="font-[600]">{eng.name}</span>
                        {eng.id === engineId && (
                          <svg className="ml-auto" viewBox="0 0 12 12" width="12" height="12">
                            <path d="M2 6l3 3 5-5" stroke="#00df81" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="agent-icon"
              className="flex items-center px-3.5 py-3 flex-shrink-0"
              style={{ borderRight: '1px solid rgba(0, 223, 129, 0.15)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AgentOrb size="24px" provider="groq" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input */}
        <input
          ref={inputRef}
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'search'
              ? `Search with ${activeEngine.name}…`
              : 'Ask the agent swarm anything…'
          }
          className="flex-1 bg-transparent px-4 py-3.5 text-[14px] text-white outline-none font-mono font-[500] tracking-normal"
          style={{
            minWidth: 0,
            color: '#ffffff',
          }}
          autoComplete="off"
          spellCheck="false"
        />
        <style jsx>{`
          input::placeholder {
            color: rgba(148, 163, 184, 0.5);
            font-family: 'JetBrains Mono', monospace;
          }
        `}</style>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!query.trim()}
          title={mode === 'search' ? 'Search' : 'Send to Agent Swarm'}
          id="search-submit-btn"
          className="flex items-center justify-center w-12 h-12 m-1 rounded-[10px] flex-shrink-0 transition-all duration-200 outline-none"
          style={{
            background:
              !query.trim()
                ? 'rgba(255, 255, 255, 0.04)'
                : mode === 'agent'
                ? '#00df81'
                : 'rgba(255, 255, 255, 0.1)',
            cursor: !query.trim() ? 'not-allowed' : 'pointer',
            boxShadow:
              query.trim() && mode === 'agent'
                ? '0 0 16px rgba(0, 223, 129, 0.4)'
                : 'none',
          }}
          whileTap={query.trim() ? { scale: 0.93 } : {}}
          aria-label="Submit search"
        >
          {mode === 'agent' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M22 2L11 13" stroke={query.trim() ? '#000' : 'rgba(255,255,255,0.2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke={query.trim() ? '#000' : 'rgba(255,255,255,0.2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="11" cy="11" r="8" stroke={query.trim() ? '#fff' : 'rgba(255,255,255,0.2)'} strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke={query.trim() ? '#fff' : 'rgba(255,255,255,0.2)'} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </motion.button>
      </motion.div>

      {/* ── Agent mode hint ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mode === 'agent' && (
          <motion.p
            className="text-[11px] font-mono font-[500]"
            style={{ color: 'rgba(0, 223, 129, 0.6)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            ↳ Query will be sent to the Agent Swarm orchestrator
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
