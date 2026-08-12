'use client';

import React, { useState, useEffect } from 'react';
import { ColumnInfo } from '@/types/database';
import { X, Save, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  schemaName: string;
  columns: ColumnInfo[];
  initialData?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => Promise<void>;
  mode: 'create' | 'edit';
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  tableName,
  schemaName,
  columns,
  initialData,
  onSave,
  mode,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // Pre-fill existing record data
      const formattedData: Record<string, any> = {};
      Object.keys(initialData).forEach((key) => {
        const val = initialData[key];
        if (typeof val === 'object' && val !== null) {
          formattedData[key] = JSON.stringify(val, null, 2);
        } else {
          formattedData[key] = val !== null ? String(val) : '';
        }
      });
      setFormData(formattedData);
    } else {
      // Reset default empty values
      const emptyData: Record<string, any> = {};
      columns.forEach((col) => {
        if (col.name === 'created_at' || col.name === 'updated_at') {
          emptyData[col.name] = new Date().toISOString();
        } else {
          emptyData[col.name] = '';
        }
      });
      setFormData(emptyData);
    }
    setJsonErrors({});
    setErrorMessage(null);
  }, [initialData, columns, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (colName: string, value: any, dataType: string) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));

    // JSON Validation check
    if (dataType.includes('json')) {
      if (!value || value.trim() === '') {
        setJsonErrors((prev) => {
          const next = { ...prev };
          delete next[colName];
          return next;
        });
      } else {
        try {
          JSON.parse(value);
          setJsonErrors((prev) => {
            const next = { ...prev };
            delete next[colName];
            return next;
          });
        } catch (e: any) {
          setJsonErrors((prev) => ({ ...prev, [colName]: 'Invalid JSON format' }));
        }
      }
    }
  };

  const handleGenerateUuid = (colName: string) => {
    const uuid = crypto.randomUUID();
    setFormData((prev) => ({ ...prev, [colName]: uuid }));
  };

  const handleSetNow = (colName: string) => {
    setFormData((prev) => ({ ...prev, [colName]: new Date().toISOString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(jsonErrors).length > 0) {
      setErrorMessage('Please fix JSON syntax errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Clean up values based on types
      const payload: Record<string, any> = {};
      columns.forEach((col) => {
        const rawVal = formData[col.name];
        if (rawVal === '' || rawVal === undefined) {
          if (mode === 'create' && col.defaultValue) {
            // Let database apply default
            return;
          }
          if (col.nullable) {
            payload[col.name] = null;
          }
        } else if (col.dataType.includes('json')) {
          payload[col.name] = JSON.parse(rawVal);
        } else if (col.dataType === 'boolean') {
          payload[col.name] = rawVal === 'true' || rawVal === true;
        } else if (col.dataType.includes('int') || col.dataType.includes('numeric')) {
          payload[col.name] = rawVal !== null && rawVal !== '' ? Number(rawVal) : null;
        } else {
          payload[col.name] = rawVal;
        }
      });

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{mode === 'create' ? 'Insert New Record' : 'Edit Table Record'}</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {schemaName}.{tableName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="px-6 py-3 bg-rose-950/90 border-b border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {columns.map((col) => {
            const isPk = col.isPrimaryKey;
            const isReadOnly = mode === 'edit' && isPk;
            const isJson = col.dataType.includes('json');
            const isBool = col.dataType === 'boolean';
            const isUuid = col.dataType === 'uuid';
            const isTimestamp = col.dataType.includes('timestamp') || col.dataType.includes('date');
            const value = formData[col.name] ?? '';

            return (
              <div key={col.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <span>{col.name}</span>
                    {isPk && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                        PK
                      </span>
                    )}
                    {!col.nullable && <span className="text-rose-400">*</span>}
                  </label>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                    <span>{col.dataType}</span>
                    {isUuid && (
                      <button
                        type="button"
                        onClick={() => handleGenerateUuid(col.name)}
                        className="text-cyan-400 hover:underline text-[10px]"
                      >
                        + UUID
                      </button>
                    )}
                    {isTimestamp && (
                      <button
                        type="button"
                        onClick={() => handleSetNow(col.name)}
                        className="text-cyan-400 hover:underline text-[10px]"
                      >
                        + Now()
                      </button>
                    )}
                  </div>
                </div>

                {isBool ? (
                  <select
                    value={String(value)}
                    disabled={isReadOnly}
                    onChange={(e) => handleInputChange(col.name, e.target.value, col.dataType)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900"
                  >
                    <option value="">-- Select Boolean --</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : isJson ? (
                  <div className="space-y-1">
                    <textarea
                      rows={5}
                      value={value}
                      disabled={isReadOnly}
                      onChange={(e) => handleInputChange(col.name, e.target.value, col.dataType)}
                      placeholder={`{"key": "value"}`}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500"
                    />
                    {jsonErrors[col.name] && (
                      <p className="text-[11px] text-rose-400 font-mono">{jsonErrors[col.name]}</p>
                    )}
                  </div>
                ) : (
                  <input
                    type={col.dataType.includes('int') || col.dataType.includes('numeric') ? 'number' : 'text'}
                    value={value}
                    disabled={isReadOnly}
                    onChange={(e) => handleInputChange(col.name, e.target.value, col.dataType)}
                    placeholder={col.defaultValue ? `Default: ${col.defaultValue}` : 'Enter value...'}
                    className={`w-full glass-input px-3 py-2 rounded-xl text-xs ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''
                    }`}
                  />
                )}
              </div>
            );
          })}
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(jsonErrors).length > 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{mode === 'create' ? 'Insert Record' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
