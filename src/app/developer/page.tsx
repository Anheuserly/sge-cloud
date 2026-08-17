'use client';

import React, { useState } from 'react';
import { PlatformAccessView } from '@/components/PlatformAccessView';
import { Toast } from '@/components/Toast';
import { ToastMessage } from '@/types/database';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperPage() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, type: 'success' | 'error' | 'info' = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#000000] text-[#f1f5f9] font-sans flex-col overflow-hidden">
      {/* Developer Navbar */}
      <header className="h-16 border-b border-[#222]/80 bg-[#000000] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 text-neutral-400 hover:text-white hover:bg-[#111] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-8 w-px bg-[#333]" />
          <div className="flex items-center space-x-2 text-rose-400">
            <Shield className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Developer & Security Settings</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <PlatformAccessView onShowToast={showToast} />
      </main>

      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
