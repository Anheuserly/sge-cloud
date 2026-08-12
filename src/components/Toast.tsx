'use client';

import React, { useEffect } from 'react';
import { ToastMessage } from '@/types/database';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl glass-card border shadow-2xl flex items-start justify-between transition-all transform duration-300 animate-slideUp ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-800/80 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-800/80 text-rose-300'
              : 'bg-slate-900/95 border-cyan-800/80 text-cyan-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              {toast.description && <p className="text-[11px] opacity-80 mt-0.5">{toast.description}</p>}
            </div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
