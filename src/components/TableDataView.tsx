'use client';

import React, { useState, useEffect } from 'react';
import { TableInfo, ColumnInfo, PaginationMeta, TableIndex } from '@/types/database';
import { TableSchemaView } from './TableSchemaView';
import { RecordModal } from './RecordModal';
import {
  Table as TableIcon,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Key,
  Layers,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface TableDataViewProps {
  table: TableInfo;
  preset: string;
  onShowToast: (title: string, type: 'success' | 'error' | 'info') => void;
}

export const TableDataView: React.FC<TableDataViewProps> = ({
  table,
  preset,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'schema'>('data');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<TableIndex[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    totalRows: 0,
    totalPages: 1,
  });
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Delete Dialog State
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);

  // Fetch Table Schema
  const fetchSchema = async () => {
    try {
      const queryParams = new URLSearchParams({
        table: table.table_name,
        schema: table.table_schema,
        preset,
      });

      const res = await fetch(`/api/db/schema?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setColumns(json.columns || []);
        setIndexes(json.indexes || []);
        const pkCol = json.columns.find((c: ColumnInfo) => c.isPrimaryKey);
        if (pkCol) setPrimaryKey(pkCol.name);
      }
    } catch (e) {
      console.error('Failed to fetch schema:', e);
    }
  };

  // Fetch Table Data Rows
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        table: table.table_name,
        schema: table.table_schema,
        page: String(pagination.page),
        limit: String(pagination.limit),
        preset,
      });

      if (search) queryParams.set('search', search);
      if (sortBy) {
        queryParams.set('sortBy', sortBy);
        queryParams.set('sortOrder', sortOrder);
      }

      const res = await fetch(`/api/db/data?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success) {
        setRows(json.data || []);
        setPagination(json.pagination);
        if (json.primaryKey) setPrimaryKey(json.primaryKey);
      } else {
        onShowToast(json.error || 'Failed to fetch rows', 'error');
      }
    } catch (e: any) {
      onShowToast(e.message || 'Error connecting to database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
    fetchData();
  }, [table, preset, pagination.page, pagination.limit, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
  };

  // Save (Insert / Update) Record
  const handleSaveRecord = async (data: Record<string, any>) => {
    setIsMutating(true);
    try {
      const payload: any = {
        action: modalMode === 'create' ? 'INSERT' : 'UPDATE',
        table: table.table_name,
        schema: table.table_schema,
        preset,
        data,
      };

      if (modalMode === 'edit') {
        if (!primaryKey && !selectedRow) {
          throw new Error('Cannot update record without primary key context');
        }
        const whereKey = primaryKey || Object.keys(selectedRow)[0];
        payload.where = { [whereKey]: selectedRow[whereKey] };
      }

      const res = await fetch('/api/db/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast(
          modalMode === 'create' ? 'Record inserted successfully!' : 'Record updated successfully!',
          'success'
        );
        fetchData();
      } else {
        throw new Error(json.error || 'Mutation failed');
      }
    } catch (e: any) {
      onShowToast(e.message || 'Operation failed', 'error');
      throw e;
    } finally {
      setIsMutating(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async () => {
    if (!rowToDelete) return;
    setIsMutating(true);

    try {
      const whereKey = primaryKey || Object.keys(rowToDelete)[0];
      const payload: any = {
        action: 'DELETE',
        table: table.table_name,
        schema: table.table_schema,
        preset,
        where: { [whereKey]: rowToDelete[whereKey] },
      };

      const res = await fetch('/api/db/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast('Record deleted successfully', 'success');
        setRowToDelete(null);
        fetchData();
      } else {
        onShowToast(json.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      onShowToast(e.message || 'Failed to delete row', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  // Export Data to CSV / JSON
  const handleExportData = (format: 'json' | 'csv') => {
    if (rows.length === 0) {
      onShowToast('No data available to export', 'info');
      return;
    }

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rows, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${table.table_name}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...csvRows].join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `${table.table_name}_export.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
    onShowToast(`Exported ${table.table_name} to ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Table Header Bar */}
      <div className="p-4 md:px-6 border-b border-slate-800 glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{table.table_name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                {table.table_schema}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {table.estimated_rows.toLocaleString()} estimated rows • {table.total_size}
            </p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'data'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data View
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'schema'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structure & Schema
            </button>
          </div>

          <button
            onClick={() => {
              setModalMode('create');
              setSelectedRow(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {activeTab === 'schema' ? (
        <div className="flex-1 overflow-y-auto">
          <TableSchemaView
            tableName={table.table_name}
            schemaName={table.table_schema}
            columns={columns}
            indexes={indexes}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <>
          {/* Data Filter Bar */}
          <div className="p-3 md:px-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search values in text/uuid columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
              />
            </form>

            {/* Controls */}
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <div className="flex items-center space-x-1 text-slate-400">
                <span>Per Page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) =>
                    setPagination((prev) => ({
                      ...prev,
                      limit: parseInt(e.target.value, 10),
                      page: 1,
                    }))
                  }
                  className="bg-slate-800 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Export Dropdown */}
              <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
                <button
                  onClick={() => handleExportData('json')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Export JSON"
                >
                  <FileCode className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExportData('csv')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={fetchData}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="flex-1 overflow-auto bg-slate-950">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="h-10 bg-slate-900/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Layers className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="text-sm font-medium">No records found in this table.</p>
                <button
                  onClick={() => {
                    setModalMode('create');
                    setSelectedRow(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert First Record</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold tracking-wider uppercase sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
                  <tr>
                    <th className="px-3 py-3 w-16 text-center border-r border-slate-800/60">Action</th>
                    {columns.map((col) => (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        className="px-4 py-3 cursor-pointer hover:text-white transition-colors border-r border-slate-800/40"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>{col.name}</span>
                          {col.isPrimaryKey && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                          {sortBy === col.name && (
                            <span className="text-cyan-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/80 transition-colors group">
                      {/* Action buttons */}
                      <td className="px-2 py-2 text-center border-r border-slate-800/60">
                        <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setSelectedRow(row);
                              setModalMode('edit');
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Edit row"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRowToDelete(row)}
                            className="p-1 rounded text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Cell Data */}
                      {columns.map((col) => {
                        const val = row[col.name];
                        const isNull = val === null || val === undefined;
                        const isBool = typeof val === 'boolean';
                        const isObject = typeof val === 'object' && val !== null;

                        return (
                          <td
                            key={col.name}
                            className="px-4 py-2.5 max-w-xs truncate border-r border-slate-800/30"
                            title={isObject ? JSON.stringify(val) : String(val)}
                          >
                            {isNull ? (
                              <span className="text-slate-600 italic">NULL</span>
                            ) : isBool ? (
                              <span
                                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  val
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {val ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                <span>{String(val)}</span>
                              </span>
                            ) : isObject ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px]">
                                JSON: {JSON.stringify(val).substring(0, 20)}...
                              </span>
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

          {/* Pagination Footer */}
          <div className="p-3 md:px-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {rows.length} of {pagination.totalRows.toLocaleString()} rows (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-slate-200">{pagination.page}</span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Record Edit / Insert Modal */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tableName={table.table_name}
        schemaName={table.table_schema}
        columns={columns}
        initialData={selectedRow}
        onSave={handleSaveRecord}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-rose-800/80 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Record Confirmation</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this row from{' '}
              <strong className="text-cyan-400">{table.table_name}</strong>? This operation will permanently remove the record from PostgreSQL.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setRowToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
              >
                {isMutating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
