"use client";

/**
 * @author: @kokonutui (adapted for PrismSpace Autonomous Developer OS)
 * @description: AI Prompt Input & Toolbar with PrismSpace High-Voltage Design System
 * @version: 2.0.0
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Paperclip,
  Send,
  Sparkles,
  X,
  Cpu,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";

// ── Model Provider Icons ───────────────────────────────────────────────────
export const NVIDIA_ICON = (
  <svg className="size-3.5 flex-none" viewBox="0 0 24 24" fill="#76B900">
    <path d="M8.948 7.391c0-.12.046-.22.138-.302.779-.702 1.83-1.077 2.96-1.057 1.874.037 3.535 1.058 4.334 2.664.256.516.388 1.087.388 1.678 0 1.258-.6 2.456-1.637 3.238-.344.26-.74.457-1.168.58-.22.062-.37.26-.37.49v.033c0 .28.228.508.508.508h.04c.73-.016 1.442-.236 2.066-.642 1.488-.971 2.378-2.615 2.378-4.394 0-.853-.2-1.685-.58-2.438-1.127-2.228-3.414-3.64-5.918-3.69-1.57-.03-3.03.49-4.135 1.47-.13.116-.2.285-.19.458.01.173.1.33.24.422l.628.414a.434.434 0 0 0 .323.069zm-2.022 1.94c.02-.15-.04-.3-.15-.41l-.57-.46a.44.44 0 0 0-.47-.06c-1.39.73-2.48 1.92-3.08 3.36-.6 1.45-.63 3.06-.08 4.54.55 1.47 1.61 2.68 2.99 3.42 1.38.74 2.99.93 4.51.53 1.53-.4 2.87-1.33 3.79-2.6.91-1.28 1.32-2.84 1.15-4.42a.43.43 0 0 0-.34-.38l-.72-.15a.44.44 0 0 0-.47.24c-.58 1.12-1.54 1.94-2.7 2.3-1.16.36-2.41.22-3.47-.39-1.07-.6-1.85-1.59-2.21-2.77-.36-1.18-.25-2.46.3-3.54.38-.75.98-1.38 1.7-1.83.15-.09.24-.25.26-.43z" />
  </svg>
);

export const GROQ_ICON = (
  <svg className="size-3.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="#F55036" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const GEMINI_ICON = (
  <svg className="size-3.5 flex-none" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="lobe-icons-gemini-fill" x1="0%" y1="100%" x2="68.73%" y2="30.395%">
        <stop offset="0%" stopColor="#1C7DFF" />
        <stop offset="52.021%" stopColor="#1C69FF" />
        <stop offset="100%" stopColor="#F0DCD6" />
      </linearGradient>
    </defs>
    <path
      d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12"
      fill="url(#lobe-icons-gemini-fill)"
      fillRule="nonzero"
    />
  </svg>
);

export const ANTHROPIC_ICON = (
  <svg className="size-3.5 flex-none" viewBox="0 0 24 24" fill="#D97706" fillRule="evenodd">
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

export const OPENAI_ICON = (
  <svg className="size-3.5 flex-none" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.62-2.82 5.98 5.98 0 0 0-4.46-2 6.06 6.06 0 0 0-5.78 4.21 6.02 6.02 0 0 0-4.04 2.92 6.06 6.06 0 0 0 .76 7.15 6 6 0 0 0 .52 4.9 6.05 6.05 0 0 0 6.62 2.82 5.99 5.99 0 0 0 4.46 2 6.06 6.06 0 0 0 5.78-4.21 6.01 6.01 0 0 0 4.04-2.92 6.06 6.06 0 0 0-.76-7.14zm-9.08 12.7a4.5 4.5 0 0 1-2.9-1.05l.14-.08 4.82-2.78a.8.8 0 0 0 .4-.69v-6.8l2.04 1.18a.08.08 0 0 1 .04.05v5.63a4.54 4.54 0 0 1-4.54 4.54zm-9.75-4.17a4.5 4.5 0 0 1-.54-3.04l.14.09 4.83 2.78a.8.8 0 0 0 .79 0l5.89-3.4v2.35a.08.08 0 0 1-.03.06l-4.88 2.82a4.53 4.53 0 0 1-6.2-1.66zm-1.63-8.8a4.52 4.52 0 0 1 2.39-2l-.01.16v5.57a.8.8 0 0 0 .39.68l5.86 3.39-2.04 1.18a.08.08 0 0 1-.07 0l-4.88-2.82a4.54 4.54 0 0 1-1.64-6.16zm16.74 3.89l-5.88-3.42 2.04-1.18a.08.08 0 0 1 .07 0l4.88 2.82a4.54 4.54 0 0 1-.68 8.18v-5.72a.8.8 0 0 0-.43-.68zm2.03-3.05l-.14-.08-4.82-2.8a.8.8 0 0 0-.79 0l-5.89 3.4V7.41a.08.08 0 0 1 .03-.06l4.88-2.82a4.54 4.54 0 0 1 6.73 4.7zm-9.58 2.45l-2.63-1.52 2.63-1.52 2.63 1.52v3.04l-2.63 1.52-2.63-1.52z" />
  </svg>
);

export interface AIPromptModel {
  id: string;
  name: string;
  provider?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface AIPromptTemplate {
  label: string;
  text: string;
  icon?: React.ReactNode;
}

export interface AIPromptProps {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  onSubmit?: (val: string, model: string, provider?: string) => void;
  models?: (string | AIPromptModel)[];
  defaultModel?: string;
  selectedModel?: string;
  onModelChange?: (modelId: string, provider?: string) => void;
  placeholder?: string;
  headerText?: string;
  headerSubtitle?: string;
  headerAction?: React.ReactNode;
  templates?: AIPromptTemplate[];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  submitLabel?: string;
  submitLoadingLabel?: string;
  showAttachment?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

const DEFAULT_MODELS: AIPromptModel[] = [
  { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 30B", provider: "nvidia", badge: "NVIDIA NIM" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", badge: "Groq Cloud" },
  { id: "llama3-70b-8192", name: "Llama 3 70B (8k)", provider: "groq", badge: "Groq Cloud" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (32k)", provider: "groq", badge: "Groq Cloud" },
];

export function getModelIcon(modelId: string, provider?: string): React.ReactNode {
  const p = (provider || "").toLowerCase();
  const id = modelId.toLowerCase();
  if (p === "nvidia" || id.includes("nvidia") || id.includes("nemotron")) return NVIDIA_ICON;
  if (p === "groq" || id.includes("llama") || id.includes("mixtral")) return GROQ_ICON;
  if (p === "openai" || id.includes("gpt")) return OPENAI_ICON;
  if (p === "anthropic" || id.includes("claude")) return ANTHROPIC_ICON;
  if (p === "google" || id.includes("gemini")) return GEMINI_ICON;
  return <Bot className="size-3.5 text-[#00df81]" />;
}

export function AIPrompt({
  value: controlledValue,
  defaultValue = "",
  onChange,
  onSubmit,
  models = DEFAULT_MODELS,
  defaultModel,
  selectedModel: controlledModel,
  onModelChange,
  placeholder = "Describe the objective or task you want the swarm to execute...",
  headerText,
  headerSubtitle,
  headerAction,
  templates = [],
  loading = false,
  disabled = false,
  compact = false,
  submitLabel = "Launch Swarm Orchestration",
  submitLoadingLabel = "Deploying Swarm Nodes...",
  showAttachment = true,
  minHeight = 84,
  maxHeight = 320,
  className,
}: AIPromptProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const normalizedModels: AIPromptModel[] = models.map((m) =>
    typeof m === "string" ? { id: m, name: m } : m
  );

  const initialModelId =
    controlledModel ||
    defaultModel ||
    (normalizedModels.length > 0 ? normalizedModels[0].id : "default");

  const [internalModel, setInternalModel] = useState(initialModelId);
  const selectedModelId = controlledModel || internalModel;

  const activeModelObj =
    normalizedModels.find((m) => m.id === selectedModelId) ||
    normalizedModels[0] || { id: selectedModelId, name: selectedModelId };

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: compact ? 42 : minHeight,
    maxHeight,
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (!isControlled) {
      setInternalValue(newVal);
    }
    onChange?.(newVal);
    adjustHeight();
  };

  const handleSelectModel = (model: AIPromptModel) => {
    if (!controlledModel) {
      setInternalModel(model.id);
    }
    onModelChange?.(model.id, model.provider);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSubmit?.(value.trim(), selectedModelId, activeModelObj.provider);
    if (!isControlled) {
      setInternalValue("");
      adjustHeight(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-all duration-200",
        compact
          ? "rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#090c12]/95 shadow-[0_4px_20px_rgba(0,0,0,0.4)] focus-within:border-[rgba(0,223,129,0.35)] focus-within:shadow-[0_0_20px_rgba(0,223,129,0.12)]"
          : "rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#090c12]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:border-[rgba(0,223,129,0.4)] focus-within:shadow-[0_0_25px_rgba(0,223,129,0.14)]",
        className
      )}
    >
      {/* ── Optional Header with Telemetry & Chips (Standard Mode) ── */}
      {!compact && (headerText || templates.length > 0 || headerAction) && (
        <div className="flex flex-col gap-2 p-3 pb-2 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          {(headerText || headerAction) && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00df81] opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#00df81]" />
                </span>
                {headerText && (
                  <span
                    className="text-xs font-bold tracking-wider uppercase"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--prism-primary, #00df81)",
                    }}
                  >
                    {headerText}
                  </span>
                )}
                {headerSubtitle && (
                  <span className="text-[11px] font-mono text-white/40">
                    · {headerSubtitle}
                  </span>
                )}
              </div>
              {headerAction && <div>{headerAction}</div>}
            </div>
          )}

          {/* Quick Objective Chips */}
          {templates.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    const nextVal = value ? `${value}\n${tpl.text}` : tpl.text;
                    if (!isControlled) setInternalValue(nextVal);
                    onChange?.(nextVal);
                    setTimeout(() => adjustHeight(), 10);
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono transition-all border border-[rgba(255,255,255,0.08)] bg-white/[0.03] text-white/60 hover:border-[rgba(0,223,129,0.4)] hover:bg-[rgba(0,223,129,0.08)] hover:text-white"
                >
                  <span className="text-[#00df81]">+</span>
                  {tpl.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main Input Area ── */}
      <div className="relative flex-1 min-h-0 flex flex-col p-3 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading || disabled}
          className={cn(
            "w-full flex-1 resize-none bg-transparent outline-none leading-relaxed transition-colors",
            "text-white placeholder:text-white/35 font-sans",
            compact ? "text-xs min-h-[38px] max-h-[140px]" : "text-sm min-h-[90px]"
          )}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        />

        {/* Attached file chip */}
        {attachedFile && (
          <div className="mt-2 flex items-center gap-2 self-start rounded-md border border-[rgba(0,223,129,0.3)] bg-[rgba(0,223,129,0.08)] px-2 py-1 text-[11px] font-mono text-white/90">
            <Paperclip className="size-3 text-[#00df81]" />
            <span className="max-w-[200px] truncate">{attachedFile.name}</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-white/50 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Integrated Action Toolbar (Bottom) ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-black/40 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Model Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-white/80 transition-all",
                    "hover:border-[rgba(0,223,129,0.35)] hover:bg-[rgba(0,223,129,0.06)] hover:text-white"
                  )}
                />
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModelObj.id}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  {activeModelObj.icon || getModelIcon(activeModelObj.id, activeModelObj.provider)}
                  <span className="font-semibold">{activeModelObj.name}</span>
                  {activeModelObj.badge && (
                    <span className="hidden sm:inline-block rounded px-1.5 py-0.2 text-[9px] bg-white/10 text-white/60">
                      {activeModelObj.badge}
                    </span>
                  )}
                  <ChevronDown className="size-3 text-white/40 ml-0.5" />
                </motion.div>
              </AnimatePresence>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className={cn(
                "min-w-[15rem] p-1.5 rounded-xl border border-[rgba(255,255,255,0.12)]",
                "bg-[#090c12]/98 shadow-2xl backdrop-blur-2xl text-white font-mono text-xs"
              )}
            >
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40 font-bold border-b border-white/[0.06] mb-1">
                Model Routing
              </div>
              {normalizedModels.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onSelect={() => handleSelectModel(m)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors outline-none",
                      isSelected
                        ? "bg-[rgba(0,223,129,0.12)] text-[#00df81] font-semibold"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.icon || getModelIcon(m.id, m.provider)}
                      <div className="truncate">
                        <div className="truncate">{m.name}</div>
                        {m.badge && (
                          <div className="text-[9px] text-white/40">{m.badge}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 flex-none text-[#00df81]" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="mx-1 h-3.5 w-px bg-white/10" />

          {/* Attachment button */}
          {showAttachment && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach context or spec file"
                aria-label="Attach file"
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"
              >
                <Paperclip className="size-3.5" />
              </button>
            </>
          )}

          {/* Key shortcut hint */}
          <span className="hidden sm:inline-block font-mono text-[10px] text-white/30 ml-1">
            ↵ to run
          </span>
        </div>

        {/* Right CTA Submit Button */}
        <div className="flex items-center gap-2">
          {compact ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || loading || disabled}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-lg font-bold transition-all",
                "bg-[#00df81] text-[#06190e] shadow-[0_0_12px_rgba(0,223,129,0.3)] hover:shadow-[0_0_18px_rgba(0,223,129,0.5)] hover:scale-105 active:scale-95",
                "disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none"
              )}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || loading || disabled}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all",
                "bg-gradient-to-r from-[#00df81] to-[#00b368] text-[#06190e]",
                "shadow-[0_0_16px_rgba(0,223,129,0.28)] hover:shadow-[0_0_24px_rgba(0,223,129,0.5)] hover:brightness-110 active:scale-[0.98]",
                "disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none font-mono tracking-wide"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{submitLoadingLabel}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>{submitLabel}</span>
                  <ArrowRight className="size-3.5 ml-0.5 opacity-80" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIPrompt;
