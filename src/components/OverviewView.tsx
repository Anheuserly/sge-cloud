'use client';

import React from 'react';
import { DatabaseOverview, TableInfo } from '@/types/database';
import {
  Server,
  Layers,
  HardDrive,
  Activity,
  Terminal,
  Table as TableIcon,
  ArrowUpRight,
  Cpu,
  CloudOff,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OverviewViewProps {
  overview: DatabaseOverview | null;
  topTables: any[];
  tables: TableInfo[];
  onSelectTable: (table: TableInfo) => void;
  onOpenSql: () => void;
  isLoading: boolean;
  presetName: string;
  connectionError?: string;
  onRefresh: () => void;
  onOpenCreateTable: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  topTables,
  tables,
  onSelectTable,
  onOpenSql,
  isLoading,
  presetName,
  connectionError,
  onRefresh,
  onOpenCreateTable,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-slate-800/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-lg bg-slate-800/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 md:p-10">
        <section className="w-full max-w-2xl overflow-hidden rounded-lg border border-[#222] bg-slate-900/70 shadow-2xl shadow-black/20">
          <div className="border-b border-[#222] bg-[#000000] px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Connection status
            </p>
          </div>
          <div className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:p-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <CloudOff className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-white">Database connection unavailable</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                SGE Cloud could not reach {presetName}. Check the VPS connection settings or select another database from the sidebar.
              </p>
              {connectionError && (
                <p className="mt-3 max-w-xl rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 font-mono text-xs leading-5 text-rose-200">
                  {connectionError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-white text-black px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry connection
                </button>
                <div className="flex h-10 items-center rounded-lg border border-[#222] bg-[#000000]/60 px-3 font-mono text-xs text-neutral-400">
                  VPS / PostgreSQL
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Bar chart formatting data
  const chartData = topTables.map((t) => ({
    name: t.table_name.length > 14 ? t.table_name.substring(0, 14) + '...' : t.table_name,
    fullName: t.table_name,
    sizeMB: Number((t.size_bytes / (1024 * 1024)).toFixed(2)),
    rowCount: t.row_count,
    sizeStr: t.size,
  }));

  const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#000000] border border-[#222] shadow-sm p-6 rounded-lg border border-[#222]">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {presetName} Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950/80 text-neutral-300 border border-cyan-800/60">
              {overview.databaseName}
            </span>
          </div>
          <p className="text-neutral-400 text-xs mt-1">
            Real-time PostgreSQL metrics, storage distribution, and active collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={onOpenCreateTable}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Table</span>
          </button>
          <button
            onClick={onOpenSql}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#000000] hover:bg-[#1a1a1a] text-white text-xs font-semibold border border-[#333] transition-all"
          >
            <Terminal className="w-4 h-4 text-neutral-300" />
            <span>Open SQL Console</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Tables */}
        <div className="bg-[#000000] border border-[#222] shadow-sm p-5 rounded-lg border border-[#222]/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white text-black/5 rounded-full blur-2xl group-hover:bg-white text-black/10 transition-all" />
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Total Tables</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 text-neutral-300 border border-cyan-800/40">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalTables}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">Active database relations</p>
          </div>
        </div>

        {/* Card 2: Total Estimated Rows */}
        <div className="bg-[#000000] border border-[#222] shadow-sm p-5 rounded-lg border border-[#222]/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Total Records</span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalEstimatedRows.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">Live tuple records</p>
          </div>
        </div>

        {/* Card 3: Database Storage Size */}
        <div className="bg-[#000000] border border-[#222] shadow-sm p-5 rounded-lg border border-[#222]/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Storage Size</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalSize}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">Physical disk allocation</p>
          </div>
        </div>

        {/* Card 4: Active Connections */}
        <div className="bg-[#000000] border border-[#222] shadow-sm p-5 rounded-lg border border-[#222]/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Active Connections</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.activeConnections}
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Pool connected</span>
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Top Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Bar Chart */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#222] shadow-sm p-6 rounded-lg border border-[#222] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Tables by Storage (MB)</h3>
              <p className="text-xs text-neutral-400">Disk footprint per relation</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-[#333] p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.fullName}</p>
                          <p className="text-neutral-300 font-mono">Size: {data.sizeStr}</p>
                          <p className="text-neutral-300 font-mono">Rows: {data.rowCount.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sizeMB" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System & Engine Details */}
        <div className="bg-[#000000] border border-[#222] shadow-sm p-6 rounded-lg border border-[#222] space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-white">Database Engine Specs</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#222] space-y-1">
              <span className="text-[10px] uppercase text-neutral-400 tracking-wider">Engine Version</span>
              <p className="text-slate-200 font-mono text-[11px] truncate" title={overview.version}>
                {overview.version}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#222] space-y-1">
              <span className="text-[10px] uppercase text-neutral-400 tracking-wider">Database Name</span>
              <p className="text-neutral-300 font-mono font-semibold">{overview.databaseName}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#222] space-y-1">
              <span className="text-[10px] uppercase text-neutral-400 tracking-wider">Total Relation Size</span>
              <p className="text-emerald-400 font-mono font-semibold">{overview.totalSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Quick Access Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Database Tables ({tables.length})</h3>
          <span className="text-xs text-neutral-400">Click any table to inspect schema and modify rows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <button
              key={`${table.table_schema}.${table.table_name}`}
              onClick={() => onSelectTable(table)}
              className="bg-[#000000] border border-[#222] shadow-sm p-4 rounded-lg border border-[#222] hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all text-left group flex items-start justify-between"
            >
              <div className="space-y-1.5 min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <TableIcon className="w-4 h-4 text-neutral-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {table.table_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
                  <span>{table.column_count} cols</span>
                  <span>•</span>
                  <span>{table.total_size}</span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-[#333]">
                  {table.estimated_rows.toLocaleString()} rows
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
