'use client';

import React, { useState } from 'react';
import { Terminal, Play, RefreshCw, Download, FileCode, AlertCircle, Sparkles } from 'lucide-react';

interface SqlQueryViewProps {
  preset: string;
  customUrl: string;
  onShowToast: (title: string, type: 'success' | 'error' | 'info') => void;
  tableName?: string;
}

export const SqlQueryView: React.FC<SqlQueryViewProps> = ({
  preset,
  customUrl,
  onShowToast,
  tableName,
}) => {
  const [sql, setSql] = useState<string>(
    tableName
      ? `SELECT * FROM "${tableName}" LIMIT 50;`
      : `SELECT table_schema, table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_size FROM information_schema.tables WHERE table_schema = 'public' ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC;`
  );

  const [results, setResults] = useState<any[] | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    {
      label: 'All Public Tables',
      sql: `SELECT table_schema, table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_size FROM information_schema.tables WHERE table_schema = 'public' ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC;`,
    },
    {
      label: 'Active Locks & Queries',
      sql: `SELECT pid, now() - query_start as duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;`,
    },
    {
      label: 'Database Table Row Counts',
      sql: `SELECT schemaname, relname, n_live_tup as live_records FROM pg_stat_user_tables ORDER BY n_live_tup DESC;`,
    },
  ];

  const handleExecute = async () => {
    if (!sql.trim()) return;
    setIsExecuting(true);
    setError(null);

    try {
      const payload: any = { sql };
      if (customUrl) payload.url = customUrl;
      else payload.preset = preset;

      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        setResults(json.rows || []);
        setFields(json.fields || []);
        setDurationMs(json.durationMs);
        setRowCount(json.rowCount);
        onShowToast(`Executed query in ${json.durationMs}ms`, 'success');
      } else {
        setError(json.error || 'Execution failed');
        setResults(null);
      }
    } catch (e: any) {
      setError(e.message || 'Error executing query');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!results || results.length === 0) {
      onShowToast('No result rows available to export', 'info');
      return;
    }

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `query_results.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = Object.keys(results[0]).join(',');
      const csvRows = results.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...csvRows].join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `query_results.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
    onShowToast(`Exported results to ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span>Interactive SQL Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Run raw SQL queries against PostgreSQL. Press Ctrl+Enter or Cmd+Enter to execute.
          </p>
        </div>

        {/* Templates */}
        <div className="flex items-center space-x-2">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSql(q.sql)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Box */}
      <div className="glass-card rounded-2xl border border-slate-800 p-4 space-y-3 shrink-0">
        <textarea
          rows={5}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleExecute();
            }
          }}
          placeholder="SELECT * FROM table_name WHERE condition..."
          className="w-full glass-input p-3 rounded-xl text-xs font-mono placeholder:text-slate-600 focus:ring-1 focus:ring-purple-500 text-purple-200"
        />

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400 font-mono">
            {durationMs !== null && (
              <span className="text-emerald-400 font-semibold">
                Execution time: {durationMs}ms ({rowCount !== null ? `${rowCount} rows affected` : ''})
              </span>
            )}
          </div>

          <button
            onClick={handleExecute}
            disabled={isExecuting || !sql.trim()}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
          >
            {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run SQL Query</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-start space-x-3 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="font-mono space-y-1">
            <p className="font-bold">SQL Execution Error:</p>
            <p className="text-[11px] text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {/* Query Results Table */}
      <div className="flex-1 glass-card rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-3 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Query Results ({results ? results.length : 0})</span>
          </span>

          {results && results.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('json')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
              >
                <FileCode className="w-3 h-3 text-cyan-400" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-slate-950">
          {!results ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Run a query to display results grid here.
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Query executed successfully. 0 rows returned.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold tracking-wider uppercase sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="px-4 py-3 border-r border-slate-800/40">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/80 transition-colors">
                    {Object.keys(results[0]).map((key) => {
                      const val = row[key];
                      const isNull = val === null || val === undefined;
                      const isObject = typeof val === 'object' && val !== null;

                      return (
                        <td key={key} className="px-4 py-2.5 max-w-xs truncate border-r border-slate-800/30">
                          {isNull ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : isObject ? (
                            <span className="text-purple-400">{JSON.stringify(val)}</span>
                          ) : (
                            <span className="text-slate-200">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
