
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Language } from '../types';
import { getTranslation } from '../locales';
import { gwApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

interface TasksProps {
  language: Language;
}

type TaskStatus = 'all' | 'running' | 'queued' | 'completed' | 'failed' | 'cancelled';

interface TaskItem {
  taskId: string;
  status: string;
  agentId?: string;
  sessionKey?: string;
  source?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  error?: string;
  lastHeartbeat?: string;
  description?: string;
  label?: string;
  runId?: string;
  parentTaskId?: string;
}

const STATUS_ICONS: Record<string, string> = {
  running: 'play_circle',
  queued: 'hourglass_top',
  completed: 'check_circle',
  failed: 'error',
  cancelled: 'cancel',
};

const STATUS_COLORS: Record<string, string> = {
  running: 'text-blue-500 dark:text-blue-400',
  queued: 'text-amber-500 dark:text-amber-400',
  completed: 'text-emerald-500 dark:text-emerald-400',
  failed: 'text-red-500 dark:text-red-400',
  cancelled: 'text-zinc-400 dark:text-zinc-500',
};

const STATUS_BG: Record<string, string> = {
  running: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  queued: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
  cancelled: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
};

function formatRelativeTime(ts: string | undefined, t: any): string {
  if (!ts) return '—';
  const now = Date.now();
  const then = new Date(ts).getTime();
  if (isNaN(then)) return ts;
  const diffMs = now - then;
  if (diffMs < 60_000) return t?.task?.justNow || 'just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return (t?.task?.minutesAgo || '{n}m ago').replace('{n}', String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return (t?.task?.hoursAgo || '{n}h ago').replace('{n}', String(hrs));
  const days = Math.floor(hrs / 24);
  return (t?.task?.daysAgo || '{n}d ago').replace('{n}', String(days));
}

function formatDuration(startedAt?: string, completedAt?: string, updatedAt?: string): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : (updatedAt ? new Date(updatedAt).getTime() : Date.now());
  if (isNaN(start) || isNaN(end)) return '—';
  const diffMs = end - start;
  if (diffMs < 1000) return '<1s';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function getSourceLabel(source: string | undefined, t: any): string {
  if (!source) return t?.task?.sourceUnknown || 'Unknown';
  const map: Record<string, string> = {
    cron: t?.task?.sourceCron || 'Cron Job',
    subagent: t?.task?.sourceSubagent || 'Sub-agent',
    acp: t?.task?.sourceAcp || 'ACP',
    session: t?.task?.sourceSession || 'Session',
    cli: t?.task?.sourceCli || 'CLI',
  };
  return map[source.toLowerCase()] || source;
}

function getStatusLabel(status: string, t: any): string {
  const map: Record<string, string> = {
    running: t?.task?.statusRunning || 'Running',
    queued: t?.task?.statusQueued || 'Queued',
    completed: t?.task?.statusCompleted || 'Completed',
    failed: t?.task?.statusFailed || 'Failed',
    cancelled: t?.task?.statusCancelled || 'Cancelled',
  };
  return map[status.toLowerCase()] || status;
}

function isHeartbeatStale(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) return false;
  const hb = new Date(lastHeartbeat).getTime();
  if (isNaN(hb)) return false;
  return Date.now() - hb > 120_000; // 2 minutes
}

