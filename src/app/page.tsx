'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { OverviewView } from '@/components/OverviewView';
import { TableDataView } from '@/components/TableDataView';
import { SqlQueryView } from '@/components/SqlQueryView';
import { CustomConnectionModal } from '@/components/CustomConnectionModal';
import { Toast } from '@/components/Toast';
import { TableInfo, DatabaseOverview, ToastMessage, DatabasePreset } from '@/types/database';
import { DATABASE_PRESETS } from '@/lib/constants';

type ConfiguredPreset = Pick<DatabasePreset, 'id' | 'name' | 'description' | 'badge' | 'color'>;

export default function Home() {
  const [currentPreset, setCurrentPreset] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeView, setActiveView] = useState<'overview' | 'table' | 'sql'>('overview');

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

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
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
  const testConnection = async (presetId?: string, urlOverride?: string): Promise<boolean> => {
    const activePreset = presetId || (urlOverride ? undefined : currentPreset);
    const activeUrl = urlOverride || (presetId ? undefined : customUrl);

    if (!activeUrl && !activePreset) {
      const message = 'No real database is configured in Cloudflare. Add a custom PostgreSQL URI or set AMCMEP_DATABASE_URL / DATABASE_URL.';
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
          connectionUrl: activeUrl,
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
  const loadDatabase = async (presetId?: string, urlOverride?: string) => {
    setIsLoadingTables(true);
    const activePreset = presetId || currentPreset;
    const activeUrl = urlOverride !== undefined ? urlOverride : customUrl;

    if (!activeUrl && !activePreset) {
      setTables([]);
      setSelectedTable(null);
      setOverview(null);
      setTopTables([]);
      setIsConnected(false);
      setIsTesting(false);
      setIsLoadingTables(false);
      setConnectionError('No real database is configured in Cloudflare. Add a custom PostgreSQL URI or set AMCMEP_DATABASE_URL / DATABASE_URL.');
      return;
    }

    const connected = await testConnection(activePreset, activeUrl);
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
      if (activeUrl) queryParams.set('url', activeUrl);
      else queryParams.set('preset', activePreset);

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
          setConnectionError('No real database is configured in Cloudflare. Add a custom PostgreSQL URI or set AMCMEP_DATABASE_URL / DATABASE_URL.');
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
  }, [currentPreset, customUrl, isConfigLoading]);

  const handleSelectPreset = (presetId: string) => {
    setCurrentPreset(presetId);
    setCustomUrl('');
    setSelectedTable(null);
    const pObj = DATABASE_PRESETS.find((p) => p.id === presetId);
    showToast(`Switched to ${pObj?.name || presetId}`, 'info');
  };

  const handleConnectCustomUrl = async (url: string): Promise<boolean> => {
    const success = await testConnection(undefined, url);
    if (success) {
      setCustomUrl(url);
      setCurrentPreset('custom');
      setSelectedTable(null);
      showToast('Connected to Custom Database', 'success');
      loadDatabase(undefined, url);
      return true;
    }
    return false;
  };

  const currentPresetObj = DATABASE_PRESETS.find((p) => p.id === currentPreset);
  const presetName = customUrl ? 'Custom Database' : currentPresetObj?.name || currentPreset;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Navbar with Database Selector Outside Side Nav */}
      <Navbar
        currentPreset={currentPreset}
        customUrl={customUrl}
        isConnected={isConnected}
        isTesting={isTesting || isConfigLoading}
        onSelectPreset={handleSelectPreset}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
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
          ) : activeView === 'table' && selectedTable ? (
            <TableDataView
              table={selectedTable}
              preset={currentPreset}
              customUrl={customUrl}
              onShowToast={showToast}
            />
          ) : (
            <SqlQueryView
              preset={currentPreset}
              customUrl={customUrl}
              onShowToast={showToast}
              tableName={selectedTable?.table_name}
            />
          )}
        </main>
      </div>

      {/* Custom Database Connection Modal */}
      <CustomConnectionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onConnect={handleConnectCustomUrl}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
