'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrismButtonGroup, PrismToggleButton } from '@/components/ui/PrismButton';
import { GradientButton } from '@/components/kokonutui/gradient-button';
import { CosmicButton } from '@/components/ui/cosmic-button';

interface WebScraperToolProps {
  onClose: () => void;
}

interface ScrapePage {
  url: string;
  title: string;
  description: string;
  content: string;
  markdown: string;
  html: string;
  wordCount: number;
}

interface ScrapeResult {
  baseUrl: string;
  scrapedAt: string;
  totalPages: number;
  pages: ScrapePage[];
}

type Format = 'json' | 'csv';
type Mode = 'single' | 'crawl';

export function WebScraperTool({ onClose }: WebScraperToolProps) {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<Format>('json');
  const [mode, setMode] = useState<Mode>('single');
  const [maxPages, setMaxPages] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jsonResult, setJsonResult] = useState<ScrapeResult | null>(null);
  const [csvResult, setCsvResult] = useState('');

  const resultText = useMemo(() => {
    if (format === 'csv') return csvResult;
    return jsonResult ? JSON.stringify(jsonResult, null, 2) : '';
  }, [csvResult, format, jsonResult]);

  const scrape = async () => {
    setLoading(true);
    setError('');
    setJsonResult(null);
    setCsvResult('');

    try {
      const response = await fetch('/api/scrape-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format,
          mode,
          maxPages: mode === 'crawl' ? maxPages : 1,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Scrape failed.');
      }

      if (format === 'csv') {
        setCsvResult(await response.text());
      } else {
        setJsonResult((await response.json()) as ScrapeResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scrape failed.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultText) return;

    const type = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([resultText], { type });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `scraped-docs.${format}`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  const copy = async () => {
    if (resultText) {
      await navigator.clipboard.writeText(resultText);
    }
  };

  const pageCount = jsonResult?.totalPages ?? (csvResult ? Math.max(csvResult.split('\n').length - 1, 0) : 0);

  return (
    <div 
      className="flex h-full flex-col text-white"
      style={{
        background: '#090c12',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes scraper-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes scraper-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(0, 223, 129, 0.4); }
          50% { box-shadow: 0 0 16px rgba(0, 223, 129, 0.7); }
        }

        .scraper-input:focus {
          border-color: rgba(0, 223, 129, 0.3);
          background: rgba(0, 223, 129, 0.03);
        }

        .scraper-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scraper-btn:active {
          transform: scale(0.97);
        }

        .scraper-result-preview::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scraper-result-preview::-webkit-scrollbar-track {
          background: transparent;
        }

        .scraper-result-preview::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .scraper-result-preview::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 223, 129, 0.2);
        }
      `}</style>

      {/* Top energy rail */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 223, 129, 0.4) 50%, transparent 100%)',
          zIndex: 10,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between border-b p-5"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(0, 223, 129, 0.08)',
              border: '1px solid rgba(0, 223, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00df81" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
              <polyline points="7.5 19.79 7.5 14.6 3 12"/>
              <polyline points="21 12 16.5 14.6 16.5 19.79"/>
              <polyline points="3 12 7.5 9.4 7.5 4.21"/>
              <line x1="12" y1="6.81" x2="12" y2="12.03"/>
              <line x1="12" y1="12.03" x2="16.5" y2="14.6"/>
            </svg>
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00df81',
                  animation: 'scraper-glow 1.5s infinite',
                }}
              />
            )}
          </div>

          {/* Title */}
          <div>
            <div style={{ 
              fontSize: 15, 
              fontWeight: 700, 
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              Web Scraper
            </div>
            <div style={{ 
              fontSize: 10, 
              color: 'rgba(0, 223, 129, 0.5)', 
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              marginTop: 2,
            }}>
              Data Extraction
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="scraper-btn"
          title="Close"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 60, 60, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 60, 60, 0.3)';
            e.currentTarget.style.color = '#ff6b6b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Main content grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[340px_1fr]">
        {/* Left panel: Controls */}
        <section 
          className="space-y-4 border-b p-5 lg:border-b-0 lg:border-r"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.04)',
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Link input */}
          <div>
            <label 
              className="mb-2 block text-xs font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Target URL
            </label>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/docs"
              className="scraper-input w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s ease',
              }}
            />
          </div>

          {/* Mode selector */}
          <div>
            <span 
              className="mb-2 block text-xs font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Scrape Mode
            </span>
            <PrismButtonGroup>
              {(['single', 'crawl'] as const).map((value) => (
                <PrismToggleButton
                  key={value}
                  isActive={mode === value}
                  onClick={() => setMode(value)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {value}
                </PrismToggleButton>
              ))}
            </PrismButtonGroup>
          </div>

          {/* Max pages slider */}
          <AnimatePresence>
            {mode === 'crawl' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label 
                  className="mb-2 block text-xs font-semibold"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Max Pages: <span style={{ color: '#00df81', fontWeight: 700 }}>{maxPages}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={maxPages}
                  onChange={(event) => setMaxPages(Number(event.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#00df81',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format selector */}
          <div>
            <span 
              className="mb-2 block text-xs font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Output Format
            </span>
            <PrismButtonGroup>
              {(['json', 'csv'] as const).map((value) => (
                <PrismToggleButton
                  key={value}
                  isActive={format === value}
                  onClick={() => setFormat(value)}
                  style={{ 
                    textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}
                >
                  {value}
                </PrismToggleButton>
              ))}
            </PrismButtonGroup>
          </div>

          {/* Scrape button */}
          <GradientButton
            loading={loading}
            onClick={scrape}
            disabled={!url.trim() || loading}
            className="w-full h-12 text-sm font-bold tracking-wider uppercase"
            variant="emerald"
          >
            {loading ? 'EXTRACTING...' : 'EXTRACT DATA'}
          </GradientButton>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg p-3 text-xs"
                style={{
                  background: 'rgba(255, 60, 60, 0.1)',
                  border: '1px solid rgba(255, 60, 60, 0.3)',
                  color: '#ff6b6b',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats panel */}
          <div 
            className="rounded-lg p-3 text-xs"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div className="flex justify-between gap-3 mb-2">
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>PAGES SCRAPED</span>
              <strong style={{ color: '#00df81', fontWeight: 700 }}>{pageCount}</strong>
            </div>
            {jsonResult && (
              <div className="flex justify-between gap-3 mb-2">
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>TOTAL WORDS</span>
                <strong style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700 }}>
                  {jsonResult.pages.reduce((s, p) => s + (p.wordCount ?? 0), 0).toLocaleString()}
                </strong>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>OUTPUT FORMAT</span>
              <strong style={{ color: '#00df81', fontWeight: 700, textTransform: 'uppercase' }}>{format}</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <CosmicButton
              as="button"
              className="flex-1"
              onClick={copy}
              disabled={!resultText}
            >
              COPY
            </CosmicButton>
            <CosmicButton
              as="button"
              className="flex-1"
              onClick={download}
              disabled={!resultText}
            >
              DOWNLOAD
            </CosmicButton>
          </div>
        </section>

        {/* Right panel: Result preview */}
        <section 
          className="flex min-h-0 flex-col p-5"
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 
              className="text-xs font-bold"
              style={{
                color: 'rgba(0, 223, 129, 0.7)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              RESULT PREVIEW
            </h2>
            {jsonResult && (
              <span 
                className="truncate text-xs"
                style={{
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {jsonResult.baseUrl}
              </span>
            )}
          </div>

          {resultText ? (
            <motion.pre
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="scraper-result-preview min-h-0 flex-1 overflow-auto rounded-lg p-4 text-xs leading-relaxed"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {resultText}
            </motion.pre>
          ) : (
            <div 
              className="flex min-h-0 flex-1 items-center justify-center rounded-lg border p-8 text-center text-sm"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.06)',
                borderStyle: 'dashed',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <div>
                <svg 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  style={{ 
                    margin: '0 auto 12px',
                    opacity: 0.3,
                  }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.02em' }}>
                  Paste a URL and extract data to preview results here
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
