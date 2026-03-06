import React, { useState, useEffect } from 'react';
import { serviceApi, gatewayApi } from '../services/api';
import { useToast } from '../components/Toast';

interface ServiceManagementProps {
  s: any;
}

export const ServiceManagement: React.FC<ServiceManagementProps> = ({ s }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<{ openclaw_installed: boolean; clawdeckx_installed: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await serviceApi.status();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load service status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleInstall = async (service: 'openclaw' | 'clawdeckx') => {
    setLoading(true);
    try {
      if (service === 'openclaw') {
        await gatewayApi.daemonInstall();
        toast(s.serviceInstalled || 'OpenClaw service installed', 'success');
      } else {
        await serviceApi.installClawDeckX();
        toast(s.serviceInstalled || 'ClawDeckX service installed', 'success');
      }
      await loadStatus();
    } catch (err: any) {
      toast(err.message || 'Installation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (service: 'openclaw' | 'clawdeckx') => {
    setLoading(true);
    try {
      if (service === 'openclaw') {
        await gatewayApi.daemonUninstall();
        toast(s.serviceUninstalled || 'OpenClaw service uninstalled', 'success');
      } else {
        await serviceApi.uninstallClawDeckX();
        toast(s.serviceUninstalled || 'ClawDeckX service uninstalled', 'success');
      }
      await loadStatus();
    } catch (err: any) {
      toast(err.message || 'Uninstallation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!status) return null;

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
      <h3 className="text-[13px] font-bold text-slate-700 dark:text-white/70">
        {s.serviceManagement || 'System Service Management'}
      </h3>

      {/* OpenClaw Service */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">settings_applications</span>
          <div>
            <div className="text-[12px] font-medium">OpenClaw</div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              {status.openclaw_installed ? (s.serviceInstalled || 'Installed') : (s.serviceNotInstalled || 'Not installed')}
            </div>
          </div>
        </div>
        <button
          onClick={() => status.openclaw_installed ? handleUninstall('openclaw') : handleInstall('openclaw')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            status.openclaw_installed
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary hover:bg-primary/90 text-white'
          } disabled:opacity-50`}
        >
          {status.openclaw_installed ? (s.uninstall || 'Uninstall') : (s.install || 'Install')}
        </button>
      </div>

      {/* ClawDeckX Service */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <div>
            <div className="text-[12px] font-medium">ClawDeckX</div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              {status.clawdeckx_installed ? (s.serviceInstalled || 'Installed') : (s.serviceNotInstalled || 'Not installed')}
            </div>
          </div>
        </div>
        <button
          onClick={() => status.clawdeckx_installed ? handleUninstall('clawdeckx') : handleInstall('clawdeckx')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            status.clawdeckx_installed
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary hover:bg-primary/90 text-white'
          } disabled:opacity-50`}
        >
          {status.clawdeckx_installed ? (s.uninstall || 'Uninstall') : (s.install || 'Install')}
        </button>
      </div>
    </div>
  );
};
