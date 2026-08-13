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
} from 'lucide-react';

interface SidebarProps {
  tables: TableInfo[];
  selectedTable: TableInfo | null;
  onSelectTable: (table: TableInfo) => void;
  activeView: 'overview' | 'table' | 'sql';
  setActiveView: (view: 'overview' | 'table' | 'sql') => void;
  isLoading: boolean;
  currentDatabaseName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  activeView,
  setActiveView,
  isLoading,
  currentDatabaseName,
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
    <aside className="w-64 md:w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0 glass-panel">
      {/* Primary Workspace Navigation */}
      <div className="p-3 border-b border-slate-800/80 space-y-1">
        <span className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
          WORKSPACE
        </span>

        <button
          onClick={() => setActiveView('overview')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-400 border border-cyan-800/60 shadow-lg shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Overview</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        <button
          onClick={() => setActiveView('sql')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'sql'
              ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-400 border border-purple-800/60 shadow-lg shadow-purple-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>SQL Workspace</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* Tables Section Header */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span className="flex items-center space-x-1.5 uppercase text-[10px] font-bold tracking-wider text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tables ({filteredTables.length})</span>
          </span>
          {schemas.length > 1 && (
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              className="bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none"
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500"
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
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <DatabaseZap className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
            <p>No tables found matching query.</p>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left group ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate min-w-0 pr-1">
                  <Table
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{table.table_name}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700/60 font-mono">
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
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate max-w-[140px] font-mono text-slate-300">
            {currentDatabaseName || 'PostgreSQL'}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">
          Connected
        </span>
      </div>
    </aside>
  );
};
