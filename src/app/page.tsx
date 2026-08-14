'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { OverviewView } from '@/components/OverviewView';
import { TableDataView } from '@/components/TableDataView';
import { SqlQueryView } from '@/components/SqlQueryView';
import { PlatformAccessView } from '@/components/PlatformAccessView';
import { Toast } from '@/components/Toast';
import { TableInfo, DatabaseOverview, ToastMessage, DatabasePreset } from '@/types/database';
import { DATABASE_PRESETS } from '@/lib/constants';

type ConfiguredPreset = Pick<DatabasePreset, 'id' | 'name' | 'description' | 'badge' | 'color'>;
type ActiveView = 'overview' | 'table' | 'sql' | 'platform';

export default function Home() {
  const [currentPreset, setCurrentPreset] = useState<string>('');
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [topTables, setTopTables] = useState<any[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(true);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [connectionError, setConnectionError] = useState<string>('');
  const [configuredPresets, setConfiguredPresets] = useState<ConfiguredPreset[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

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

  // Test Database Connection
  const testConnection = async (presetId?: string): Promise<boolean> => {
    const activePreset = presetId || currentPreset;

    if (!activePreset) {
      const message = 'No real database is configured in Cloudflare. Set the database URL secrets in the Worker environment.';
      setIsConnected(false);
      setConnectionError(message);
      setIsTesting(false);
      return false;
    }

    setIsTesting(true);
    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: activePreset,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsConnected(true);
        setConnectionError('');
        return true;
      } else {
        const message = json.error || 'Failed to connect to database';
        setIsConnected(false);
        setConnectionError(message);
        showToast('Connection Error', 'error', message);
        return false;
      }
    } catch (e: any) {
      const message = e.message || 'Network failure connecting to database';
      setIsConnected(false);
      setConnectionError(message);
      showToast('Database Error', 'error', message);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  // Fetch Tables & Database Metrics Overview
  const loadDatabase = async (presetId?: string) => {
    setIsLoadingTables(true);
    const activePreset = presetId || currentPreset;

    if (!activePreset) {
      setTables([]);
      setSelectedTable(null);
      setOverview(null);
      setTopTables([]);
      setIsConnected(false);
      setIsTesting(false);
      setIsLoadingTables(false);
      setConnectionError('No real database is configured in Cloudflare. Set the database URL secrets in the Worker environment.');
      return;
    }

    const connected = await testConnection(activePreset);
    if (!connected) {
      setTables([]);
      setSelectedTable(null);
      setOverview(null);
      setTopTables([]);
      setIsLoadingTables(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('preset', activePreset);

      const [tablesRes, overviewRes] = await Promise.all([
        fetch(`/api/db/tables?${queryParams.toString()}`),
        fetch(`/api/db/overview?${queryParams.toString()}`),
      ]);

      const tablesJson = await tablesRes.json();
      const overviewJson = await overviewRes.json();

      if (tablesJson.success) {
        setTables(tablesJson.tables || []);
        if (tablesJson.tables && tablesJson.tables.length > 0 && !selectedTable) {
          setSelectedTable(tablesJson.tables[0]);
        }
      }

      if (overviewJson.success) {
        setOverview(overviewJson.info);
        setTopTables(overviewJson.topTables || []);
      }

    } catch (e: any) {
      showToast('Error loading schema', 'error', e.message);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await fetch('/api/db/config');
        const json = await res.json();
        const presets = json.success ? json.presets || [] : [];
        setConfiguredPresets(presets);
        setCurrentPreset((current) => current || presets[0]?.id || '');
        if (presets.length === 0) {
          setConnectionError('No real database is configured in Cloudflare. Set the database URL secrets in the Worker environment.');
        }
      } catch (e: any) {
        setConnectionError(e.message || 'Failed to load database configuration');
      } finally {
        setIsConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (isConfigLoading) return;
    loadDatabase();
  }, [currentPreset, isConfigLoading]);

  const handleSelectPreset = (presetId: string) => {
    setCurrentPreset(presetId);
    setSelectedTable(null);
    const pObj = DATABASE_PRESETS.find((p) => p.id === presetId);
    showToast(`Switched to ${pObj?.name || presetId}`, 'info');
  };

  const currentPresetObj = DATABASE_PRESETS.find((p) => p.id === currentPreset);
  const presetName = currentPresetObj?.name || currentPreset;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Navbar with Database Selector Outside Side Nav */}
      <Navbar
        currentPreset={currentPreset}
        isConnected={isConnected}
        isTesting={isTesting || isConfigLoading}
        onSelectPreset={handleSelectPreset}
        onRefresh={() => loadDatabase()}
        activeView={activeView}
        setActiveView={setActiveView}
        dbName={overview?.databaseName}
        databasePresets={configuredPresets}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Only Workspace Navigation & Tables list) */}
        <Sidebar
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={(table) => {
            setSelectedTable(table);
            setActiveView('table');
          }}
          activeView={activeView}
          setActiveView={setActiveView}
          isLoading={isLoadingTables}
          currentDatabaseName={overview?.databaseName}
          isConnected={isConnected}
        />

        {/* Center Workspace Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/40">
          {activeView === 'overview' ? (
            <OverviewView
              overview={overview}
              topTables={topTables}
              tables={tables}
              onSelectTable={(table) => {
                setSelectedTable(table);
                setActiveView('table');
              }}
              onOpenSql={() => setActiveView('sql')}
              isLoading={isLoadingTables}
              presetName={presetName}
              connectionError={connectionError}
              onRefresh={() => loadDatabase()}
            />
          ) : activeView === 'platform' ? (
            <PlatformAccessView onShowToast={showToast} />
          ) : activeView === 'table' && selectedTable ? (
            <TableDataView
              table={selectedTable}
              preset={currentPreset}
              onShowToast={showToast}
            />
          ) : (
            <SqlQueryView
              preset={currentPreset}
              onShowToast={showToast}
              tableName={selectedTable?.table_name}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
