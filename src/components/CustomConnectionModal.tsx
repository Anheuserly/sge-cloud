'use client';

import React, { useState } from 'react';
import { X, Plug, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface CustomConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connectionUrl: string) => Promise<boolean>;
}

export const CustomConnectionModal: React.FC<CustomConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsTesting(true);
    setError(null);

    try {
      const success = await onConnect(url.trim());
      if (success) {
        onClose();
      } else {
        setError('Could not establish connection to PostgreSQL instance.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom PostgreSQL Connection</h3>
              <p className="text-xs text-slate-400">Connect to any local or remote database URI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Connection String (URI)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="postgresql://user:password@localhost:5432/dbname"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-[11px] text-slate-500">
              Format: <code className="text-slate-400 font-mono">postgresql://[user]:[password]@[host]:[port]/[database]</code>
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTesting || !url.trim()}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Test & Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
