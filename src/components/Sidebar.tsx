'use client';

import React, { useState } from 'react';
import { TableInfo } from '@/types/database';
import {
  Table,
  Search,
  Server,
  Terminal,
  Database,
  Layers,
  ChevronRight,
  DatabaseZap,
  ShieldCheck,
} from 'lucide-react';

type ActiveView = 'overview' | 'table' | 'sql' | 'platform';

interface SidebarProps {
  tables: TableInfo[];
  selectedTable: TableInfo | null;
  onSelectTable: (table: TableInfo) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isLoading: boolean;
  currentDatabaseName?: string;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  activeView,
  setActiveView,
  isLoading,
  currentDatabaseName,
  isConnected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<string>('all');

  // Unique schemas in current database
  const schemas = Array.from(new Set(tables.map((t) => t.table_schema)));

  const filteredTables = tables.filter((t) => {
    const matchesSearch = t.table_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchema = selectedSchema === 'all' || t.table_schema === selectedSchema;
    return matchesSearch && matchesSchema;
  });

  return (
    <aside className="w-64 md:w-72 bg-slate-900/95 border-r border-[#222] flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0 glass-panel">
      {/* Primary Workspace Navigation */}
      <div className="p-3 border-b border-[#222]/80 space-y-1">
        <span className="px-2 text-[10px] uppercase font-bold tracking-wider text-neutral-500">
          WORKSPACE
        </span>

        <button
          onClick={() => setActiveView('overview')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-neutral-300 border border-cyan-800/60 shadow-lg shadow-cyan-950/40'
              : 'text-neutral-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Server className="w-4 h-4 text-neutral-300" />
            <span>Overview</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => setActiveView('sql')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'sql'
              ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-400 border border-purple-800/60 shadow-lg shadow-purple-950/40'
              : 'text-neutral-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>SQL Workspace</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => setActiveView('platform')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'platform'
              ? 'bg-gradient-to-r from-emerald-950 to-cyan-950 text-emerald-300 border border-emerald-800/60 shadow-lg shadow-emerald-950/40'
              : 'text-neutral-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Platform Access</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* Tables Section Header */}
      <div className="p-3 border-b border-[#222]/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
          <span className="flex items-center space-x-1.5 uppercase text-[10px] font-bold tracking-wider text-neutral-400">
            <Layers className="w-3.5 h-3.5 text-neutral-300" />
            <span>Tables ({filteredTables.length})</span>
          </span>
          {schemas.length > 1 && (
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              className="bg-slate-800 text-[10px] text-neutral-300 px-1.5 py-0.5 rounded border border-[#333] focus:outline-none"
            >
              <option value="all">All Schemas</option>
              {schemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Filter tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:text-neutral-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table List Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-8 rounded-lg bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 space-y-2">
            <DatabaseZap className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
            <p>{isConnected ? 'No tables found matching query.' : 'Connect to a real PostgreSQL database to load tables.'}</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const isSelected =
              activeView === 'table' &&
              selectedTable?.table_name === table.table_name &&
              selectedTable?.table_schema === table.table_schema;

            return (
              <button
                key={`${table.table_schema}.${table.table_name}`}
                onClick={() => {
                  onSelectTable(table);
                  setActiveView('table');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left group ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium border border-cyan-500/40 shadow-sm'
                    : 'text-neutral-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate min-w-0 pr-1">
                  <Table
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? 'text-neutral-300' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  />
                  <span className="truncate">{table.table_name}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/90 text-neutral-400 border border-[#333]/60 font-mono">
                    {table.estimated_rows > 999
                      ? `${(table.estimated_rows / 1000).toFixed(1)}k`
                      : table.estimated_rows}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#222]/80 text-[11px] text-neutral-500 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-neutral-300" />
          <span className="truncate max-w-[140px] font-mono text-neutral-300">
            {isConnected ? currentDatabaseName || 'PostgreSQL' : 'No database'}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
          isConnected
            ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60'
            : 'text-rose-400 bg-rose-950/80 border-rose-800/60'
        }`}>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>
    </aside>
  );
};
