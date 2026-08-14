'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Globe2,
  Server,
  RefreshCw,
  Ban,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface PlatformApplication {
  id: string;
  project_key: string;
  app_key: string;
  name: string;
  app_type: string;
  environment: string;
  status: string;
  notes?: string;
  origins: string[];
  identifiers: { platform: string; identifier: string }[];
  apiKeys: PlatformKey[];
}

interface PlatformKey {
  id: string;
  key_prefix: string;
  name: string;
  environment: string;
  status: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  scopes: string[];
}

interface PlatformProject {
  id: string;
  project_key: string;
  name: string;
  database_key: string;
  status: string;
}

interface PlatformAuditLog {
  id: string;
  project_key?: string;
  action: string;
  endpoint?: string;
  result: string;
  ip_address?: string;
  origin?: string;
  created_at: string;
}

interface PlatformState {
  projects: PlatformProject[];
  applications: PlatformApplication[];
  auditLogs: PlatformAuditLog[];
  availableScopes: string[];
  appTypes: string[];
}

interface PlatformAccessViewProps {
  onShowToast: (title: string, type?: 'success' | 'error' | 'info', description?: string) => void;
}

const defaultKeyName = 'Production access key';

export const PlatformAccessView: React.FC<PlatformAccessViewProps> = ({ onShowToast }) => {
  const [state, setState] = useState<PlatformState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [keyName, setKeyName] = useState(defaultKeyName);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['amcmep.read']);
  const [newKey, setNewKey] = useState('');

  const selectedApp = useMemo(
    () => state?.applications.find((app) => app.id === selectedAppId),
    [state, selectedAppId]
  );

  const loadAccess = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/platform/access');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load platform access.');
      setState(json);
      setSelectedAppId((current) => current || json.applications?.[0]?.id || '');
    } catch (error: any) {
      onShowToast('Platform access error', 'error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccess();
  }, []);

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    );
  };

  const createKey = async () => {
    if (!selectedAppId || selectedScopes.length === 0) {
      onShowToast('Select an app and at least one scope', 'error');
      return;
    }

    try {
      const res = await fetch('/api/platform/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_key',
          applicationId: selectedAppId,
          name: keyName || defaultKeyName,
          scopes: selectedScopes,
          environment: selectedApp?.environment || 'production',
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create key.');
      setNewKey(json.apiKey);
      onShowToast('API key created', 'success', 'Copy it now. It will not be shown again.');
      await loadAccess();
    } catch (error: any) {
      onShowToast('Key creation failed', 'error', error.message);
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const res = await fetch('/api/platform/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_key', keyId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to revoke key.');
      onShowToast('API key revoked', 'success', 'Requests using this key are now blocked.');
      await loadAccess();
    } catch (error: any) {
      onShowToast('Revoke failed', 'error', error.message);
    }
  };

  const copyNewKey = async () => {
    await navigator.clipboard.writeText(newKey);
    onShowToast('Copied API key', 'success');
  };

  if (isLoading || !state) {
    return (
      <div className="p-6 md:p-8 space-y-5">
        <div className="h-28 rounded-xl bg-slate-800/40 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => <div key={item} className="h-72 rounded-xl bg-slate-800/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <section className="glass-card rounded-xl border border-slate-800 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">SGE Platform Access</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Application Access Control</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              Manage project apps, allowed domains, mobile identifiers, hashed API keys, scoped permissions, revocation, expiry, and audit activity.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAccess}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="glass-card rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            Projects
          </div>
          <div className="mt-4 space-y-3">
            {state.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-white">{project.project_key}</p>
                    <p className="mt-1 text-xs text-slate-400">{project.name}</p>
                  </div>
                  <span className="rounded border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-slate-500">DB: {project.database_key}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card lg:col-span-2 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            Create Scoped API Key
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Application</span>
              <select
                value={selectedAppId}
                onChange={(event) => setSelectedAppId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {state.applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.app_key})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Key name</span>
              <input
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Expires at</span>
              <input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Selected app</span>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                {selectedApp ? `${selectedApp.app_type} / ${selectedApp.environment}` : 'No app selected'}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Permissions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.availableScopes.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-mono transition ${
                    selectedScopes.includes(scope)
                      ? 'border-cyan-600 bg-cyan-950/80 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={createKey}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <KeyRound className="h-4 w-4" />
              Generate Key
            </button>
            {newKey && (
              <button
                type="button"
                onClick={copyNewKey}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-2 text-left font-mono text-xs text-amber-100"
              >
                <Copy className="h-4 w-4 shrink-0" />
                {newKey}
              </button>
            )}
          </div>
        </section>
      </div>

      <section className="glass-card rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Globe2 className="h-4 w-4 text-cyan-400" />
          Registered Applications
        </div>
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {state.applications.map((app) => (
            <article key={app.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{app.name}</h2>
                    <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      {app.app_key}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{app.app_type} / {app.project_key}</p>
                  {app.notes && <p className="mt-2 text-xs text-slate-500">{app.notes}</p>}
                </div>
                <span className="rounded border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {app.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <Globe2 className="h-3.5 w-3.5" />
                    Allowed domains
                  </p>
                  <div className="space-y-1">
                    {app.origins.length ? app.origins.map((origin) => (
                      <p key={origin} className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">{origin}</p>
                    )) : <p className="text-xs text-slate-500">None</p>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile IDs
                  </p>
                  <div className="space-y-1">
                    {app.identifiers.length ? app.identifiers.map((item) => (
                      <p key={`${item.platform}:${item.identifier}`} className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">
                        {item.platform}: {item.identifier}
                      </p>
                    )) : <p className="text-xs text-slate-500">None</p>}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Server className="h-3.5 w-3.5" />
                  API keys
                </p>
                <div className="space-y-2">
                  {app.apiKeys.length ? app.apiKeys.map((key) => (
                    <div key={key.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{key.name}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">{key.key_prefix}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${
                            key.status === 'active'
                              ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                              : 'border-rose-800 bg-rose-950/60 text-rose-300'
                          }`}>
                            {key.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {key.status}
                          </span>
                          {key.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => revokeKey(key.id)}
                              className="inline-flex items-center gap-1 rounded border border-rose-900 bg-rose-950/40 px-2 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-900/50"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {key.scopes.map((scope) => (
                          <span key={scope} className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">{scope}</span>
                        ))}
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-500">No API keys yet.</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          Recent Audit Logs
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Time</th>
                <th className="py-2 pr-3 font-semibold">Project</th>
                <th className="py-2 pr-3 font-semibold">Action</th>
                <th className="py-2 pr-3 font-semibold">Result</th>
                <th className="py-2 pr-3 font-semibold">Origin/IP</th>
              </tr>
            </thead>
            <tbody>
              {state.auditLogs.length ? state.auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-900 text-slate-300">
                  <td className="py-2 pr-3 font-mono text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono">{log.project_key || '-'}</td>
                  <td className="py-2 pr-3 font-mono">{log.action}</td>
                  <td className="py-2 pr-3 font-mono">{log.result}</td>
                  <td className="py-2 pr-3 font-mono text-[11px]">{log.origin || log.ip_address || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td className="py-5 text-slate-500" colSpan={5}>No audit events yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
