import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Language } from '../../types';
import { getTranslation } from '../../locales';
import {
  multiAgentApi,
  MultiAgentGenerateResult,
  WizardStep1Request,
  WizardStep2Request,
} from '../../services/api';
import { resolveTemplateColor } from '../../utils/templateColors';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardParams {
  scenarioName: string;
  description: string;
  teamSize: 'small' | 'medium' | 'large';
  workflowType: string;
  language: string;
  modelId?: string;
}

type WizardPhase = 'step1' | 'step2' | 'done';
type AgentFileStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

interface AgentCore {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
}

interface AgentFiles {
  soul: string;
  agentsMd: string;
  userMd: string;
  identityMd: string;
  heartbeat: string;
}

interface AgentWizardState {
  core: AgentCore;
  files: Partial<AgentFiles>;
  fileStatus: AgentFileStatus;
  streamBuf: string;
  error?: string;
  customPrompt?: string;
}

interface GenerationWizardProps {
  language: Language;
  params: WizardParams;
  onDone: (result: MultiAgentGenerateResult) => void;
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildStep1Prompt(params: WizardParams): string {
  const langHint = params.language === 'zh' || params.language === 'zh-TW' ? 'Chinese'
    : params.language === 'ja' ? 'Japanese'
    : params.language === 'ko' ? 'Korean'
    : 'English';
  const agentCount = params.teamSize === 'small' ? '3 to 4'
    : params.teamSize === 'large' ? '8 to 10'
    : '5 to 7';
  return `Output ONLY valid JSON, no markdown.\n\nScenario: ${params.scenarioName}\nDescription: ${params.description}\nAgents: ${agentCount}\nWorkflow: ${params.workflowType}\nLanguage: ${langHint}\n\nFor each agent: id (kebab-case), name, role (≤8 words), description (≤20 words), icon (Material Symbol), color (Tailwind gradient e.g. from-blue-500 to-cyan-500). reasoning: ≤15 words. workflow: one step per agent.\n\n{"reasoning":"","template":{"id":"","name":"","description":"","agents":[{"id":"","name":"","role":"","description":"","icon":"","color":""}],"workflow":{"type":"${params.workflowType}","description":"","steps":[{"agent":"","action":""}]}}}`;
}

function buildStep2Prompt(agent: AgentCore, scenarioName: string, langHint: string): string {
  return `Output ONLY valid JSON, no markdown.\n\nGenerate workspace files for AI agent:\nName: ${agent.name}\nRole: ${agent.role}\nDescription: ${agent.description}\nScenario: ${scenarioName}\nLanguage: ${langHint}\n\nFields:\n- soul: 3 sentences (persona, responsibilities, working style)\n- agentsMd: 2 sentences (workspace startup instructions)\n- userMd: 1 sentence (profile of the human this agent serves)\n- identityMd: "Name: X | Creature: X | Vibe: X | Emoji: X"\n- heartbeat: "- [ ] item1\\n- [ ] item2\\n- [ ] item3"\n\n{"soul":"","agentsMd":"","userMd":"","identityMd":"","heartbeat":""}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function GenerationWizard({ language, params, onDone, onCancel }: GenerationWizardProps) {
  const t = getTranslation(language);
  const gw = (t as any).generationWizard ?? {};

  // ── Phase ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<WizardPhase>('step1');

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [step1Prompt, setStep1Prompt] = useState(() => buildStep1Prompt(params));
  const [step1ShowPrompt, setStep1ShowPrompt] = useState(false);
  const [step1Stream, setStep1Stream] = useState('');
  const [step1Running, setStep1Running] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Result, setStep1Result] = useState<any>(null); // parsed JSON from done event
  const step1AbortRef = useRef<AbortController | null>(null);
  const step1BufRef = useRef('');
  const step1RafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [agents, setAgents] = useState<AgentWizardState[]>([]);
  const [step2ActiveIdx, setStep2ActiveIdx] = useState(0);
  const [step2Running, setStep2Running] = useState(false);
  const step2AbortRef = useRef<AbortController | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [editingPromptFor, setEditingPromptFor] = useState<string | null>(null);

  // Auto-start step1 on mount
  useEffect(() => {
    handleStep1Start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleStep1Start = useCallback(() => {
    step1AbortRef.current?.abort();
    step1BufRef.current = '';
    if (step1RafRef.current !== null) { clearTimeout(step1RafRef.current); step1RafRef.current = null; }
    setStep1Stream('');
    setStep1Error(null);
    setStep1Running(true);
    setStep1Result(null);

    const req: WizardStep1Request = {
      scenarioName: params.scenarioName,
      description: params.description,
      teamSize: params.teamSize,
      workflowType: params.workflowType,
      language: params.language,
      modelId: params.modelId,
      customPrompt: step1Prompt,
    };

    step1AbortRef.current = multiAgentApi.wizardStep1(
      req,
      (token) => {
        step1BufRef.current += token;
        if (step1RafRef.current === null) {
          step1RafRef.current = setTimeout(() => {
            setStep1Stream(step1BufRef.current);
            step1RafRef.current = null;
          }, 30);
        }
      },
      (doneData) => {
        setStep1Running(false);
        setStep1Result(doneData);
        // Build agent wizard states from parsed data
        const parsed = doneData.parsed ?? {};
        const agentList: AgentCore[] = (parsed?.template?.agents ?? []).map((a: any) => ({
          id: a.id ?? '',
          name: a.name ?? '',
          role: a.role ?? '',
          description: a.description ?? '',
          icon: a.icon ?? 'person',
          color: a.color ?? 'from-blue-500 to-cyan-500',
        }));
        const langHint = params.language === 'zh' || params.language === 'zh-TW' ? 'Chinese'
          : params.language === 'ja' ? 'Japanese'
          : params.language === 'ko' ? 'Korean'
          : 'English';
        setAgents(agentList.map(core => ({
          core,
          files: {},
          fileStatus: 'pending',
          streamBuf: '',
          customPrompt: buildStep2Prompt(core, params.scenarioName, langHint),
        })));
        setPhase('step2');
        setStep2ActiveIdx(0);
      },
      (code, msg) => {
        setStep1Running(false);
        setStep1Error(`${code}: ${msg}`);
      },
    );
  }, [params, step1Prompt]);

  const handleStep1Stop = useCallback(() => {
    step1AbortRef.current?.abort();
    setStep1Running(false);
  }, []);

  // ── Step 2: generate one agent ─────────────────────────────────────────────
  const runAgentGeneration = useCallback((idx: number) => {
    if (idx >= agents.length) {
      // All done — assemble final result
      handleFinish();
      return;
    }
    const agent = agents[idx];
    if (agent.fileStatus === 'skipped') {
      // Skip to next
      runAgentGeneration(idx + 1);
      return;
    }

    setStep2ActiveIdx(idx);
    setStep2Running(true);
    setAgents(prev => prev.map((a, i) => i === idx ? { ...a, fileStatus: 'running', streamBuf: '', error: undefined } : a));

    const req: WizardStep2Request = {
      agentId: agent.core.id,
      agentName: agent.core.name,
      agentRole: agent.core.role,
      agentDesc: agent.core.description,
      scenarioName: params.scenarioName,
      language: params.language,
      modelId: params.modelId,
      customPrompt: agent.customPrompt,
    };

    step2AbortRef.current = multiAgentApi.wizardStep2(
      req,
      (token) => {
        setAgents(prev => prev.map((a, i) => {
          if (i !== idx) return a;
          const newBuf = a.streamBuf + token;
          return { ...a, streamBuf: newBuf };
        }));
      },
      (doneData) => {
        setAgents(prev => prev.map((a, i) => i === idx ? {
          ...a,
          fileStatus: 'done',
          streamBuf: '',
          files: {
            soul: doneData.soul ?? '',
            agentsMd: doneData.agentsMd ?? '',
            userMd: doneData.userMd ?? '',
            identityMd: doneData.identityMd ?? '',
            heartbeat: doneData.heartbeat ?? '',
          },
        } : a));
        setStep2Running(false);
        // Auto-advance to next pending agent
        const nextIdx = agents.findIndex((a, i) => i > idx && a.fileStatus === 'pending');
        if (nextIdx >= 0) {
          setTimeout(() => runAgentGeneration(nextIdx), 200);
        } else {
          // All non-skipped agents done
          handleFinish();
        }
      },
      (code, msg) => {
        setAgents(prev => prev.map((a, i) => i === idx ? { ...a, fileStatus: 'error', error: `${code}: ${msg}` } : a));
        setStep2Running(false);
      },
    );
  }, [agents, params]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleStartStep2 = useCallback(() => {
    runAgentGeneration(0);
  }, [runAgentGeneration]);

  const handleStop = useCallback(() => {
    step2AbortRef.current?.abort();
    setStep2Running(false);
    setAgents(prev => prev.map(a => a.fileStatus === 'running' ? { ...a, fileStatus: 'error', error: 'Stopped by user' } : a));
  }, []);

  const handleRetryAgent = useCallback((idx: number) => {
    setAgents(prev => prev.map((a, i) => i === idx ? { ...a, fileStatus: 'pending', error: undefined } : a));
    runAgentGeneration(idx);
  }, [runAgentGeneration]);

  const handleSkipAgent = useCallback((idx: number) => {
    setAgents(prev => prev.map((a, i) => i === idx ? { ...a, fileStatus: 'skipped' } : a));
    if (step2Running && step2ActiveIdx === idx) {
      step2AbortRef.current?.abort();
      setStep2Running(false);
      // Advance past this one
      const nextIdx = agents.findIndex((a, i) => i > idx && a.fileStatus === 'pending');
      if (nextIdx >= 0) setTimeout(() => runAgentGeneration(nextIdx), 100);
    }
  }, [step2Running, step2ActiveIdx, agents, runAgentGeneration]);

  // ── Finish: build MultiAgentGenerateResult ────────────────────────────────
  const handleFinish = useCallback(() => {
    if (!step1Result) return;
    const parsed = step1Result.parsed ?? {};
    const agentResults = agents.map(a => ({
      id: a.core.id,
      name: a.core.name,
      role: a.core.role,
      description: a.core.description,
      icon: a.core.icon,
      color: a.core.color,
      soul: a.files.soul ?? '',
      agentsMd: a.files.agentsMd ?? '',
      userMd: a.files.userMd ?? '',
      identityMd: a.files.identityMd ?? '',
      heartbeat: a.files.heartbeat ?? '',
    }));
    const result: MultiAgentGenerateResult = {
      reasoning: parsed.reasoning ?? '',
      template: {
        id: parsed.template?.id ?? '',
        name: parsed.template?.name ?? params.scenarioName,
        description: parsed.template?.description ?? params.description,
        agents: agentResults,
        workflow: parsed.template?.workflow ?? { type: params.workflowType, description: '', steps: [] },
      },
    };
    setPhase('done');
    onDone(result);
  }, [step1Result, agents, params, onDone]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      step1AbortRef.current?.abort();
      step2AbortRef.current?.abort();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const doneCount = agents.filter(a => a.fileStatus === 'done' || a.fileStatus === 'skipped').length;
  const errCount = agents.filter(a => a.fileStatus === 'error').length;
  const allSettled = agents.length > 0 && agents.every(a => a.fileStatus !== 'pending' && a.fileStatus !== 'running');

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Phase pills */}
          {(['step1', 'step2'] as const).map((p, i) => {
            const isActive = phase === p;
            const isDone = (p === 'step1' && (phase === 'step2' || phase === 'done'));
            return (
              <React.Fragment key={p}>
                {i > 0 && <span className="w-4 h-px bg-slate-200 dark:bg-white/10 shrink-0" />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  isDone ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                  : isActive ? 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400'
                  : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400 dark:text-white/25'
                }`}>
                  <span className="material-symbols-outlined text-[11px]">
                    {isDone ? 'check_circle' : i === 0 ? 'account_tree' : 'auto_awesome'}
                  </span>
                  {p === 'step1' ? (gw.phase1Label || 'Team Structure') : (gw.phase2Label || 'Agent Files')}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <button
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ══════════════════════════════════════════════════════════════════
            PHASE 1 — Stream core structure
        ════════════════════════════════════════════════════════════════════ */}
        {phase === 'step1' && (
          <div className="p-4 space-y-3">
            {/* Status row */}
            <div className="flex items-center gap-2">
              {step1Running ? (
                <span className="material-symbols-outlined text-[18px] text-violet-500 animate-spin" style={{ animationDuration: '1.5s' }}>progress_activity</span>
              ) : step1Error ? (
                <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
              ) : step1Result ? (
                <span className="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-slate-300">radio_button_unchecked</span>
              )}
              <p className="text-[12px] font-bold text-slate-700 dark:text-white/80 flex-1 min-w-0">
                {step1Running ? (gw.step1Running || 'Generating team structure…') :
                 step1Error ? (gw.step1Error || 'Generation failed') :
                 step1Result ? (gw.step1Done || 'Structure ready') :
                 (gw.step1Waiting || 'Waiting…')}
              </p>
              {step1Running && (
                <button onClick={handleStep1Stop} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 dark:text-white/40 hover:bg-red-500/10 hover:text-red-500 border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">stop</span>
                  {gw.stop || 'Stop'}
                </button>
              )}
              {!step1Running && (
                <button onClick={handleStep1Start} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 dark:text-white/40 hover:bg-violet-500/10 hover:text-violet-500 border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">{step1Result ? 'refresh' : 'play_arrow'}</span>
                  {step1Result ? (gw.regenerate || 'Regenerate') : (gw.start || 'Start')}
                </button>
              )}
            </div>

            {/* Error */}
            {step1Error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-[11px] text-red-600 dark:text-red-400 font-mono break-all">{step1Error}</p>
              </div>
            )}

            {/* Live stream preview */}
            {(step1Stream || step1Running) && (
              <div className="rounded-xl bg-slate-900/70 dark:bg-black/50 border border-violet-500/15 overflow-hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-violet-500/10">
                  {step1Running && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                      <span className="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-green-400/70 uppercase tracking-wider">{gw.liveOutput || 'Live output'}</span>
                  <span className="ms-auto text-[9px] text-slate-500 dark:text-white/20 font-mono">{step1Stream.length} chars</span>
                </div>
                <div className="px-2.5 py-2 max-h-[140px] overflow-y-auto relative">
                  <pre className="text-[10px] font-mono text-slate-300/70 dark:text-white/40 leading-relaxed whitespace-pre-wrap break-all">
                    {step1Stream || ' '}
                    {step1Running && <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
                  </pre>
                </div>
              </div>
            )}

            {/* Prompt editor */}
            <div>
              <button
                onClick={() => setStep1ShowPrompt(v => !v)}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">{step1ShowPrompt ? 'expand_less' : 'expand_more'}</span>
                {gw.editPrompt || 'Edit prompt'}
              </button>
              {step1ShowPrompt && (
                <textarea
                  value={step1Prompt}
                  onChange={e => setStep1Prompt(e.target.value)}
                  className="mt-1.5 w-full h-36 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-[10px] font-mono text-slate-700 dark:text-white/70 resize-y focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PHASE 2 — Per-agent file generation
        ════════════════════════════════════════════════════════════════════ */}
        {phase === 'step2' && (
          <div className="p-4 space-y-3">
            {/* Progress header */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-white/80">
                  {gw.step2Title || 'Generate agent workspace files'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                  {doneCount}/{agents.length} {gw.step2Progress || 'agents done'}
                  {errCount > 0 && <span className="ms-2 text-red-500">{errCount} {gw.step2Errors || 'errors'}</span>}
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${agents.length ? (doneCount / agents.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2">
              {!step2Running && !allSettled && (
                <button
                  onClick={handleStartStep2}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-violet-500 hover:bg-violet-600 text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                  {gw.startAll || 'Generate all'}
                </button>
              )}
              {step2Running && (
                <button
                  onClick={handleStop}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">stop</span>
                  {gw.stopAll || 'Stop'}
                </button>
              )}
              {allSettled && (
                <button
                  onClick={handleFinish}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  {gw.finish || 'Continue to preview'}
                </button>
              )}
              <button
                onClick={() => { setPhase('step1'); setStep1Result(null); setStep1Stream(''); }}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                {gw.backToStep1 || 'Back'}
              </button>
            </div>

            {/* Agent list */}
            <div className="space-y-2">
              {agents.map((agent, idx) => {
                const isActive = idx === step2ActiveIdx && step2Running;
                const colorStyle = resolveTemplateColor(agent.core.color);
                const statusIcon = agent.fileStatus === 'done' ? 'check_circle'
                  : agent.fileStatus === 'error' ? 'error'
                  : agent.fileStatus === 'skipped' ? 'skip_next'
                  : agent.fileStatus === 'running' ? 'progress_activity'
                  : 'radio_button_unchecked';
                const statusColor = agent.fileStatus === 'done' ? 'text-green-500'
                  : agent.fileStatus === 'error' ? 'text-red-500'
                  : agent.fileStatus === 'skipped' ? 'text-slate-400 dark:text-white/25'
                  : agent.fileStatus === 'running' ? 'text-violet-500'
                  : 'text-slate-300 dark:text-white/15';

                return (
                  <div key={agent.core.id} className={`rounded-xl border overflow-hidden transition-all ${
                    isActive ? 'border-violet-500/40 shadow-sm shadow-violet-500/10' : 'border-slate-200 dark:border-white/10'
                  }`}>
                    {/* Agent header row */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-white/[0.02]">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={colorStyle}>
                        <span className="material-symbols-outlined text-white text-[15px]">{agent.core.icon}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate">{agent.core.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">{agent.core.role}</p>
                      </div>
                      {/* Status icon */}
                      <span className={`material-symbols-outlined text-[16px] shrink-0 ${statusColor} ${isActive ? 'animate-spin' : ''}`}
                        style={isActive ? { animationDuration: '1.5s' } : {}}>
                        {statusIcon}
                      </span>
                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(agent.fileStatus === 'error' || agent.fileStatus === 'pending') && !step2Running && (
                          <button
                            onClick={() => handleRetryAgent(idx)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-violet-500/10 text-violet-500 transition-colors"
                            title={gw.retry || 'Retry'}
                          >
                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                          </button>
                        )}
                        {agent.fileStatus !== 'skipped' && agent.fileStatus !== 'done' && (
                          <button
                            onClick={() => handleSkipAgent(idx)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                            title={gw.skip || 'Skip'}
                          >
                            <span className="material-symbols-outlined text-[14px]">skip_next</span>
                          </button>
                        )}
                        {agent.fileStatus === 'skipped' && (
                          <button
                            onClick={() => setAgents(prev => prev.map((a, i) => i === idx ? { ...a, fileStatus: 'pending' } : a))}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                            title={gw.unskip || 'Include'}
                          >
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedAgent(v => v === agent.core.id ? null : agent.core.id)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {expandedAgent === agent.core.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded: stream / result / prompt editor */}
                    {expandedAgent === agent.core.id && (
                      <div className="border-t border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.01] p-2.5 space-y-2">

                        {/* Live stream */}
                        {agent.fileStatus === 'running' && agent.streamBuf && (
                          <div className="rounded-lg bg-slate-900/70 dark:bg-black/50 border border-violet-500/15 overflow-hidden">
                            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-violet-500/10">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                                <span className="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                              </span>
                              <span className="text-[9px] font-bold text-green-400/70 uppercase tracking-wider">{gw.liveOutput || 'Live output'}</span>
                            </div>
                            <pre className="px-2 py-1.5 text-[9px] font-mono text-slate-300/70 dark:text-white/40 leading-relaxed whitespace-pre-wrap break-all max-h-[100px] overflow-y-auto">
                              {agent.streamBuf}
                              <span className="inline-block w-1.5 h-2.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                            </pre>
                          </div>
                        )}

                        {/* Done: show file summary */}
                        {agent.fileStatus === 'done' && agent.files.soul && (
                          <div className="space-y-1.5">
                            {([
                              { key: 'soul', label: 'SOUL.md' },
                              { key: 'agentsMd', label: 'AGENTS.md' },
                              { key: 'userMd', label: 'USER.md' },
                              { key: 'identityMd', label: 'IDENTITY.md' },
                              { key: 'heartbeat', label: 'HEARTBEAT.md' },
                            ] as const).map(({ key, label }) => {
                              const val = agent.files[key];
                              if (!val) return null;
                              return (
                                <div key={key} className="rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                                  <div className="flex items-center gap-1.5 px-2 py-1 border-b border-slate-100 dark:border-white/[0.04]">
                                    <span className="material-symbols-outlined text-[11px] text-slate-400">description</span>
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/40 font-mono">{label}</span>
                                  </div>
                                  <p className="px-2 py-1.5 text-[10px] text-slate-500 dark:text-white/40 line-clamp-2 font-mono leading-relaxed">
                                    {val}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Error */}
                        {agent.fileStatus === 'error' && (
                          <p className="text-[10px] text-red-500 font-mono break-all">{agent.error}</p>
                        )}

                        {/* Prompt editor */}
                        <div>
                          <button
                            onClick={() => setEditingPromptFor(v => v === agent.core.id ? null : agent.core.id)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white/50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                            {gw.editPrompt || 'Edit prompt'}
                          </button>
                          {editingPromptFor === agent.core.id && (
                            <textarea
                              value={agent.customPrompt ?? ''}
                              onChange={e => {
                                const val = e.target.value;
                                setAgents(prev => prev.map((a, i) => i === idx ? { ...a, customPrompt: val } : a));
                              }}
                              className="mt-1.5 w-full h-28 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-[9px] font-mono text-slate-700 dark:text-white/70 resize-y focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                              spellCheck={false}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skip all / finish early */}
            {!allSettled && !step2Running && (
              <button
                onClick={handleFinish}
                className="w-full py-2 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[10px] text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/40 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
              >
                {gw.skipAllFiles || 'Skip file generation and continue'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
