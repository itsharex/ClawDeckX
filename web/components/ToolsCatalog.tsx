import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { getTranslation } from '../locales';
import type { LocaleNamespace } from '../locales/types';
import { gwApi } from '../services/api';

interface ToolEntry {
  id: string;
  label: string;
  description: string;
  source: 'core' | 'plugin';
  pluginId?: string;
  optional?: boolean;
  defaultProfiles: string[];
}

interface ToolGroup {
  id: string;
  label: string;
  source: 'core' | 'plugin';
  pluginId?: string;
  tools: ToolEntry[];
}

interface ToolProfile {
  id: string;
  label: string;
}

interface CatalogData {
  agentId: string;
  profiles: ToolProfile[];
  groups: ToolGroup[];
}

interface ToolsCatalogProps {
  language: Language;
}

const ToolsCatalog: React.FC<ToolsCatalogProps> = ({ language }) => {
  const t = useMemo(() => {
    const trans = getTranslation(language);
    return trans.skillsMarket || trans.sk || {};
  }, [language]) as LocaleNamespace;

  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'core' | 'plugin'>('all');
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await gwApi.toolsCatalog({ includePlugins: true });
      setData(result);
      // Expand all groups by default
      setExpandedGroups(new Set(result.groups.map(g => g.id)));
    } catch (err: any) {
      setError(err?.message || t.toolsCatalogLoadFail || 'Failed to load tools catalog');
    } finally {
      setLoading(false);
    }
  }, [t.toolsCatalogLoadFail]);

  useEffect(() => { load(); }, [load]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    return data.groups
      .filter(g => sourceFilter === 'all' || g.source === sourceFilter)
      .map(g => {
        const tools = g.tools.filter(tool => {
          if (search) {
            const q = search.toLowerCase();
            if (!tool.id.toLowerCase().includes(q) &&
                !tool.label.toLowerCase().includes(q) &&
                !tool.description.toLowerCase().includes(q)) return false;
          }
          if (profileFilter !== 'all') {
            if (!tool.defaultProfiles.includes(profileFilter)) return false;
          }
          return true;
        });
        return { ...g, tools };
      })
      .filter(g => g.tools.length > 0);
  }, [data, search, sourceFilter, profileFilter]);

  const totalTools = useMemo(() => data?.groups.reduce((s, g) => s + g.tools.length, 0) || 0, [data]);
  const coreCount = useMemo(() => data?.groups.filter(g => g.source === 'core').reduce((s, g) => s + g.tools.length, 0) || 0, [data]);
  const pluginCount = useMemo(() => data?.groups.filter(g => g.source === 'plugin').reduce((s, g) => s + g.tools.length, 0) || 0, [data]);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const profileColor = useCallback((pid: string) => {
    if (pid === 'full') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    if (pid === 'coding') return 'bg-blue-500/15 text-blue-700 dark:text-blue-300';
    if (pid === 'messaging') return 'bg-violet-500/15 text-violet-700 dark:text-violet-300';
    if (pid === 'minimal') return 'bg-slate-500/15 text-slate-700 dark:text-slate-300';
    return 'bg-primary/15 text-primary';
  }, []);

  const getProfileLabel = useCallback((profile: string) => {
    const key = profile.trim().toLowerCase();
    if (key === 'minimal') return t.toolsCatalogProfileMinimal || 'Minimal';
    if (key === 'coding') return t.toolsCatalogProfileCoding || 'Coding';
    if (key === 'messaging') return t.toolsCatalogProfileMessaging || 'Messaging';
    if (key === 'full') return t.toolsCatalogProfileFull || 'Full';
    return profile;
  }, [t.toolsCatalogProfileCoding, t.toolsCatalogProfileFull, t.toolsCatalogProfileMessaging, t.toolsCatalogProfileMinimal]);

  const getSourceLabel = useCallback((source: ToolGroup['source']) => {
    return source === 'core'
      ? (t.toolsCatalogCore || 'core')
      : (t.toolsCatalogPlugin || 'plugin');
  }, [t.toolsCatalogCore, t.toolsCatalogPlugin]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="material-symbols-outlined text-[28px] text-primary/60 animate-spin">progress_activity</span>
        <p className="text-[11px] text-slate-400 dark:text-white/40">{t.toolsCatalogLoading || 'Loading tools catalog...'}</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="material-symbols-outlined text-[28px] text-red-400">error</span>
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
        <button onClick={load} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
          {t.toolsCatalogRetry || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary/70">build</span>
          <span className="text-[13px] font-bold text-slate-700 dark:text-white/80">{t.toolsCatalogTitle || 'Tools Catalog'}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/50 font-bold">
            {totalTools} {t.toolsCatalogTotal || 'tools'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
            {coreCount} {t.toolsCatalogCore || 'core'}
          </span>
          {pluginCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold">
              {pluginCount} {t.toolsCatalogPlugin || 'plugin'}
            </span>
          )}
        </div>
        {data?.agentId && (
          <span className="text-[10px] text-slate-400 dark:text-white/30 ms-auto">
            Agent: <span className="font-bold">{data.agentId}</span>
          </span>
        )}
        <button onClick={load} disabled={loading} className="ms-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-40">
          <span className={`material-symbols-outlined text-[14px] text-slate-500 dark:text-white/40 ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'progress_activity' : 'refresh'}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="material-symbols-outlined text-[14px] text-slate-400 dark:text-white/30 absolute start-2.5 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.toolsCatalogSearch || 'Search tools...'}
            className="w-full h-8 ps-8 pe-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-[11px] text-slate-700 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        {/* Source filter */}
        <div className="flex items-center gap-1">
          {(['all', 'core', 'plugin'] as const).map(f => (
            <button key={f} onClick={() => setSourceFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${sourceFilter === f ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/[0.06]'}`}>
              {f === 'all' ? (t.toolsCatalogFilterAll || 'All') : f === 'core' ? (t.toolsCatalogCore || 'Core') : (t.toolsCatalogPlugin || 'Plugin')}
            </button>
          ))}
        </div>
        {/* Profile filter */}
        {data?.profiles && data.profiles.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 dark:text-white/30">{t.toolsCatalogProfile || 'Profile'}:</span>
            <button onClick={() => setProfileFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${profileFilter === 'all' ? 'bg-primary/15 text-primary' : 'text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/[0.04]'}`}>
              {t.toolsCatalogFilterAll || 'All'}
            </button>
            {data.profiles.map(p => (
              <button key={p.id} onClick={() => setProfileFilter(p.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${profileFilter === p.id ? `${profileColor(p.id)} ring-1 ring-current/20` : 'text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/[0.04]'}`}>
                {getProfileLabel(p.label || p.id)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tool groups */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="material-symbols-outlined text-[24px] text-slate-300 dark:text-white/20">search_off</span>
          <p className="text-[11px] text-slate-400 dark:text-white/35">{t.toolsCatalogNoResults || 'No tools match your filters'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map(group => (
            <div key={group.id} className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
              {/* Group header */}
              <button onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-start">
                <span className={`material-symbols-outlined text-[14px] transition-transform ${expandedGroups.has(group.id) ? 'rotate-90' : ''}`}>
                  chevron_right
                </span>
                <span className={`material-symbols-outlined text-[14px] ${group.source === 'core' ? 'text-emerald-500' : 'text-violet-500'}`}>
                  {group.source === 'core' ? 'verified' : 'extension'}
                </span>
                <span className="text-[12px] font-bold text-slate-700 dark:text-white/80 flex-1">{group.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${group.source === 'core' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}>
                  {getSourceLabel(group.source)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-white/30">{group.tools.length}</span>
              </button>
              {/* Tool list */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-slate-100 dark:border-white/[0.04] p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.tools.map(tool => (
                    <div key={tool.id} className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] p-3 hover:border-primary/30 transition-all flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary/60 shrink-0">handyman</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate">{tool.label}</span>
                        <code className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40 font-mono shrink-0">{tool.id}</code>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 leading-relaxed line-clamp-2 mb-2">{tool.description}</p>
                      <div className="flex items-center gap-1 mt-auto flex-wrap">
                        {tool.optional && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                            {t.toolsCatalogOptional || 'optional'}
                          </span>
                        )}
                        {tool.pluginId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            {tool.pluginId}
                          </span>
                        )}
                        {tool.defaultProfiles.map(p => (
                          <span key={p} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${profileColor(p)}`}>{getProfileLabel(p)}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsCatalog;
