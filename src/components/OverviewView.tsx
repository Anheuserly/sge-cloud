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
  Database,
  Cpu,
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
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  topTables,
  tables,
  onSelectTable,
  onOpenSql,
  isLoading,
  presetName,
}) => {
  if (isLoading || !overview) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse" />
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {presetName} Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              {overview.databaseName}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time PostgreSQL metrics, storage distribution, and active collections
          </p>
        </div>

        <button
          onClick={onOpenSql}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all self-start md:self-auto"
        >
          <Terminal className="w-4 h-4" />
          <span>Open SQL Console</span>
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Tables */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Tables</span>
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalTables}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active database relations</p>
          </div>
        </div>

        {/* Card 2: Total Estimated Rows */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Records</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalEstimatedRows.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Live tuple records</p>
          </div>
        </div>

        {/* Card 3: Database Storage Size */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Storage Size</span>
            <div className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overview.totalSize}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Physical disk allocation</p>
          </div>
        </div>

        {/* Card 4: Active Connections */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Connections</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
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
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Tables by Storage (MB)</h3>
              <p className="text-xs text-slate-400">Disk footprint per relation</p>
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
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.fullName}</p>
                          <p className="text-cyan-400 font-mono">Size: {data.sizeStr}</p>
                          <p className="text-slate-300 font-mono">Rows: {data.rowCount.toLocaleString()}</p>
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
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Database Engine Specs</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Engine Version</span>
              <p className="text-slate-200 font-mono text-[11px] truncate" title={overview.version}>
                {overview.version}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Database Name</span>
              <p className="text-cyan-400 font-mono font-semibold">{overview.databaseName}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Total Relation Size</span>
              <p className="text-emerald-400 font-mono font-semibold">{overview.totalSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Quick Access Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Database Tables ({tables.length})</h3>
          <span className="text-xs text-slate-400">Click any table to inspect schema and modify rows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <button
              key={`${table.table_schema}.${table.table_name}`}
              onClick={() => onSelectTable(table)}
              className="glass-card p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all text-left group flex items-start justify-between"
            >
              <div className="space-y-1.5 min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <TableIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {table.table_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                  <span>{table.column_count} cols</span>
                  <span>•</span>
                  <span>{table.total_size}</span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {table.estimated_rows.toLocaleString()} rows
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
