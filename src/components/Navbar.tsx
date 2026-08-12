'use client';

import React from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle, Plus, Terminal } from 'lucide-react';
import { DATABASE_PRESETS } from '@/lib/db';

interface NavbarProps {
  currentPreset: string;
  customUrl: string;
  isConnected: boolean;
  isTesting: boolean;
  onSelectPreset: (presetId: string) => void;
  onOpenCustomModal: () => void;
  onRefresh: () => void;
  activeView: 'overview' | 'table' | 'sql';
  setActiveView: (view: 'overview' | 'table' | 'sql') => void;
  dbName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPreset,
  customUrl,
  isConnected,
  isTesting,
  onSelectPreset,
  onOpenCustomModal,
  onRefresh,
  activeView,
  setActiveView,
  dbName,
}) => {
  const selectedPresetObj = DATABASE_PRESETS.find((p) => p.id === currentPreset);

  return (
    <header className="h-16 border-b border-slate-800/80 glass-panel sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Workspace Title */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              SGE CLOUD
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            Multi-Database & SGE DataHub Visualizer
          </p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveView('sql')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'sql'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Workspace</span>
        </button>
      </div>

      {/* Database Preset Selector & Connection Status */}
      <div className="flex items-center space-x-3">
        {/* Connection status pill */}
        <div
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isTesting
              ? 'bg-amber-950/50 text-amber-400 border-amber-800/50'
              : isConnected
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
              : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
          }`}
        >
          {isTesting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isTesting ? 'Connecting...' : isConnected ? dbName || 'Connected' : 'Disconnected'}</span>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="relative">
          <select
            value={currentPreset}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                onOpenCustomModal();
              } else {
                onSelectPreset(e.target.value);
              }
            }}
            className="glass-input pl-3 pr-8 py-1.5 text-xs font-medium rounded-xl cursor-pointer appearance-none bg-slate-900 border-slate-700/60 focus:ring-2 focus:ring-cyan-500 text-slate-200"
          >
            {DATABASE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                {preset.name} ({preset.id})
              </option>
            ))}
            <option value="custom" className="bg-slate-900 text-cyan-400 font-semibold">
              + Add Custom DB URL...
            </option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Custom DB Button */}
        <button
          onClick={onOpenCustomModal}
          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all text-xs flex items-center space-x-1"
          title="Connect to custom database URL"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span className="hidden xl:inline text-xs">Custom URI</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all"
          title="Refresh database schema and tables"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
