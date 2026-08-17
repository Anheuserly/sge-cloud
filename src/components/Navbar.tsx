'use client';

import React from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle, Terminal, ChevronDown, ShieldCheck } from 'lucide-react';
import { DatabasePreset } from '@/types/database';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ActiveView = 'overview' | 'table' | 'sql';

interface NavbarProps {
  currentPreset: string;
  isConnected: boolean;
  isTesting: boolean;
  onSelectPreset: (presetId: string) => void;
  onRefresh: () => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  dbName?: string;
  databasePresets: Pick<DatabasePreset, 'id' | 'name'>[];
  user?: { email: string; role: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPreset,
  isConnected,
  isTesting,
  onSelectPreset,
  onRefresh,
  activeView,
  setActiveView,
  dbName,
  databasePresets,
  user,
}) => {
  const selectorValue = currentPreset || '';
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {}
  };

  return (
    <header className="h-16 border-b border-[#222]/80 glass-panel sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              SGE CLOUD
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-neutral-300 border border-cyan-800/50">
              v1.0 Cloud
            </span>
          </div>
          <p className="text-xs text-neutral-400 hidden md:block">
            Database Visualizer & Data Manager Console
          </p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-lg border border-[#222]">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveView('sql')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'sql'
              ? 'bg-[#1a1a1a] text-white shadow-sm border border-[#333]'
              : 'text-neutral-400 hover:text-white hover:bg-[#111] border border-transparent'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>SQL Run</span>
        </button>
      </div>

      {/* Right Area: Database Selector Outside Side Nav */}
      <div className="flex items-center space-x-3">
        {/* Database Selector Dropdown - OUTSIDE SIDE NAV */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 px-3 rounded-lg border border-[#333]/80 shadow-md">
          <Database className="w-4 h-4 text-neutral-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
              Active Database
            </span>
            <select
              value={selectorValue}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  return;
                } else if (e.target.value) {
                  onSelectPreset(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none appearance-none pr-5 py-0.5"
            >
              {databasePresets.length === 0 && (
                <option value="" className="bg-slate-900 text-amber-300 font-semibold">
                  No real database configured
                </option>
              )}

              {databasePresets.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-100 font-semibold">
                  {preset.name} ({preset.id})
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 pointer-events-none -ml-4" />
        </div>

        {/* Connection Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
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

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-[#333]/60 transition-all"
          title="Refresh database tables and schema"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-neutral-300' : ''}`} />
        </button>

        {/* User Dropdown / Info */}
        {user && (
          <div className="flex items-center space-x-3 ml-2 border-l border-[#222] pl-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-white">{user.email}</span>
              <span className="text-[10px] text-neutral-500 capitalize">{user.role}</span>
            </div>
            {user.role === 'admin' && (
              <Link href="/developer" className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-[#333]">
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}
            <button onClick={handleLogout} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors px-2 py-1 rounded bg-rose-950/30 border border-rose-900/50">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
