'use client';

import React from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle, Plus, Terminal, ChevronDown } from 'lucide-react';
import { DATABASE_PRESETS } from '@/lib/constants';

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
  dynamicDatabases?: { id: string; name: string }[];
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
  dynamicDatabases = [],
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 glass-panel sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              SGE CLOUD
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            Database Visualizer & Data Manager Console
          </p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'sql'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Workspace</span>
        </button>
      </div>

      {/* Right Area: Database Selector Outside Side Nav */}
      <div className="flex items-center space-x-3">
        {/* Database Selector Dropdown - OUTSIDE SIDE NAV */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 px-3 rounded-xl border border-slate-700/80 shadow-md">
          <Database className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Active Database
            </span>
            <select
              value={currentPreset}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  onOpenCustomModal();
                } else {
                  onSelectPreset(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none appearance-none pr-5 py-0.5"
            >
              {DATABASE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-100 font-semibold">
                  {preset.name} ({preset.id})
                </option>
              ))}

              {dynamicDatabases
                .filter((d) => !DATABASE_PRESETS.some((p) => p.id === d.id))
                .map((db) => (
                  <option key={db.id} value={db.id} className="bg-slate-900 text-slate-100 font-semibold">
                    {db.name}
                  </option>
                ))}

              <option value="custom" className="bg-slate-900 text-cyan-400 font-bold">
                + Add Custom URI...
              </option>
            </select>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-4" />
        </div>

        {/* Connection Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isTesting
              ? 'bg-amber-950/50 text-amber-400 border-amber-800/50'
              : isConnected
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
          }`}
        >
          {isTesting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="hidden sm:inline">
            {isTesting ? 'Connecting...' : isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Custom URI Button */}
        <button
          onClick={onOpenCustomModal}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all text-xs font-semibold"
          title="Connect to custom database URL"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Connection</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all"
          title="Refresh database tables and schema"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
