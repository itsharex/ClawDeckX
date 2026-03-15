import React, { useState, useEffect, useCallback } from 'react';
import { MiniDonut, MiniBarChart } from './MiniChart';

interface SessionInfo {
  model?: string;
  modelProvider?: string;
  totalTokens?: number;
  maxContextTokens?: number;
  compacted?: boolean;
  thinkingLevel?: string;
  messageCount?: number;
  lastLatencyMs?: number | null;
  liveElapsed?: number;
  runPhase?: string;
}

interface UsagePanelProps {
  sessionKey: string;
  gwReady: boolean;
  loadUsage: (key: string) => Promise<any>;
  labels: Record<string, string>;
  session?: SessionInfo;
  onModelClick?: () => void;
}

const fmtTok = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n || 0);
const fmtCost = (n: number) => n >= 1 ? `$${n.toFixed(2)}` : n > 0 ? `$${n.toFixed(4)}` : '$0';

export const UsagePanel: React.FC<UsagePanelProps> = ({ sessionKey, gwReady, loadUsage, labels: a, session: s, onModelClick }) => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('usage-panel-collapsed') === '1'; } catch { return false; }
  });

  const load = useCallback(async () => {
    if (!gwReady || !sessionKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadUsage(sessionKey);
      setUsage(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
    setLoading(false);
  }, [gwReady, sessionKey, loadUsage]);

  useEffect(() => { load(); }, [load]);

  const toggle = () => {
    setCollapsed(v => {
      try { localStorage.setItem('usage-panel-collapsed', v ? '0' : '1'); } catch {}
      return !v;
    });
  };

  if (collapsed) {
    return (
      <button onClick={toggle}
        className="w-8 h-full border-s border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center
                   bg-white/50 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition">
        <span className="material-symbols-outlined text-[14px] text-slate-400">analytics</span>
      </button>
    );
  }

  const u = usage;
  const tokenSlices = u ? [
    { value: u.input || 0, color: '#3b82f6' },
    { value: u.output || 0, color: '#f59e0b' },
    ...(u.cacheRead ? [{ value: u.cacheRead, color: '#8b5cf6' }] : []),
  ].filter(d => d.value > 0) : [];

  const dailyData = u?.dailyBreakdown?.slice(-7) || [];

  // Context usage percentage
  const ctxPct = s?.totalTokens && s?.maxContextTokens
    ? Math.min(100, (s.totalTokens / s.maxContextTokens) * 100) : 0;
  const ctxClr = ctxPct > 90 ? 'bg-red-500' : ctxPct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const ctxTxtClr = ctxPct > 90 ? 'text-red-500' : ctxPct > 70 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="w-56 shrink-0 border-s border-slate-200/60 dark:border-white/[0.06]
                    bg-white/50 dark:bg-white/[0.02] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/60 dark:border-white/[0.04]">
        <span className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase">{a.usage || 'Usage'}</span>
        <div className="flex items-center gap-1">
          <button onClick={load} disabled={loading} className="p-0.5 text-slate-400 hover:text-primary">
            <span className={`material-symbols-outlined text-[12px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button onClick={toggle} className="p-0.5 text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Session Info Section */}
        {s?.model && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1.5">{a.model || 'Model'}</div>
            <button type="button" onClick={onModelClick}
              className="w-full text-start px-2 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/10
                         hover:from-purple-500/15 hover:to-blue-500/15 hover:border-purple-500/20 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 truncate">{s.model}</div>
                  {s.modelProvider && <div className="text-[10px] text-slate-400 dark:text-white/25 mt-0.5">{s.modelProvider}</div>}
                </div>
                <span className="material-symbols-outlined text-[12px] text-purple-400/50 group-hover:text-purple-400 transition shrink-0 ms-1">swap_horiz</span>
              </div>
            </button>
          </div>
        )}

        {/* Context Window + Session Stats (merged row) */}
        {s?.totalTokens ? (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1.5">{a.context || 'Context'}</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-white/60">{fmtTok(s.totalTokens)}</span>
                {s.maxContextTokens ? (
                  <span className="text-[10px] text-slate-400 dark:text-white/25">/ {fmtTok(s.maxContextTokens)}</span>
                ) : null}
              </div>
              {s.maxContextTokens ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${ctxClr} transition-all`} style={{ width: `${ctxPct}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${ctxTxtClr}`}>{ctxPct.toFixed(0)}%</span>
                  {s.compacted && <span className="material-symbols-outlined text-[11px] text-amber-500" title={a.ctxCompacted || 'Compacted'}>compress</span>}
                </div>
              ) : null}
              {/* Session quick stats inline */}
              {(s.messageCount || s.thinkingLevel || s.lastLatencyMs || s.liveElapsed) ? (
                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] pt-0.5">
                  {s.messageCount ? (
                    <span className="text-slate-500 dark:text-white/35">
                      <span className="material-symbols-outlined text-[10px] align-middle me-0.5">chat</span>
                      {s.messageCount} msg
                    </span>
                  ) : null}
                  {s.thinkingLevel ? (
                    <span className="text-slate-500 dark:text-white/35">
                      <span className="material-symbols-outlined text-[10px] align-middle me-0.5">psychology</span>
                      {s.thinkingLevel}
                    </span>
                  ) : null}
                  {(s.runPhase === 'streaming' || s.runPhase === 'sending') && s.liveElapsed ? (
                    <span className="text-primary font-mono tabular-nums">
                      <span className="material-symbols-outlined text-[10px] align-middle me-0.5">timer</span>
                      {(s.liveElapsed / 1000).toFixed(1)}s
                    </span>
                  ) : s.lastLatencyMs && s.runPhase === 'idle' ? (
                    <span className="text-slate-500 dark:text-white/35 font-mono tabular-nums">
                      <span className="material-symbols-outlined text-[10px] align-middle me-0.5">speed</span>
                      {(s.lastLatencyMs / 1000).toFixed(1)}s
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Divider before usage data */}
        {(s?.model || s?.totalTokens) && (u || error) && (
          <div className="border-t border-slate-100/60 dark:border-white/[0.04]" />
        )}

        {/* Cost */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">{a.cost || 'Cost'}</div>
          <div className="text-lg font-bold text-slate-700 dark:text-white/80 tabular-nums">{fmtCost(u?.totalCost || 0)}</div>
          {u && (
            <div className="text-[10px] text-slate-400 dark:text-white/25">
              {a.input || 'In'}: {fmtCost(u.inputCost || 0)} · {a.output || 'Out'}: {fmtCost(u.outputCost || 0)}
            </div>
          )}
        </div>

        {/* Token Donut */}
        {tokenSlices.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">{a.tokens || 'Tokens'}</div>
            <div className="flex items-center gap-2">
              <MiniDonut size={56} slices={tokenSlices} innerRadius={0.6} />
              <div className="text-[10px] space-y-0.5">
                <div><span className="text-blue-500">●</span> {a.input || 'In'}: {fmtTok(u.input)}</div>
                <div><span className="text-amber-500">●</span> {a.output || 'Out'}: {fmtTok(u.output)}</div>
                {u.cacheRead > 0 && <div><span className="text-purple-500">●</span> {a.cache || 'Cache'}: {fmtTok(u.cacheRead)}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center gap-2 p-3 text-center rounded-lg bg-red-50/50 dark:bg-red-500/5">
            <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
            <p className="text-[10px] text-red-400">{error}</p>
            <button onClick={load} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition">
              {a.retry || 'Retry'}
            </button>
          </div>
        )}

        {/* Messages — stacked bar chart */}
        {u?.messageCounts && u.messageCounts.total > 0 && (() => {
          const mc = u.messageCounts;
          return (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase">{a.messages || 'Messages'}</span>
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-white/60 tabular-nums">{mc.total}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex mb-1">
                {mc.user > 0 && <div className="h-full bg-blue-400/80" style={{ width: `${(mc.user / mc.total) * 100}%` }} title={`${a.user || 'User'}: ${mc.user}`} />}
                {mc.assistant > 0 && <div className="h-full bg-emerald-400/80" style={{ width: `${(mc.assistant / mc.total) * 100}%` }} title={`${a.assistant || 'Asst'}: ${mc.assistant}`} />}
                {mc.toolCalls > 0 && <div className="h-full bg-purple-400/80" style={{ width: `${(mc.toolCalls / mc.total) * 100}%` }} title={`${a.toolCall || 'Tools'}: ${mc.toolCalls}`} />}
                {mc.errors > 0 && <div className="h-full bg-red-400/80" style={{ width: `${(mc.errors / mc.total) * 100}%` }} title={`${a.error || 'Errors'}: ${mc.errors}`} />}
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px]">
                <span className="text-blue-500">● {a.user || 'User'} {mc.user}</span>
                <span className="text-emerald-500">● {a.assistant || 'Asst'} {mc.assistant}</span>
                {mc.toolCalls > 0 && <span className="text-purple-500">● {a.toolCall || 'Tools'} {mc.toolCalls}</span>}
                {mc.errors > 0 && <span className="text-red-500">● {a.error || 'Err'} {mc.errors}</span>}
              </div>
            </div>
          );
        })()}

        {/* Tool Usage — horizontal bar chart */}
        {u?.toolUsage && u.toolUsage.totalCalls > 0 && (() => {
          const topTools = (u.toolUsage.tools || []).slice(0, 5);
          const maxCalls = topTools[0]?.count || 1;
          return (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase">{a.tools || 'Tools'}</span>
                <span className="text-[9px] text-slate-400 dark:text-white/25">{u.toolUsage.totalCalls} · {u.toolUsage.uniqueTools} {a.unique || 'unique'}</span>
              </div>
              <div className="space-y-1">
                {topTools.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500/80 to-violet-400/60 transition-all" style={{ width: `${(t.count / maxCalls) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-white/25 font-mono truncate max-w-[50px]" title={t.name}>{t.name}</span>
                    <span className="text-[9px] text-purple-500 dark:text-purple-400 font-bold tabular-nums shrink-0">{t.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Latency — range bar visualization */}
        {u?.latency && u.latency.count > 0 && (() => {
          const { avgMs, p95Ms, minMs, maxMs } = u.latency;
          return (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase">{a.latency || 'Latency'}</span>
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-white/60 tabular-nums">{(avgMs / 1000).toFixed(1)}s</span>
              </div>
              {/* Range bar: min → avg → p95 → max */}
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden relative mb-1">
                {maxMs > 0 && (
                  <>
                    <div className="absolute h-full bg-emerald-400/50 rounded-s-full" style={{ left: `${(minMs / maxMs) * 100}%`, width: `${((avgMs - minMs) / maxMs) * 100}%` }} />
                    <div className="absolute h-full bg-amber-400/50" style={{ left: `${(avgMs / maxMs) * 100}%`, width: `${((p95Ms - avgMs) / maxMs) * 100}%` }} />
                    <div className="absolute h-full bg-red-400/30 rounded-e-full" style={{ left: `${(p95Ms / maxMs) * 100}%`, width: `${((maxMs - p95Ms) / maxMs) * 100}%` }} />
                  </>
                )}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-white/25 tabular-nums">
                <span>{(minMs / 1000).toFixed(1)}s</span>
                <span className="text-amber-500 font-bold">p95 {(p95Ms / 1000).toFixed(1)}s</span>
                <span>{(maxMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          );
        })()}

        {/* Session Duration */}
        {u?.firstActivity && u?.lastActivity && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">{a.duration || 'Duration'}</div>
            <div className="text-[10px] text-slate-500 dark:text-white/35 space-y-0.5">
              <div>{a.firstMsg || 'First'}: <b>{new Date(u.firstActivity).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></div>
              <div>{a.lastMsg || 'Last'}: <b>{new Date(u.lastActivity).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></div>
              {u.durationMs > 0 && (
                <div>{a.span || 'Span'}: <b>{u.durationMs >= 86400000
                  ? `${(u.durationMs / 86400000).toFixed(1)}d`
                  : u.durationMs >= 3600000
                    ? `${(u.durationMs / 3600000).toFixed(1)}h`
                    : `${(u.durationMs / 60000).toFixed(0)}m`
                }</b></div>
              )}
            </div>
          </div>
        )}

        {/* Daily bar chart */}
        {dailyData.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">{a.trend7d || '7-Day Trend'}</div>
            <MiniBarChart values={dailyData.map((d: any) => d.tokens || 0)} height={48} color="#3b82f6" />
          </div>
        )}

        {/* Model usage — horizontal bar chart */}
        {u?.modelUsage?.length > 0 && (() => {
          const topModels = u.modelUsage.slice(0, 5);
          const maxCount = topModels[0]?.count || 1;
          return (
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">{a.models || 'Models'}</div>
              <div className="space-y-1">
                {topModels.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500/80 to-cyan-400/60 transition-all" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-white/25 font-mono truncate max-w-[50px]" title={`${m.provider ? m.provider + '/' : ''}${m.model}`}>{m.model}</span>
                    <span className="text-[9px] text-blue-500 dark:text-blue-400 font-bold tabular-nums shrink-0">{m.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Loading placeholder when no usage data yet */}
        {!u && !error && loading && (
          <div className="flex items-center justify-center py-4 text-[10px] text-slate-400 dark:text-white/20">
            {a.loading || 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
};
