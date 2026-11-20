import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  User, 
  FileSpreadsheet, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut, 
  Clock, 
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isManager, isAdmin, isAnalyst } = useAuth();
  const [syncStatus, setSyncStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);

  const fetchSyncStatus = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async (simulateFailure = false) => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await api.refreshNow(simulateFailure);
      if (res.success) {
        setRefreshMessage({ type: 'success', text: 'Refreshed single source of truth!' });
      } else {
        setRefreshMessage({ type: 'error', text: res.error || 'Refresh failed (kept last good data)' });
      }
      fetchSyncStatus();
      // Notify parent to re-fetch data
      window.dispatchEvent(new CustomEvent('kpi-data-refresh'));
    } catch (err) {
      setRefreshMessage({ type: 'error', text: 'Network error during sync' });
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 5000);
    }
  };

  const formatLastUpdated = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      {/* Top Banner for Stale Data or Sync Failure */}
      {syncStatus?.is_stale && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Warning: Data is stale (last updated over 24 hours ago). Metrics may not reflect today's output.</span>
          </div>
          {isManager && (
            <button 
              onClick={() => handleRefresh(false)}
              className="underline font-semibold hover:text-amber-100"
            >
              Refresh Now
            </button>
          )}
        </div>
      )}

      {syncStatus?.sync_status === 'failed' && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Reliability Notice: Last refresh failed ({syncStatus.error_message}). Displaying last verified good data.</span>
          </div>
          {isManager && (
            <button 
              onClick={() => handleRefresh(false)}
              className="bg-white text-rose-700 px-2 py-0.5 rounded text-xs font-bold hover:bg-rose-50"
            >
              Retry Sync
            </button>
          )}
        </div>
      )}

      {refreshMessage && (
        <div className={`px-4 py-1 text-xs text-center font-medium ${refreshMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {refreshMessage.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Solvrex Private Limited</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                  KPI Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Analyst Team Output & Delivery &bull; Solvrex Ops</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {/* Team View (Default for Manager) */}
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Team View</span>
            </button>

            {/* Individual View */}
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isAnalyst ? 'My KPIs' : 'Individual View'}</span>
            </button>

            {/* Task / Sheet View */}
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sheets'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Task / Sheet View</span>
            </button>

            {/* Settings (Only Manager + Admin) */}
            {(isManager || isAdmin) && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}
          </nav>

          {/* Right Section: Last Updated + Role Pill + User Controls */}
          <div className="flex items-center space-x-3">
            {/* "Last updated" on every page as per Section 1 */}
            <div className="hidden md:flex flex-col items-end text-right">
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated:</span>
                <span className="font-medium text-slate-700">
                  {formatLastUpdated(syncStatus?.last_updated)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Daily pull: 06:00 AM IST</span>
            </div>

            {/* Manual Refresh Now Button (Manager / Admin) */}
            {(isManager || isAdmin) && (
              <button
                onClick={() => handleRefresh(false)}
                disabled={refreshing}
                title="Manual pull from single source of truth"
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 border border-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh now</span>
              </button>
            )}

            {/* User Profile & Role */}
            <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</div>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                  user?.role === 'Manager' ? 'bg-purple-100 text-purple-800' :
                  user?.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
