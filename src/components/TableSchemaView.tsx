'use client';

import React from 'react';
import { ColumnInfo, TableIndex } from '@/types/database';
import { Key, Link, ShieldCheck, Database, Layers } from 'lucide-react';

interface TableSchemaViewProps {
  tableName: string;
  schemaName: string;
  columns: ColumnInfo[];
  indexes: TableIndex[];
  isLoading: boolean;
}

export const TableSchemaView: React.FC<TableSchemaViewProps> = ({
  tableName,
  schemaName,
  columns,
  indexes,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-800 animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 bg-slate-800/40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Column Schema Table */}
      <div className="bg-[#000000] border border-[#222] shadow-sm rounded-lg border border-[#222] overflow-hidden">
        <div className="p-4 border-b border-[#222]/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-white">Column Definitions ({columns.length})</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {schemaName}.{tableName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-neutral-400 uppercase tracking-wider font-semibold border-b border-[#222]">
              <tr>
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Data Type</th>
                <th className="px-4 py-3">Nullable</th>
                <th className="px-4 py-3">Default Value</th>
                <th className="px-4 py-3">Key Constraints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                  {/* Column Name */}
                  <td className="px-4 py-3 text-slate-200 font-semibold flex items-center space-x-2">
                    <span>{col.name}</span>
                    {col.isPrimaryKey && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center space-x-1">
                        <Key className="w-2.5 h-2.5" />
                        <span>PK</span>
                      </span>
                    )}
                    {col.foreignKey && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center space-x-1">
                        <Link className="w-2.5 h-2.5" />
                        <span>FK</span>
                      </span>
                    )}
                  </td>

                  {/* Data Type */}
                  <td className="px-4 py-3 text-neutral-300 font-medium">
                    {col.dataType}
                  </td>

                  {/* Nullable */}
                  <td className="px-4 py-3">
                    {col.nullable ? (
                      <span className="text-neutral-400">YES</span>
                    ) : (
                      <span className="text-rose-400 font-semibold">NO</span>
                    )}
                  </td>

                  {/* Default Value */}
                  <td className="px-4 py-3 text-neutral-400 truncate max-w-[200px]" title={col.defaultValue || 'None'}>
                    {col.defaultValue || <span className="text-slate-600">NULL</span>}
                  </td>

                  {/* Key Details */}
                  <td className="px-4 py-3">
                    {col.foreignKey ? (
                      <span className="text-blue-300 text-[11px]">
                        → {col.foreignKey.foreignTable}({col.foreignKey.foreignColumn})
                      </span>
                    ) : col.isPrimaryKey ? (
                      <span className="text-amber-400 text-[11px]">Primary Key</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Indexes */}
      {indexes.length > 0 && (
        <div className="bg-[#000000] border border-[#222] shadow-sm rounded-lg border border-[#222] overflow-hidden p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Database Indexes ({indexes.length})</h3>
          </div>

          <div className="space-y-2">
            {indexes.map((idx) => (
              <div
                key={idx.indexname}
                className="p-3 rounded-lg bg-slate-900/80 border border-[#222] font-mono text-xs space-y-1"
              >
                <div className="text-neutral-300 font-semibold">{idx.indexname}</div>
                <div className="text-neutral-400 text-[11px] break-all">{idx.indexdef}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