const Tasks: React.FC<TasksProps> = ({ language }) => {
  const t = useMemo(() => getTranslation(language) as any, [language]);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatus>('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await gwApi.tasksList();
      const items = Array.isArray(data) ? data : (data as any)?.tasks || [];
      setTasks(items);
    } catch (err: any) {
      setError(t?.task?.fetchFailed || 'Failed to fetch tasks');
      console.error('[Tasks] fetch failed:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => fetchTasks(false), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchTasks]);

  const handleCancel = useCallback(async (taskId: string) => {
    const ok = await confirm({
      title: t?.task?.cancel || 'Cancel',
      message: t?.task?.cancelConfirm || 'Are you sure you want to cancel this task?',
      confirmText: t?.task?.cancel || 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      await gwApi.tasksCancel(taskId);
      toast('success', t?.task?.cancelSuccess || 'Task cancelled successfully');
      fetchTasks(false);
    } catch {
      toast('error', t?.task?.cancelFailed || 'Failed to cancel task');
    }
  }, [t, confirm, toast, fetchTasks]);

  const handleNavigateToSession = useCallback((sessionKey: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-session', { detail: { sessionKey } }));
  }, []);

  const handleNavigateToAgent = useCallback((agentId: string) => {
    window.dispatchEvent(new CustomEvent('clawdeck:open-window', { detail: { id: 'agents' } }));
  }, []);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.status?.toLowerCase() === filter);
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const s = { total: tasks.length, running: 0, queued: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const task of tasks) {
      const st = task.status?.toLowerCase();
      if (st === 'running') s.running++;
      else if (st === 'queued') s.queued++;
      else if (st === 'completed') s.completed++;
      else if (st === 'failed') s.failed++;
      else if (st === 'cancelled') s.cancelled++;
    }
    return s;
  }, [tasks]);

  const selectedTaskData = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find(t => t.taskId === selectedTask) || null;
  }, [tasks, selectedTask]);

  const FILTER_TABS: { key: TaskStatus; labelKey: string; count?: number }[] = [
    { key: 'all', labelKey: 'all', count: stats.total },
    { key: 'running', labelKey: 'running', count: stats.running },
    { key: 'queued', labelKey: 'queued', count: stats.queued },
    { key: 'completed', labelKey: 'completed', count: stats.completed },
    { key: 'failed', labelKey: 'failed', count: stats.failed },
    { key: 'cancelled', labelKey: 'cancelled', count: stats.cancelled },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-cyan-400">task_alt</span>
          <h2 className="text-base font-semibold text-text">{t?.task?.title || 'Task Center'}</h2>
          <span className="text-xs text-text-muted ms-1">{t?.task?.desc || ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(p => !p)}
              className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5"
            />
            {t?.task?.autoRefresh || 'Auto Refresh'}
          </label>
          <button
            onClick={() => fetchTasks(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-colors"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {t?.task?.refresh || 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="sci-card flex items-center gap-2.5 px-3 py-2 min-w-[120px]">
          <span className="material-symbols-outlined text-lg text-cyan-400">summarize</span>
          <div>
            <div className="text-lg font-bold text-text">{stats.total}</div>
            <div className="text-[10px] text-text-muted">{t?.task?.totalTasks || 'Total Tasks'}</div>
          </div>
        </div>
        <div className="sci-card flex items-center gap-2.5 px-3 py-2 min-w-[120px]">
          <span className="material-symbols-outlined text-lg text-blue-400">play_circle</span>
          <div>
            <div className="text-lg font-bold text-text">{stats.running}</div>
            <div className="text-[10px] text-text-muted">{t?.task?.activeTasks || 'Active Tasks'}</div>
          </div>
        </div>
        {stats.failed > 0 && (
          <div className="sci-card flex items-center gap-2.5 px-3 py-2 min-w-[120px]">
            <span className="material-symbols-outlined text-lg text-red-400">error</span>
            <div>
              <div className="text-lg font-bold text-text">{stats.failed}</div>
              <div className="text-[10px] text-text-muted">{t?.task?.failed || 'Failed'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {t?.task?.[tab.labelKey] || tab.key}
            {(tab.count ?? 0) > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-cyan-500/30' : 'bg-white/10'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 neon-scrollbar">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-2xl text-white/30">progress_activity</span>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="material-symbols-outlined text-2xl text-red-400">warning</span>
            <span className="text-sm text-text-secondary">{error}</span>
            <button onClick={() => fetchTasks(true)} className="text-xs text-cyan-400 hover:underline">
              {t?.task?.refresh || 'Refresh'}
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="material-symbols-outlined text-3xl text-white/20">task_alt</span>
            <span className="text-sm text-text-secondary">{t?.task?.noTasks || 'No tasks found'}</span>
            <span className="text-xs text-text-muted max-w-xs text-center">{t?.task?.noTasksHint || ''}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map(task => {
              const st = task.status?.toLowerCase() || 'unknown';
              const isSelected = selectedTask === task.taskId;
              const stale = st === 'running' && isHeartbeatStale(task.lastHeartbeat);
              return (
                <div
                  key={task.taskId}
                  className={`sci-card p-3 cursor-pointer transition-all ${
                    isSelected ? 'ring-1 ring-cyan-500/50' : ''
                  }`}
                  onClick={() => setSelectedTask(isSelected ? null : task.taskId)}
                >
                  {/* Row 1: status + id + agent + actions */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-lg ${STATUS_COLORS[st] || 'text-zinc-400'} ${st === 'running' ? 'animate-pulse' : ''}`}>
                      {STATUS_ICONS[st] || 'help'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_BG[st] || 'bg-zinc-500/10 text-zinc-400'}`}>
                      {getStatusLabel(st, t)}
                    </span>
                    <span className="text-xs font-mono text-text-muted truncate min-w-0" title={task.taskId}>
                      {task.taskId?.slice(0, 12) || '—'}
                    </span>
                    {task.agentId && (
                      <span className="text-xs text-text-secondary truncate" title={task.agentId}>
                        <span className="material-symbols-outlined text-xs align-text-bottom me-0.5">robot_2</span>
                        {task.agentId}
                      </span>
                    )}
                    <div className="flex-1" />
                    {stale && (
                      <span className="material-symbols-outlined text-sm text-amber-400" title={t?.task?.heartbeatStale || 'Heartbeat stale'}>
                        warning
                      </span>
                    )}
                    {(st === 'running' || st === 'queued') && (
                      <button
                        onClick={e => { e.stopPropagation(); handleCancel(task.taskId); }}
                        className="text-xs px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title={t?.task?.cancel || 'Cancel'}
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                      </button>
                    )}
                  </div>

                  {/* Row 2: meta */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted flex-wrap">
                    {task.source && (
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">source</span>
                        {getSourceLabel(task.source, t)}
                      </span>
                    )}
                    {task.label && (
                      <span className="truncate max-w-[160px]" title={task.label}>{task.label}</span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {formatRelativeTime(task.startedAt, t)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">timer</span>
                      {formatDuration(task.startedAt, task.completedAt, task.updatedAt)}
                    </span>
                  </div>

                  {/* Error hint for failed tasks */}
                  {st === 'failed' && task.error && !isSelected && (
                    <div className="mt-1.5 text-[11px] text-red-400 truncate" title={task.error}>
                      {task.error}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-xs">
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                        <span className="text-text-muted">{t?.task?.id || 'Task ID'}</span>
                        <span className="font-mono text-text-secondary select-all">{task.taskId}</span>

                        <span className="text-text-muted">{t?.task?.status || 'Status'}</span>
                        <span className={STATUS_COLORS[st] || ''}>{getStatusLabel(st, t)}</span>

                        {task.agentId && <>
                          <span className="text-text-muted">{t?.task?.agent || 'Agent'}</span>
                          <button
                            onClick={e => { e.stopPropagation(); handleNavigateToAgent(task.agentId!); }}
                            className="text-cyan-400 hover:underline text-start"
                          >{task.agentId}</button>
                        </>}

                        {task.sessionKey && <>
                          <span className="text-text-muted">{t?.task?.session || 'Session'}</span>
                          <button
                            onClick={e => { e.stopPropagation(); handleNavigateToSession(task.sessionKey!); }}
                            className="text-cyan-400 hover:underline text-start font-mono"
                          >{task.sessionKey}</button>
                        </>}

                        {task.source && <>
                          <span className="text-text-muted">{t?.task?.source || 'Source'}</span>
                          <span>{getSourceLabel(task.source, t)}</span>
                        </>}

                        <span className="text-text-muted">{t?.task?.startedAt || 'Started'}</span>
                        <span>{task.startedAt ? new Date(task.startedAt).toLocaleString() : '—'}</span>

                        <span className="text-text-muted">{t?.task?.updatedAt || 'Updated'}</span>
                        <span>{task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '—'}</span>

                        <span className="text-text-muted">{t?.task?.duration || 'Duration'}</span>
                        <span>{formatDuration(task.startedAt, task.completedAt, task.updatedAt)}</span>

                        {task.lastHeartbeat && <>
                          <span className="text-text-muted">{t?.task?.lastHeartbeat || 'Last Heartbeat'}</span>
                          <span className={stale ? 'text-amber-400' : ''}>
                            {formatRelativeTime(task.lastHeartbeat, t)}
                            {stale && <span className="ms-1">⚠</span>}
                          </span>
                        </>}

                        {task.runId && <>
                          <span className="text-text-muted">Run ID</span>
                          <span className="font-mono text-text-secondary">{task.runId}</span>
                        </>}

                        {task.parentTaskId && <>
                          <span className="text-text-muted">Parent Task</span>
                          <span className="font-mono text-text-secondary">{task.parentTaskId}</span>
                        </>}
                      </div>

                      {task.error && (
                        <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <div className="text-[11px] text-red-400 font-medium mb-1">{t?.task?.error || 'Error'}</div>
                          <div className="text-[11px] text-red-300 font-mono whitespace-pre-wrap break-all">{task.error}</div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-2">
                        {task.sessionKey && (
                          <button
                            onClick={e => { e.stopPropagation(); handleNavigateToSession(task.sessionKey!); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">forum</span>
                            {t?.task?.viewSession || 'View Session'}
                          </button>
                        )}
                        {task.agentId && (
                          <button
                            onClick={e => { e.stopPropagation(); handleNavigateToAgent(task.agentId!); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">robot_2</span>
                            {t?.task?.viewAgent || 'View Agent'}
                          </button>
                        )}
                        {(st === 'running' || st === 'queued') && (
                          <button
                            onClick={e => { e.stopPropagation(); handleCancel(task.taskId); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            {t?.task?.cancel || 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
