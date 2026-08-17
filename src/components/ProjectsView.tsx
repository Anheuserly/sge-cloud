'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Server, CheckCircle2, ChevronRight, LayoutGrid } from 'lucide-react';
import { ToastMessage } from '@/types/database';

interface ProjectsViewProps {
  onShowToast: (title: string, type: 'success' | 'error' | 'info', desc?: string) => void;
}

export function ProjectsView({ onShowToast }: ProjectsViewProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  
  const [newDbName, setNewDbName] = useState('');
  const [newDbKey, setNewDbKey] = useState('');

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      onShowToast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, projectKey: newProjectKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onShowToast('Project created successfully', 'success');
      setIsProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectKey('');
      fetchProjects();
    } catch (err: any) {
      onShowToast('Failed to create project', 'error', err.message);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const res = await fetch('/api/databases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId, 
          name: newDbName, 
          databaseKey: newDbKey,
          badge: 'New Database',
          color: 'blue'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onShowToast('Database registered successfully', 'success');
      setIsDbModalOpen(false);
      setNewDbName('');
      setNewDbKey('');
      fetchProjects();
    } catch (err: any) {
      onShowToast('Failed to create database', 'error', err.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-neutral-400 animate-pulse">Loading projects...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            Projects
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Manage your multi-tenant projects and databases.</p>
        </div>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid gap-6">
        {projects.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-12 text-center text-neutral-500">
            No projects found. Create one to get started.
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#222] bg-[#111] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <div className="text-xs text-neutral-500 font-mono mt-1">Project Key: {p.key}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setIsDbModalOpen(true);
                  }}
                  className="text-xs font-medium text-neutral-400 hover:text-white border border-[#333] hover:border-neutral-500 rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Database
                </button>
              </div>

              <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {p.databases?.length === 0 ? (
                  <div className="text-xs text-neutral-500 italic py-2">No databases registered in this project.</div>
                ) : (
                  p.databases.map((db: any) => (
                    <div key={db.id} className="bg-[#000] border border-[#333] p-4 rounded-lg flex flex-col justify-between group hover:border-[#555] transition-colors">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${db.color}-500/10 text-${db.color}-400 border border-${db.color}-500/20`}>
                            {db.badge || 'Database'}
                          </div>
                          <Server className="w-4 h-4 text-neutral-600" />
                        </div>
                        <div className="font-medium text-sm text-neutral-200">{db.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">{db.description || 'No description'}</div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between text-xs font-mono text-neutral-600">
                        {db.id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#333] rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Create Project</h3>
            <p className="text-sm text-neutral-400 mb-6">Create a new isolated project context.</p>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => {
                    setNewProjectName(e.target.value);
                    if (!newProjectKey) {
                      setNewProjectKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                    }
                  }}
                  className="w-full mt-1 bg-[#000] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:border-neutral-500 outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase">Project Key</label>
                <input
                  type="text"
                  required
                  value={newProjectKey}
                  onChange={e => setNewProjectKey(e.target.value)}
                  className="w-full mt-1 bg-[#000] border border-[#333] rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-neutral-500 outline-none"
                  placeholder="e.g. acme_corp"
                  pattern="[a-z0-9_]+"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-lg hover:bg-neutral-200">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Database Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#333] rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Register Database</h3>
            <p className="text-sm text-neutral-400 mb-6">Register a new database schema under this project.</p>
            
            <form onSubmit={handleCreateDatabase} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase">Database Name</label>
                <input
                  type="text"
                  required
                  value={newDbName}
                  onChange={e => {
                    setNewDbName(e.target.value);
                    if (!newDbKey) {
                      setNewDbKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                    }
                  }}
                  className="w-full mt-1 bg-[#000] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:border-neutral-500 outline-none"
                  placeholder="e.g. Users Database"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase">Database Key</label>
                <input
                  type="text"
                  required
                  value={newDbKey}
                  onChange={e => setNewDbKey(e.target.value)}
                  className="w-full mt-1 bg-[#000] border border-[#333] rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-neutral-500 outline-none"
                  placeholder="e.g. users_db"
                  pattern="[a-z0-9_]+"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsDbModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-lg hover:bg-neutral-200">Register Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
