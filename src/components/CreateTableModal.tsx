'use client';

import React, { useState } from 'react';
import { Database, Plus, X, Trash2 } from 'lucide-react';

interface ColumnDef {
  id: string;
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string;
}

interface CreateTableModalProps {
  presetId: string;
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: () => void;
  onShowToast: (title: string, type?: 'success' | 'error' | 'info', description?: string) => void;
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  presetId,
  isOpen,
  onClose,
  onTableCreated,
  onShowToast,
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: '1', name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
    { id: '2', name: 'created_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, defaultValue: 'now()' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        type: 'text',
        isNullable: true,
        isPrimaryKey: false,
        defaultValue: '',
      },
    ]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, field: keyof ColumnDef, value: string | boolean) => {
    setColumns(
      columns.map((col) => {
        if (col.id === id) {
          return { ...col, [field]: value };
        }
        return col;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      onShowToast('Table name is required', 'error');
      return;
    }
    if (columns.some((c) => !c.name.trim())) {
      onShowToast('All columns must have a name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/db/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId, tableName: tableName.trim(), columns }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create table');
      }

      onShowToast(`Table ${tableName} created successfully!`, 'success');
      onTableCreated();
      onClose();
    } catch (error: any) {
      onShowToast('Failed to create table', 'error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-[#000000] border border-[#222] rounded-lg shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-500/10 rounded-lg">
              <Database className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create New Table</h2>
              <p className="text-xs text-neutral-400">Define the schema for a new table in the database.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="create-table-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Table Name</label>
              <input
                type="text"
                placeholder="e.g., users, feed_posts, work_requests"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/50 focus:border-neutral-500 transition-all font-mono"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Columns</label>
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-300 hover:bg-neutral-400/10 rounded-md transition-colors border border-neutral-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
              </div>

              <div className="border border-[#222] rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0a0a0a] border-b border-[#222] text-neutral-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Default</th>
                      <th className="px-4 py-3 font-medium text-center">PK</th>
                      <th className="px-4 py-3 font-medium text-center">Nullable</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#000000]/50">
                    {columns.map((col) => (
                      <tr key={col.id} className="group hover:bg-[#0a0a0a]/50 transition-colors">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                            placeholder="column_name"
                            className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#333] rounded text-slate-200 text-xs font-mono focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 outline-none"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={col.type}
                            onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#333] rounded text-slate-200 text-xs font-mono focus:border-neutral-500 outline-none"
                          >
                            <option value="uuid">uuid</option>
                            <option value="text">text</option>
                            <option value="varchar(255)">varchar(255)</option>
                            <option value="integer">integer</option>
                            <option value="bigint">bigint</option>
                            <option value="boolean">boolean</option>
                            <option value="timestamp with time zone">timestamp (tz)</option>
                            <option value="jsonb">jsonb</option>
                            <option value="numeric">numeric</option>
                            <option value="double precision">double precision</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={col.defaultValue}
                            onChange={(e) => updateColumn(col.id, 'defaultValue', e.target.value)}
                            placeholder="NULL"
                            className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#333] rounded text-slate-200 text-xs font-mono focus:border-neutral-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.isPrimaryKey}
                            onChange={(e) => updateColumn(col.id, 'isPrimaryKey', e.target.checked)}
                            className="w-4 h-4 rounded border-[#333] text-neutral-500 focus:ring-neutral-500/50 bg-[#0a0a0a]"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.isNullable}
                            onChange={(e) => updateColumn(col.id, 'isNullable', e.target.checked)}
                            className="w-4 h-4 rounded border-[#333] text-neutral-500 focus:ring-neutral-500/50 bg-[#0a0a0a]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeColumn(col.id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#222] bg-[#000000] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-table-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-neutral-950 bg-neutral-400 hover:bg-neutral-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin"></span>
                Creating...
              </>
            ) : (
              'Create Table'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
