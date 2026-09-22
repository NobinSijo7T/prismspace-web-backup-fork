'use client';

/**
 * components/AgentSwarm.tsx
 * ──────────────────────────
 * Centered dialog Agent Swarm orchestration dashboard.
 * Redesigned with PrismSpace High-Voltage design system.
 * Shows live agent status, log streaming, HITL controls, and a task launcher.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  GitBranch,
  KeyRound,
  ListTree,
  MessageSquare,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  TerminalSquare,
  Trash2,
  X,
} from 'lucide-react';

// ── Custom dark-themed Select component ─────────────────────────────────────
interface SelectOption { value: string; label: ReactNode; }
interface StyledSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  className?: string;
}

function StyledSelect({ value, onChange, options, className = '' }: StyledSelectProps) {
  return (
    <div className={`relative ${className}`} style={{ userSelect: 'none' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          borderRadius: 'var(--prism-radius-lg)',
          border: '1px solid var(--prism-border-card)',
          background: 'var(--prism-board)',
          padding: '10px 36px 10px 12px',
          fontSize: '0.8125rem',
          color: '#fff',
          outline: 'none',
          transition: 'border-color 0.2s',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {typeof opt.label === 'string' ? opt.label : opt.value}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
    </div>
  );
}

// ── Lightweight inline Markdown renderer ─────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`cb-${i}`} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', overflowX: 'auto', margin: '8px 0', fontSize: '0.78rem', lineHeight: 1.6, color: '#a5f3c0', fontFamily: 'monospace' }}>
          {lang && <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }

    // Headings
    if (line.startsWith('### ')) { elements.push(<h5 key={`h5-${i}`} style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', margin: '12px 0 4px' }}>{inlineMarkdown(line.slice(4))}</h5>); i++; continue; }
    if (line.startsWith('## '))  { elements.push(<h4 key={`h4-${i}`} style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', margin: '14px 0 5px' }}>{inlineMarkdown(line.slice(3))}</h4>); i++; continue; }
    if (line.startsWith('# '))   { elements.push(<h3 key={`h3-${i}`} style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', margin: '16px 0 6px' }}>{inlineMarkdown(line.slice(2))}</h3>); i++; continue; }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />);
      i++; continue;
    }

    // Unordered list block
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) { items.push(lines[i].replace(/^[-*+] /, '')); i++; }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '6px 0', paddingLeft: '18px', listStyleType: 'disc' }}>
          {items.map((it, idx) => <li key={idx} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: 1.65, marginBottom: '2px' }}>{inlineMarkdown(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list block
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '6px 0', paddingLeft: '18px', listStyleType: 'decimal' }}>
          {items.map((it, idx) => <li key={idx} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: 1.65, marginBottom: '2px' }}>{inlineMarkdown(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { qLines.push(lines[i].slice(2)); i++; }
      elements.push(
        <blockquote key={`bq-${i}`} style={{ borderLeft: '3px solid rgba(0,223,129,0.4)', paddingLeft: '12px', margin: '8px 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontStyle: 'italic' }}>
          {qLines.map((ql, qi) => <span key={qi}>{inlineMarkdown(ql)}<br /></span>)}
        </blockquote>
      );
      continue;
    }

    // Blank line — small gap
    if (line.trim() === '') { elements.push(<div key={`gap-${i}`} style={{ height: '6px' }} />); i++; continue; }

    // Regular paragraph line
    elements.push(
      <p key={`p-${i}`} style={{ margin: '2px 0', color: 'rgba(255,255,255,0.88)', fontSize: '0.82rem', lineHeight: 1.7 }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div style={{ wordBreak: 'break-word' }}>{elements}</div>;
}

function inlineMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={idx} style={{ color: 'rgba(255,255,255,0.8)' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={idx} style={{ background: 'rgba(0,223,129,0.1)', color: '#00df81', padding: '1px 5px', borderRadius: '4px', fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

import {
  SwarmAgent,
  CreateAgentPayload,
  ModelProvider,
  createAgent,
  listAgents,
  approveAgent,
  streamAgentLogs,
  checkSwarmHealth,
  listMcpServers,
  saveMcpToken,
  removeMcpToken,
  connectGmail,
  gmailStatus,
  getGmailUserId,
  STATUS_COLORS,
  STATUS_LABELS,
  isTerminal,
  type McpServerStatus,
  type McpTokenStatus,
} from '@/lib/agent-swarm-client';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AgentCard } from './AgentCard';
import GridLoader from '@/components/ui/smoothui/grid-loader';
import { SwarmDagGraph } from './SwarmDagGraph';
import { db, type AgentChatMessage } from '@/lib/db';

interface AgentSwarmProps {
  onClose: () => void;
}

const MODELS: Record<ModelProvider, string[]> = {
  nvidia: ['nvidia/nemotron-3.5-lightning-30b-a3b'],
  groq: ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
};

const ACTIVE_SWARM_CHAT_KEY = 'prism.agentSwarm.activeChatId';

function createChatId() {
  return `swarm-chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromObjective(value: string) {
  const title = value.trim().replace(/\s+/g, ' ');
  return title.length > 42 ? `${title.slice(0, 39)}...` : title || 'New chat';
}

function formatChatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

// ── View types ──────────────────────────────────────────────────────────────
type SwarmView = 'launch' | 'runs' | 'settings';
type InspectorTab = 'dag' | 'logs' | 'output';

const VIEW_TABS: { id: SwarmView; label: string; icon: typeof Send }[] = [
  { id: 'launch', label: 'Launch', icon: Send },
  { id: 'runs', label: 'Runs', icon: Radio },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ── Motion presets ──────────────────────────────────────────────────────────
const viewTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
};

export function AgentSwarm({ onClose }: AgentSwarmProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [agents, setAgents] = useState<SwarmAgent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mcpServers, setMcpServers] = useState<McpServerStatus[]>([]);
  const [mcpTokens, setMcpTokens] = useState<McpTokenStatus[]>([]);
  const [mcpEnvFile, setMcpEnvFile] = useState<string | null>(null);
  const [selectedMcpServer, setSelectedMcpServer] = useState('figma');
  const [mcpEnvKey, setMcpEnvKey] = useState('FIGMA_API_TOKEN');
  const [mcpToken, setMcpToken] = useState('');
  const [savingMcpToken, setSavingMcpToken] = useState(false);
  const [mcpMessage, setMcpMessage] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [pendingRemoveKey, setPendingRemoveKey] = useState<string | null>(null);

  // New agent form
  const [objective, setObjective] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('nvidia');
  const [model, setModel] = useState(MODELS.nvidia[0]);
  const [maxAgents, setMaxAgents] = useState(3);
  const [hitl, setHitl] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [runsSubTab, setRunsSubTab] = useState<'agents' | 'chat'>('agents');

  // Per-user Gmail MCP
  const [gmailEmail, setGmailEmail] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('prism_gmail_email') : null,
  );
  const [gmailLoading, setGmailLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const uid = q.get('gmail_user_id');
    const email = q.get('gmail_email');
    if (uid) localStorage.setItem('prism_gmail_user_id', uid);
    if (email) {
      localStorage.setItem('prism_gmail_email', email);
      setGmailEmail(email);
    }
    const stored = uid ?? getGmailUserId();
    if (stored) {
      gmailStatus(stored)
        .then((s) => {
          if (s.connected) {
            setGmailEmail(s.email ?? email ?? null);
            if (s.email) localStorage.setItem('prism_gmail_email', s.email);
          } else {
            setGmailEmail(null);
            localStorage.removeItem('prism_gmail_email');
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // View navigation
  const [activeView, setActiveView] = useState<SwarmView>('launch');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('dag');

  const logsEndRef = useRef<HTMLDivElement>(null);
  const cleanupLogStream = useRef<(() => void) | null>(null);

  const chatSessions = useLiveQuery(
    () => db.agent_chat_sessions.orderBy('updatedAt').reverse().toArray(),
    [],
  );

  const currentSessionMessages = useLiveQuery(
    () =>
      activeSessionId
        ? db.agent_chat_messages
            .where('sessionId')
            .equals(activeSessionId)
            .sortBy('createdAt')
        : Promise.resolve([] as AgentChatMessage[]),
    [activeSessionId],
  );

  const currentSession = chatSessions?.find((session) => session.id === activeSessionId);

  const createNewChat = useCallback(async (seedTitle = 'New chat') => {
    const now = Date.now();
    const id = createChatId();
    await db.agent_chat_sessions.add({
      id,
      title: titleFromObjective(seedTitle),
      createdAt: now,
      updatedAt: now,
    });
    localStorage.setItem(ACTIVE_SWARM_CHAT_KEY, id);
    setActiveSessionId(id);
    setSelectedId(null);
    return id;
  }, []);

  const deleteChatSession = async (sessionId: string) => {
    if (!sessionId) return;
    const confirmed = confirm('Delete this chat and all its messages? This cannot be undone.');
    if (!confirmed) return;

    try {
      await db.agent_chat_messages.where('sessionId').equals(sessionId).delete();
      await db.agent_chat_sessions.delete(sessionId);

      if (activeSessionId === sessionId) {
        localStorage.removeItem(ACTIVE_SWARM_CHAT_KEY);
        setActiveSessionId(null);
      }

      toast.success('Chat deleted');
    } catch (err) {
      console.error('Failed to delete chat session', err);
      toast.error('Failed to delete chat');
    }
  };

  const ensureActiveSession = useCallback(
    async (seedTitle: string) => {
      if (activeSessionId) {
        const existing = await db.agent_chat_sessions.get(activeSessionId);
        if (existing) return activeSessionId;
      }

      const storedId =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_SWARM_CHAT_KEY)
          : null;
      if (storedId) {
        const stored = await db.agent_chat_sessions.get(storedId);
        if (stored) {
          setActiveSessionId(storedId);
          return storedId;
        }
      }

      const latest = await db.agent_chat_sessions.orderBy('updatedAt').last();
      if (latest) {
        localStorage.setItem(ACTIVE_SWARM_CHAT_KEY, latest.id);
        setActiveSessionId(latest.id);
        return latest.id;
      }

      return createNewChat(seedTitle);
    },
    [activeSessionId, createNewChat],
  );

  useEffect(() => {
    if (activeSessionId || chatSessions === undefined) return;

    const storedId =
      typeof window !== 'undefined'
        ? localStorage.getItem(ACTIVE_SWARM_CHAT_KEY)
        : null;
    const storedSession = storedId
      ? chatSessions.find((session) => session.id === storedId)
      : null;
    const nextSession = storedSession ?? chatSessions[0];

    if (nextSession) {
      setActiveSessionId(nextSession.id);
      localStorage.setItem(ACTIVE_SWARM_CHAT_KEY, nextSession.id);
    } else {
      createNewChat();
    }
  }, [activeSessionId, chatSessions, createNewChat]);

  // ── Health check ──────────────────────────────────────────────────────────
  useEffect(() => {
    checkSwarmHealth().then(setBackendOnline);
    const interval = setInterval(() => checkSwarmHealth().then(setBackendOnline), 8000);
    return () => clearInterval(interval);
  }, []);

  const refreshMcpServers = useCallback(async () => {
    try {
      const data = await listMcpServers();
      setMcpServers(data.servers);
      setMcpTokens(data.tokens);
      setMcpEnvFile(data.env_file ?? null);
    } catch {
      setMcpServers([]);
      setMcpTokens([]);
      setMcpEnvFile(null);
    }
  }, []);

  useEffect(() => {
    refreshMcpServers();
  }, [refreshMcpServers]);

  useEffect(() => {
    if (!mcpServers.length || mcpServers.some((server) => server.name === selectedMcpServer)) {
      return;
    }

    const fallback = mcpServers.find((server) => server.name === 'figma') ?? mcpServers[0];
    setSelectedMcpServer(fallback.name);
    setMcpEnvKey(fallback.env[0]?.key ?? (fallback.name === 'figma' ? 'FIGMA_API_TOKEN' : ''));
  }, [mcpServers, selectedMcpServer]);

  // ── Fetch agents ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const data = await listAgents();
      setAgents(data);
    } catch {
      // backend offline
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  // ── Log streaming ─────────────────────────────────────────────────────────
  useEffect(() => {
    cleanupLogStream.current?.();
    cleanupLogStream.current = null;

    if (!selectedId) {
      setLogLines([]);
      return;
    }

    setLogLines([]);

    const stop = streamAgentLogs(
      selectedId,
      (line) => {
        setLogLines((prev) => [...prev, line]);
      },
      () => {},
    );
    cleanupLogStream.current = stop;

    return () => {
      stop();
      cleanupLogStream.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  // ── Launch new agent ──────────────────────────────────────────────────────
  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedObjective = objective.trim();
    if (!trimmedObjective || launching) return;

    setLaunching(true);
    let sessionIdForFailure: string | null = null;
    try {
      const sessionId = await ensureActiveSession(trimmedObjective);
      sessionIdForFailure = sessionId;
      const now = Date.now();
      const priorMessages = await db.agent_chat_messages
        .where('sessionId')
        .equals(sessionId)
        .and((message) => message.status !== 'pending')
        .sortBy('createdAt');

      await db.agent_chat_messages.add({
        sessionId,
        role: 'user',
        content: trimmedObjective,
        createdAt: now,
      });

      const session = await db.agent_chat_sessions.get(sessionId);
      await db.agent_chat_sessions.update(sessionId, {
        ...(session?.title === 'New chat'
          ? { title: titleFromObjective(trimmedObjective) }
          : {}),
        updatedAt: now,
      });

      const payload: CreateAgentPayload = {
        objective: trimmedObjective,
        provider,
        model,
        max_agents: maxAgents,
        human_in_loop: hitl,
        chat_history: priorMessages.slice(-16).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      };
      const agent = await createAgent(payload);
      await db.agent_chat_messages.add({
        sessionId,
        role: 'assistant',
        content: 'Swarm is running...',
        agentId: agent.id,
        status: 'pending',
        createdAt: Date.now(),
      });
      setObjective('');
      setSelectedId(agent.id);
      setActiveView('runs');
      await refresh();
    } catch (error) {
      console.error('Failed to launch swarm:', error);
      if (sessionIdForFailure) {
        await db.agent_chat_messages.add({
          sessionId: sessionIdForFailure,
          role: 'assistant',
          content:
            error instanceof Error
              ? `Launch failed: ${error.message}`
              : 'Launch failed.',
          status: 'failed',
          createdAt: Date.now(),
        });
      }
    } finally {
      setLaunching(false);
    }
  };

  const handleProviderChange = (p: ModelProvider) => {
    setProvider(p);
    setModel(MODELS[p][0]);
  };

  const selectedAgent = agents.find((a) => a.id === selectedId);
  const selectedMcpToken = mcpTokens.find((token) => token.key === mcpEnvKey);

  const handleMcpServerChange = (serverName: string) => {
    const server = mcpServers.find((item) => item.name === serverName);
    setSelectedMcpServer(serverName);
    setMcpEnvKey(server?.env[0]?.key ?? (serverName === 'figma' ? 'FIGMA_API_TOKEN' : ''));
    setMcpToken('');
    setMcpMessage(null);
  };

  const handleSelectMcpToken = (token: McpTokenStatus) => {
    const serverName = token.used_by[0] ?? '';
    setMcpEnvKey(token.key);
    setSelectedMcpServer(serverName);
    setMcpToken('');
    setMcpMessage(null);
  };

  const handleSaveMcpToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpEnvKey.trim() || !mcpToken.trim() || savingMcpToken) return;

    setSavingMcpToken(true);
    setMcpMessage(null);
    try {
      await saveMcpToken({
        server_name: selectedMcpServer || undefined,
        env_key: mcpEnvKey.trim().toUpperCase(),
        token: mcpToken.trim(),
      });
      setMcpToken('');
      toast.success(
        selectedMcpServer
          ? `${mcpEnvKey.trim().toUpperCase()} saved for ${selectedMcpServer}.`
          : `${mcpEnvKey.trim().toUpperCase()} updated in .env.`,
      );
      await refreshMcpServers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save MCP token.');
    } finally {
      setSavingMcpToken(false);
    }
  };

  useEffect(() => {
    const syncCompletedMessages = async () => {
      for (const agent of agents) {
        if (!isTerminal(agent.status)) continue;

        const message = await db.agent_chat_messages
          .where('agentId')
          .equals(agent.id)
          .and((entry) => entry.role === 'assistant')
          .first();

        if (!message || message.status !== 'pending') continue;

        await db.agent_chat_messages.update(message.id as number, {
          content: agent.result || `Swarm ${STATUS_LABELS[agent.status].toLowerCase()}.`,
          status: agent.status as AgentChatMessage['status'],
          createdAt: Date.now(),
        });
      }
    };

    syncCompletedMessages().catch(console.error);
  }, [agents]);

  const activeAgents = agents.filter((agent) => !isTerminal(agent.status)).length;
  const completedAgents = agents.filter((agent) => agent.status === 'completed').length;
  const selectedAgentModelLabel =
    selectedAgent?.model === 'nvidia/nemotron-3.5-lightning-30b-a3b'
      ? 'NVIDIA NIM / Lightning'
      : selectedAgent
      ? selectedAgent.model.startsWith(selectedAgent.provider)
        ? selectedAgent.model
        : `${selectedAgent.provider} / ${selectedAgent.model}`
      : '';

  // ── Shared styles ─────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--prism-muted)',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 'var(--prism-radius-lg)',
    border: '1px solid var(--prism-border-card)',
    background: 'var(--prism-board)',
    padding: '10px 12px',
    fontSize: '0.8125rem',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'JetBrains Mono', monospace",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        background: 'var(--prism-board)',
        color: '#fff',
      }}
    >
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--prism-board)',
            color: 'white',
            border: '1px solid var(--prism-border-card)',
            borderRadius: 'var(--prism-radius-lg)',
          },
        }}
      />

      {/* ── Header with Integrated Tab Bar ─────────────────────────────── */}
      <header
        className="relative flex flex-shrink-0 items-center justify-between px-5 py-2"
        style={{ borderBottom: '1px solid var(--prism-border-card)' }}
      >
        {/* Accent glow line */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,223,129,0.45), transparent)' }}
        />

        {/* Left: Branding & Status */}
        <div className="flex min-w-0 items-center gap-3">
        </div>

        {/* Center: Tabs Switcher */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--prism-border-card)',
            borderRadius: 'var(--prism-radius-lg)',
          }}
        >
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            const count = tab.id === 'runs' ? agents.length : tab.id === 'settings' ? mcpTokens.length : undefined;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className="relative flex h-8 min-w-[95px] items-center justify-center gap-1.5 px-3 text-xs font-semibold transition-colors"
                style={{
                  color: isActive ? '#000' : 'var(--prism-muted)',
                  borderRadius: 'var(--prism-radius-md)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="swarm-tab-pill"
                    className="absolute inset-0"
                    style={{ background: 'var(--prism-primary)', borderRadius: 'var(--prism-radius-md)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.2 text-[9px] font-bold"
                      style={{
                        background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--prism-card)',
                        color: isActive ? '#000' : 'var(--prism-primary)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => createNewChat()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
            style={{
              background: 'rgba(0,223,129,0.1)',
              border: '1px solid rgba(0,223,129,0.25)',
              color: 'var(--prism-primary)',
              borderRadius: 'var(--prism-radius-md)',
            }}
            whileHover={{ background: 'var(--prism-primary)', color: '#000' }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="size-3.5" />
            New Chat
          </motion.button>
          <motion.button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg"
            style={{
              border: '1px solid var(--prism-border-card)',
              background: 'var(--prism-card)',
              color: 'var(--prism-muted)',
            }}
            whileHover={{
              backgroundColor: 'rgba(0,223,129,0.1)',
              borderColor: 'rgba(0,223,129,0.3)',
              color: '#00df81',
            }}
            whileTap={{ scale: 0.93 }}
          >
            <X className="size-4" />
          </motion.button>
        </div>
      </header>

      {/* ── Backend offline banner ──────────────────────────────────────── */}
      {backendOnline === false && (
        <div
          className="flex flex-shrink-0 items-start gap-3 px-5 py-2.5 text-sm"
          style={{
            borderBottom: '1px solid rgba(248,113,113,0.25)',
            background: 'rgba(248,113,113,0.06)',
          }}
        >
          <Activity className="mt-0.5 size-4 flex-shrink-0" style={{ color: '#f87171' }} />
          <div>
            <p style={{ fontWeight: 600, color: '#fca5a5', fontSize: '13px' }}>Agent Swarm backend is offline</p>
            <p className="mt-0.5" style={{ fontSize: '0.72rem', color: 'rgba(252,165,165,0.7)' }}>
              Start with{' '}
              <code className="terminal-pill" style={{ display: 'inline', padding: '1px 6px', fontSize: '0.68rem' }}>
                <span className="terminal-prompt-char">$</span> .\backend\start.ps1
              </code>
            </p>
          </div>
        </div>
      )}

      {/* ── View Content ───────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ═══════ LAUNCH VIEW (2-COLUMN ZERO-SCROLL) ═══════ */}
          {activeView === 'launch' && (
            <motion.div key="launch" {...viewTransition} className="h-full min-h-0 overflow-y-auto lg:overflow-hidden p-4">
              <form onSubmit={handleLaunch} className="grid h-full grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                {/* Left: Mission Brief & Action (lg:col-span-7) */}
                <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0 h-full">
                  <div
                    className="flex-1 flex flex-col min-h-0 rounded-xl p-3"
                    style={{
                      border: '1px solid var(--prism-border-card)',
                      background: 'var(--prism-card)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--prism-primary)' }}>
                          Mission Brief
                        </span>
                        <span className="text-[11px] text-white/40">· Swarm Objective</span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold"
                        style={{
                          border: '1px solid rgba(0,223,129,0.25)',
                          background: 'rgba(0,223,129,0.08)',
                          color: 'var(--prism-primary)',
                        }}
                      >
                        {maxAgents} worker{maxAgents > 1 ? 's' : ''} assigned
                      </span>
                    </div>

                    {/* Quick Template Chips */}
                    <div className="mb-1.5 flex flex-wrap gap-1.5 flex-shrink-0">
                      {[
                        { label: 'Research & Map', text: 'Research latest advancements and synthesize an architectural breakdown.' },
                        { label: 'Code Review & Audit', text: 'Audit recent commits, check for edge-case regressions, and formulate fixes.' },
                        { label: 'Feature Spec', text: 'Draft a fullstack implementation spec with API models, components, and tests.' },
                      ].map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setObjective(tpl.text)}
                          className="rounded-md px-2 py-0.5 text-[11px] font-mono transition-all hover:border-[rgba(0,223,129,0.4)] hover:text-white"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--prism-border-card)',
                            color: 'var(--prism-muted)',
                          }}
                        >
                          + {tpl.label}
                        </button>
                      ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                      id="swarm-objective"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Describe the outcome you want the swarm to produce... (e.g. build a data visualization pipeline, audit security, or synthesize documentation)"
                      className="flex-1 min-h-[110px] w-full resize-none p-3 leading-relaxed rounded-xl text-sm"
                      style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'var(--prism-board)',
                        color: '#fff',
                        outline: 'none',
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    />
                  </div>

                  {/* Launch CTA Button */}
                  <motion.button
                    type="submit"
                    disabled={!objective.trim() || launching || !backendOnline}
                    className="flex-shrink-0 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-wide transition-all disabled:cursor-not-allowed"
                    style={{
                      background: !objective.trim() || launching || !backendOnline
                        ? 'var(--prism-card)'
                        : 'var(--prism-primary)',
                      color: !objective.trim() || launching || !backendOnline
                        ? 'var(--prism-muted)'
                        : '#000',
                      borderRadius: 'var(--prism-radius-xl)',
                      boxShadow: objective.trim() && !launching && backendOnline
                        ? '0 0 24px rgba(0,223,129,0.35)'
                        : 'none',
                    }}
                    whileHover={objective.trim() && !launching && backendOnline ? { scale: 1.008 } : {}}
                    whileTap={objective.trim() && !launching && backendOnline ? { scale: 0.985 } : {}}
                  >
                    {launching ? (
                      <>
                        <GridLoader color="#000" pattern="plus-hollow" size="sm" gap={3} rounded speed="fast" />
                        <span>Deploying Swarm Nodes...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Launch Swarm Orchestration</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Right: Controls (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col gap-2 min-h-0 h-full justify-between">
                  {/* Model Routing */}
                  <div className="rounded-xl p-3" style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span style={labelStyle} className="!mb-0">Model Routing</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,223,129,0.08)', color: 'var(--prism-primary)' }}>
                        Low Latency
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono block mb-1 text-white/40">Provider</label>
                        <StyledSelect
                          value={provider}
                          onChange={(val) => handleProviderChange(val as ModelProvider)}
                          options={[
                            { value: 'nvidia', label: 'NVIDIA NIM' },
                            { value: 'groq', label: 'Groq' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono block mb-1 text-white/40">Model</label>
                        <StyledSelect
                          value={model}
                          onChange={setModel}
                          options={MODELS[provider].map((m) => ({
                            value: m,
                            label: m === 'nvidia/nemotron-3.5-lightning-30b-a3b' ? 'Nemotron 3.5' : m.length > 15 ? `${m.slice(0, 13)}…` : m,
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Worker Mesh & Checkpoint */}
                  <div className="rounded-xl p-3" style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">Worker Mesh Size</p>
                        <p className="text-[10.5px]" style={{ color: 'var(--prism-muted)' }}>Concurrent sub-agent nodes</p>
                      </div>
                      <span className="text-sm font-bold font-mono px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,223,129,0.1)', color: 'var(--prism-primary)' }}>
                        {maxAgents} Nodes
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={1}
                      value={maxAgents}
                      onChange={(e) => setMaxAgents(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.12)', accentColor: '#00df81' }}
                    />
                    <label
                      className="mt-2.5 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors"
                      style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-board)' }}
                    >
                      <div>
                        <span className="block text-xs font-semibold text-white">Human Checkpoint</span>
                        <span className="text-[10.5px]" style={{ color: 'var(--prism-muted)' }}>Require approval before synthesis</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hitl}
                        onChange={(e) => setHitl(e.target.checked)}
                        className="size-4"
                        style={{ accentColor: '#00df81' }}
                      />
                    </label>
                  </div>

                  {/* Tool Integrations: Gmail MCP */}
                  <div className="rounded-xl p-3" style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span style={labelStyle} className="!mb-0">Tool Integrations</span>
                      <span className="text-[10px] font-mono text-white/40">OAuth 2.0</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg" style={{ background: 'var(--prism-board)', border: '1px solid var(--prism-border-card)' }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">Google Workspace / Gmail</p>
                        <p className="text-[11px] truncate" style={{ color: gmailEmail ? 'var(--prism-primary)' : 'var(--prism-muted)' }}>
                          {gmailEmail ? `Connected: ${gmailEmail}` : 'Inbox access for research & mail tools'}
                        </p>
                      </div>
                      {gmailEmail ? (
                        <button
                          type="button"
                          onClick={() => {
                            const uid = getGmailUserId();
                            if (uid) {
                              fetch('/api/auth/google/status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ user_id: uid }),
                              }).catch(() => {});
                            }
                            localStorage.removeItem('prism_gmail_user_id');
                            localStorage.removeItem('prism_gmail_email');
                            setGmailEmail(null);
                          }}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-mono text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={gmailLoading}
                          onClick={async () => {
                            setGmailLoading(true);
                            try {
                              await connectGmail();
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setGmailLoading(false);
                            }
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                          style={{ background: 'var(--prism-primary)', color: '#000' }}
                        >
                          {gmailLoading ? '...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Architecture spec footer */}
                  <div className="p-2.5 rounded-xl flex items-center justify-between text-xs" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--prism-border-card)' }}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: backendOnline ? '#00df81' : '#f87171' }} />
                      <span className="font-mono text-white/60 text-[11px]">
                        {backendOnline ? 'Distributed Graph Engine Active' : 'Backend Engine Offline'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-white/40">
                      DAG v2.0
                    </span>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* ═══════ RUNS VIEW ═══════ */}
          {activeView === 'runs' && (
            <motion.div key="runs" {...viewTransition} className="flex h-full min-h-0">
              {/* Left: Agent list / Chat switcher */}
              <div
                className="flex w-[360px] xl:w-[400px] flex-shrink-0 flex-col min-h-0"
                style={{ borderRight: '1px solid var(--prism-border-card)' }}
              >
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-1.5 p-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--prism-border-card)' }}>
                  <div className="layer-row !p-1.5 text-center">
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--prism-muted)' }}>Runs</p>
                    <p className="text-base font-semibold text-white">{agents.length}</p>
                  </div>
                  <div className="layer-row !p-1.5 text-center" style={{ borderColor: 'rgba(0,223,129,0.2)', background: 'rgba(0,223,129,0.04)' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--prism-primary)' }}>Active</p>
                    <p className="text-base font-semibold" style={{ color: 'var(--prism-primary)' }}>{activeAgents}</p>
                  </div>
                  <div className="layer-row !p-1.5 text-center">
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--prism-muted)' }}>Done</p>
                    <p className="text-base font-semibold text-white">{completedAgents}</p>
                  </div>
                </div>

                {/* Left Pane Sub-Tabs: Swarms vs Chat History */}
                <div className="flex p-1.5 border-b flex-shrink-0 gap-1" style={{ borderColor: 'var(--prism-border-card)', background: 'rgba(0,0,0,0.2)' }}>
                  <button
                    type="button"
                    onClick={() => setRunsSubTab('agents')}
                    className="flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: runsSubTab === 'agents' ? 'var(--prism-card)' : 'transparent',
                      color: runsSubTab === 'agents' ? '#fff' : 'var(--prism-muted)',
                      border: runsSubTab === 'agents' ? '1px solid var(--prism-border-card)' : '1px solid transparent',
                    }}
                  >
                    <Radio className="size-3" style={{ color: runsSubTab === 'agents' ? 'var(--prism-primary)' : 'inherit' }} />
                    Swarms ({agents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunsSubTab('chat')}
                    className="flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: runsSubTab === 'chat' ? 'var(--prism-card)' : 'transparent',
                      color: runsSubTab === 'chat' ? '#fff' : 'var(--prism-muted)',
                      border: runsSubTab === 'chat' ? '1px solid var(--prism-border-card)' : '1px solid transparent',
                    }}
                  >
                    <MessageSquare className="size-3" style={{ color: runsSubTab === 'chat' ? 'var(--prism-primary)' : 'inherit' }} />
                    Chat ({currentSessionMessages?.length || 0})
                  </button>
                </div>

                {/* SubTab Content */}
                {runsSubTab === 'agents' ? (
                  /* Agent cards take 100% of left pane */
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                    {agents.length === 0 && (
                      <div
                        className="rounded-xl p-5 text-sm text-center"
                        style={{
                          border: '1px dashed var(--prism-border-card)',
                          background: 'var(--prism-card)',
                          color: 'var(--prism-muted)',
                        }}
                      >
                        No swarms yet. Launch a mission to start.
                      </div>
                    )}
                    {agents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedId === agent.id}
                        onSelect={() => setSelectedId(agent.id)}
                        onRefresh={refresh}
                      />
                    ))}
                  </div>
                ) : (
                  /* Chat history takes 100% of left pane */
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="px-3 py-2 text-xs font-semibold text-white flex items-center justify-between border-b" style={{ borderColor: 'var(--prism-border-card)' }}>
                      <span className="truncate">{currentSession?.title ?? 'New chat'}</span>
                      <span className="text-[10px] font-mono text-white/40">{currentSessionMessages?.length ?? 0} msgs</span>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                      {!currentSessionMessages?.length && (
                        <div className="rounded-lg p-3 text-xs" style={{ border: '1px dashed var(--prism-border-card)', background: 'var(--prism-card)', color: 'var(--prism-muted)' }}>
                          Launch a swarm to start this conversation.
                        </div>
                      )}
                      {currentSessionMessages?.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-lg px-3 py-2 text-xs"
                          style={{
                            border: `1px solid ${message.role === 'user' ? 'rgba(0,223,129,0.18)' : 'var(--prism-border-card)'}`,
                            background: message.role === 'user' ? 'rgba(0,223,129,0.04)' : 'var(--prism-card)',
                          }}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-semibold" style={{ color: message.role === 'user' ? 'var(--prism-primary)' : '#fff' }}>
                              {message.role === 'user' ? 'You' : 'Swarm'}
                            </span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--prism-muted)' }}>
                              {message.status === 'pending' ? 'running' : formatChatTime(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Inspector */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {!selectedAgent ? (
                  <div className="grid min-h-0 flex-1 place-items-center p-8">
                    <div className="max-w-sm text-center">
                      <div
                        className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl"
                        style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}
                      >
                        <ListTree className="size-7" style={{ color: 'var(--prism-muted)' }} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Select a run to inspect it</h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--prism-muted)' }}>
                        The inspector shows the pipeline graph, live execution stream, approval controls, and final output.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Inspector header */}
                    <div
                      className="flex flex-shrink-0 items-start justify-between gap-4 px-5 py-4"
                      style={{ borderBottom: '1px solid var(--prism-border-card)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              background: `${STATUS_COLORS[selectedAgent.status]}22`,
                              color: STATUS_COLORS[selectedAgent.status],
                            }}
                          >
                            {STATUS_LABELS[selectedAgent.status]}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px]"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              border: '1px solid var(--prism-border-card)',
                              background: 'var(--prism-card)',
                              color: 'var(--prism-muted)',
                            }}
                          >
                            {selectedAgent.max_agents} worker{selectedAgent.max_agents > 1 ? 's' : ''}
                          </span>
                          {selectedAgent.human_in_loop && (
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px]"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                background: 'rgba(251,191,36,0.1)',
                                color: '#fbbf24',
                              }}
                            >
                              approval checkpoint
                            </span>
                          )}
                        </div>
                        <h3 className="truncate text-base font-semibold text-white" title={selectedAgent.objective}>
                          {selectedAgent.objective}
                        </h3>
                        <p className="mt-1 truncate text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--prism-muted)' }}>
                          {selectedAgentModelLabel}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 flex-col items-end gap-3">
                        {selectedAgent.status === 'awaiting_approval' && (
                          <div className="flex gap-2">
                            <motion.button
                              type="button"
                              onClick={() => approveAgent(selectedAgent.id, false).then(refresh)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
                              style={{ border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.08)', color: '#fca5a5' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="size-3.5" />
                              Reject
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => approveAgent(selectedAgent.id, true).then(refresh)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
                              style={{ background: 'var(--prism-primary)', color: '#000' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check className="size-3.5" />
                              Approve
                            </motion.button>
                          </div>
                        )}
                        {/* Inspector sub-tabs */}
                        <div
                          className="flex rounded-xl p-1"
                          style={{ border: '1px solid var(--prism-border-card)', background: 'rgba(0,0,0,0.3)' }}
                        >
                          {([
                            { id: 'dag' as InspectorTab, label: 'Pipeline', icon: GitBranch },
                            { id: 'logs' as InspectorTab, label: 'Logs', icon: TerminalSquare },
                            { id: 'output' as InspectorTab, label: 'Output', icon: Sparkles, dot: !!selectedAgent.result },
                          ]).map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setInspectorTab(tab.id)}
                                className="relative inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
                                style={{
                                  background: inspectorTab === tab.id ? '#fff' : 'transparent',
                                  color: inspectorTab === tab.id ? 'var(--prism-board)' : 'var(--prism-muted)',
                                }}
                              >
                                <TabIcon className="size-3.5" />
                                {tab.label}
                                {tab.dot && (
                                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full" style={{ background: 'var(--prism-primary)' }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Inspector content */}
                    <div className="min-h-0 flex-1 overflow-hidden">
                      <AnimatePresence mode="wait">
                        {inspectorTab === 'dag' && (
                          <motion.div key="dag" {...viewTransition} className="grid h-full min-h-0 grid-rows-[minmax(240px,42%)_1fr]">
                            <div className="p-4" style={{ borderBottom: '1px solid var(--prism-border-card)' }}>
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                  <GitBranch className="size-4" style={{ color: 'var(--prism-primary)' }} />
                                  Execution Map
                                </div>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--prism-muted)' }}>
                                  {selectedAgent.id.slice(0, 8)}
                                </span>
                              </div>
                              <SwarmDagGraph agent={selectedAgent} logLines={logLines} />
                            </div>
                            <div className="min-h-0 overflow-y-auto p-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                              <div className="mb-3 flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--prism-border-card)' }}>
                                <span style={{ color: 'var(--prism-muted)' }}>Live log tail</span>
                                <span style={{ color: 'var(--prism-primary)' }}>{selectedAgent.status}</span>
                              </div>
                              {logLines.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for log output...</p>}
                              {logLines.map((line, i) => {
                                const isError = line.includes('❌') || line.includes('⚠️') || line.includes('failed');
                                const isSuccess = line.includes('✅') || line.includes('🎉') || line.includes('completed');
                                const isWarning = line.includes('⏸️') || line.includes('checkpoint');
                                return (
                                  <div
                                    key={i}
                                    className="py-1 leading-relaxed"
                                    style={{
                                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                                      color: isError ? '#f87171' : isSuccess ? '#00df81' : isWarning ? '#fbbf24' : 'rgba(255,255,255,0.72)',
                                    }}
                                  >
                                    {line}
                                  </div>
                                );
                              })}
                              {!isTerminal(selectedAgent.status) && (
                                <div className="mt-4 flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--prism-border-card)' }}>
                                  <GridLoader color="#00df81" pattern="plus-hollow" size="sm" gap={3} rounded speed="fast" />
                                  <span style={{ color: 'rgba(0,223,129,0.8)' }}>Running tasks...</span>
                                </div>
                              )}
                              <div ref={logsEndRef} />
                            </div>
                          </motion.div>
                        )}

                        {inspectorTab === 'logs' && (
                          <motion.div key="logs" {...viewTransition} className="h-full overflow-y-auto p-5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--prism-border-card)', background: 'var(--prism-board)' }}>
                              <span style={{ color: 'var(--prism-muted)' }}>Execution stream / {selectedAgent.id}</span>
                              <span style={{ color: 'var(--prism-primary)' }}>{selectedAgent.status}</span>
                            </div>
                            {logLines.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for log output...</p>}
                            {logLines.map((line, i) => {
                              const isError = line.includes('❌') || line.includes('⚠️') || line.includes('failed');
                              const isSuccess = line.includes('✅') || line.includes('🎉') || line.includes('completed');
                              const isWarning = line.includes('⏸️') || line.includes('checkpoint');
                              return (
                                <div
                                  key={i}
                                  className="py-1.5 leading-relaxed"
                                  style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    color: isError ? '#f87171' : isSuccess ? '#00df81' : isWarning ? '#fbbf24' : 'rgba(255,255,255,0.82)',
                                  }}
                                >
                                  {line}
                                </div>
                              );
                            })}
                            {!isTerminal(selectedAgent.status) && (
                              <div className="mt-5 flex items-center gap-3 pt-5" style={{ borderTop: '1px solid var(--prism-border-card)' }}>
                                <GridLoader color="#00df81" pattern="plus-hollow" size="sm" gap={3} rounded speed="fast" />
                                <span style={{ color: 'rgba(0,223,129,0.8)' }}>Live streaming execution logs...</span>
                              </div>
                            )}
                            <div ref={logsEndRef} />
                          </motion.div>
                        )}

                        {inspectorTab === 'output' && (
                          <motion.div key="output" {...viewTransition} className="h-full overflow-y-auto p-6">
                            <div className="mx-auto max-w-3xl">
                              <div className="mb-5 flex items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--prism-border-card)' }}>
                                <div className="flex items-center gap-2">
                                  <Sparkles className="size-4" style={{ color: 'var(--prism-primary)' }} />
                                  <h3 className="text-base font-semibold text-white">Final Output</h3>
                                </div>
                                {selectedAgent.result && (
                                  <motion.button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedAgent.result ?? '');
                                      toast.success('Output copied to clipboard');
                                    }}
                                    className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
                                    style={{
                                      border: '1px solid var(--prism-border-card)',
                                      background: 'var(--prism-card)',
                                      color: 'var(--prism-muted)',
                                    }}
                                    whileHover={{ borderColor: 'rgba(0,223,129,0.3)', color: '#fff' }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Clipboard className="size-3.5" />
                                    Copy
                                  </motion.button>
                                )}
                              </div>
                              {selectedAgent.result ? (
                                <article
                                  className="rounded-xl p-6 text-sm leading-relaxed"
                                  style={{
                                    border: '1px solid var(--prism-border-card)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'rgba(255,255,255,0.86)',
                                  }}
                                >
                                  <MarkdownRenderer content={selectedAgent.result ?? ''} />
                                </article>
                              ) : (
                                <div
                                  className="rounded-xl p-12 text-center"
                                  style={{
                                    border: '1px dashed var(--prism-border-card)',
                                    background: 'var(--prism-card)',
                                  }}
                                >
                                  <Sparkles className="mx-auto mb-4 size-8" style={{ color: 'var(--prism-muted)' }} />
                                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    Output is being generated
                                  </p>
                                  <p className="mt-1 text-xs" style={{ color: 'var(--prism-muted)' }}>
                                    The sub-agents are still processing this objective.
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ SETTINGS VIEW (2-COLUMN ZERO-SCROLL) ═══════ */}
          {activeView === 'settings' && (
            <motion.div key="settings" {...viewTransition} className="h-full min-h-0 overflow-y-auto lg:overflow-hidden p-4">
              <div className="mx-auto grid h-full grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 max-w-none">
                {/* Left Column: Active Tokens & Chat Sessions (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0 h-full">
                  <div
                    className="flex-1 flex flex-col min-h-0 rounded-xl p-3"
                    style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-3 flex-shrink-0">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Active MCP Tokens</h3>
                        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--prism-muted)' }}>
                          Configured in {mcpEnvFile ?? 'tools .env'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {mcpTokens.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingRemoveKey('__CLEAR_ALL__');
                              setShowRemoveConfirm(true);
                            }}
                            className="inline-flex h-7 items-center rounded-lg px-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                        <motion.button
                          type="button"
                          onClick={refreshMcpServers}
                          className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px]"
                          style={{
                            border: '1px solid var(--prism-border-card)',
                            background: 'var(--prism-board)',
                            color: 'var(--prism-muted)',
                          }}
                          whileHover={{ borderColor: 'rgba(0,223,129,0.3)', color: '#fff' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <RefreshCw className="size-3" />
                          Refresh
                        </motion.button>
                      </div>
                    </div>

                    {/* Token List */}
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {mcpTokens.length === 0 && (
                        <div
                          className="rounded-xl p-4 text-xs text-center"
                          style={{
                            border: '1px dashed var(--prism-border-card)',
                            background: 'var(--prism-board)',
                            color: 'var(--prism-muted)',
                          }}
                        >
                          No tool tokens found. Configure a token using the panel on the right.
                        </div>
                      )}
                      {mcpTokens.map((token) => {
                        const active = token.key === mcpEnvKey;
                        return (
                          <div
                            key={token.key}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectMcpToken(token)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectMcpToken(token);
                              }
                            }}
                            className={`layer-row cursor-pointer ${active ? 'highlighted' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="min-w-0 flex-1 truncate text-xs font-semibold"
                                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.9)' }}
                              >
                                {token.key}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px]"
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    background: token.configured ? 'rgba(0,223,129,0.1)' : 'rgba(251,191,36,0.1)',
                                    color: token.configured ? 'var(--prism-primary)' : '#fbbf24',
                                  }}
                                >
                                  {token.configured ? 'configured' : 'missing'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingRemoveKey(token.key);
                                    setShowRemoveConfirm(true);
                                  }}
                                  className="text-white/30 hover:text-red-400 p-1 text-xs"
                                  title="Delete token"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chat sessions card */}
                  {chatSessions && chatSessions.length > 0 && (
                    <div
                      className="rounded-xl p-3 flex flex-col max-h-[190px]"
                      style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}
                    >
                      <h4 className="text-xs font-semibold text-white mb-2 flex-shrink-0">Chat Sessions ({chatSessions.length})</h4>
                      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                        {chatSessions.map((session) => (
                          <div
                            key={session.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setActiveSessionId(session.id);
                              localStorage.setItem(ACTIVE_SWARM_CHAT_KEY, session.id);
                              setActiveView('runs');
                            }}
                            className={`layer-row !p-1.5 cursor-pointer ${activeSessionId === session.id ? 'highlighted' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                {session.title}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChatSession(session.id);
                                }}
                                className="text-white/30 hover:text-red-400 p-1"
                                aria-label="Delete chat"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Configure Token Form (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-xl p-3 min-h-0 h-full" style={{ border: '1px solid var(--prism-border-card)', background: 'var(--prism-card)' }}>
                  <div>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-white">Configure MCP Token</h4>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--prism-muted)' }}>
                        Save API credentials directly into local tools environment.
                      </p>
                    </div>

                    <form onSubmit={handleSaveMcpToken} className="space-y-2.5">
                      <div>
                        <label style={labelStyle}>Target Server</label>
                        <StyledSelect
                          value={selectedMcpServer}
                          onChange={handleMcpServerChange}
                          options={
                            mcpServers.length
                              ? mcpServers.map((s) => ({ value: s.name, label: s.name }))
                              : [{ value: 'figma', label: 'figma' }]
                          }
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Environment Variable Key</label>
                        <input
                          type="text"
                          value={mcpEnvKey}
                          onChange={(e) => setMcpEnvKey(e.target.value.toUpperCase())}
                          placeholder="e.g. FIGMA_API_TOKEN"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Secret API Token</label>
                        <input
                          type="password"
                          value={mcpToken}
                          onChange={(e) => setMcpToken(e.target.value)}
                          placeholder="Paste API token value..."
                          style={inputStyle}
                        />
                      </div>
                      {mcpMessage && (
                        <p
                          className="rounded-lg p-2 text-xs"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            border: '1px solid rgba(0,223,129,0.2)',
                            background: 'rgba(0,223,129,0.06)',
                            color: 'var(--prism-primary)',
                          }}
                        >
                          {mcpMessage}
                        </p>
                      )}
                      <motion.button
                        type="submit"
                        disabled={savingMcpToken || !mcpEnvKey.trim() || !mcpToken.trim()}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed mt-2"
                        style={{
                          background: savingMcpToken || !mcpEnvKey.trim() || !mcpToken.trim()
                            ? 'var(--prism-board)'
                            : 'var(--prism-primary)',
                          color: savingMcpToken || !mcpEnvKey.trim() || !mcpToken.trim()
                            ? 'var(--prism-muted)'
                            : '#000',
                          boxShadow: !savingMcpToken && mcpEnvKey.trim() && mcpToken.trim() ? '0 0 20px rgba(0,223,129,0.25)' : 'none',
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <KeyRound className="size-4" />
                        {savingMcpToken ? 'Saving Token...' : 'Save MCP Token'}
                      </motion.button>
                    </form>
                  </div>

                  <div className="p-3 rounded-lg border text-xs" style={{ background: 'var(--prism-board)', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="font-semibold text-white/80 mb-1">Security note</p>
                    <p className="text-[11px] leading-relaxed text-white/40">
                      Tokens are persisted to your local <code>.env</code> file only and never leave your local workspace.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Remove Confirm Dialog ──────────────────────────────────────── */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div
            className="w-full max-w-sm rounded-xl p-4"
            style={{
              border: '1px solid var(--prism-border-card)',
              background: 'var(--prism-board)',
            }}
          >
            <h3 className="text-sm font-semibold text-white">Confirm removal</h3>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--prism-muted)' }}>
              {pendingRemoveKey === '__CLEAR_ALL__'
                ? 'This will remove all saved MCP tokens from the tools .env. This action cannot be undone.'
                : `Remove token ${pendingRemoveKey}? This will delete it from ${mcpEnvFile ?? 'tools .env'}.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setPendingRemoveKey(null);
                }}
                className="h-9 rounded-lg px-3 text-xs font-semibold transition-colors"
                style={{
                  border: '1px solid var(--prism-border-card)',
                  background: 'var(--prism-card)',
                  color: 'var(--prism-muted)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!pendingRemoveKey) return;
                  setShowRemoveConfirm(false);
                  const key = pendingRemoveKey;
                  setPendingRemoveKey(null);
                  try {
                    if (key === '__CLEAR_ALL__') {
                      for (const t of mcpTokens) {
                        try {
                          await removeMcpToken({ env_key: t.key });
                        } catch {
                          // Continue removing the rest of the configured tokens.
                        }
                      }
                      toast.success('All tokens removed');
                    } else {
                      await removeMcpToken({ env_key: key });
                      toast.success(`${key} removed`);
                    }
                    await refreshMcpServers();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Remove failed');
                  }
                }}
                className="h-9 rounded-lg px-3 text-xs font-semibold transition-colors"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
