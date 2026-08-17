'use client';

import React, { useState } from 'react';
import { Shield, ArrowRight, Activity, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Force a full refresh to clear any cached states and hit the middleware
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">
        <div className="mb-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SGE Cloud</h1>
            <p className="text-sm text-neutral-400 mt-1">Sign in to your control plane</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0a0a0a] border border-[#222] p-8 rounded-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#000000] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="admin@sge.amcmep.in"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#000000] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-neutral-600 font-mono">
          <Terminal className="w-3 h-3 inline-block mr-1 align-text-bottom" />
          Secure Access Portal
        </div>
      </div>
    </div>
  );
}
