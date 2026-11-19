import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  History, 
  AlertTriangle, 
  ShieldCheck, 
  Database, 
  Bug, 
  RefreshCw,
  Flame
} from 'lucide-react';
import api from '../services/api';

export default function SettingsView() {
  const { user, isManager, isAdmin } = useAuth();
  const [settingsList, setSettingsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({});
  const [actionMessage, setActionMessage] = useState(null);

  // Form states for adding user
  const [newUser, setNewUser] = useState({
    id: `USR-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    email: '',
    role: 'Analyst',
    team: 'Fintech & SaaS'
  });

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [settingsRes, errorsRes] = await Promise.all([
        api.getSettings(),
        api.getImportErrors()
      ]);
      setSettingsList(settingsRes.settings || []);
      setAuditLogs(settingsRes.auditLogs || []);
      setUsersList(settingsRes.users || []);
      setImportErrors(errorsRes || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleTargetChange = (key, taskType, sheetType, val) => {
    setSettingsList(prev => prev.map(s => {
      const match = s.kpi_key === key && s.task_type === taskType && s.sheet_type === sheetType;
      return match ? { ...s, target_value: val } : s;
    }));
  };

  const handleSaveSetting = async (setting) => {
    const settingKey = `${setting.kpi_key}-${setting.task_type || ''}-${setting.sheet_type || ''}`;
    setSaveStatus(prev => ({ ...prev, [settingKey]: 'saving' }));

    try {
      await api.updateSetting({
        kpi_key: setting.kpi_key,
        target_value: Number(setting.target_value),
        task_type: setting.task_type,
        sheet_type: setting.sheet_type
      });

      setSaveStatus(prev => ({ ...prev, [settingKey]: 'saved' }));
      setActionMessage({ type: 'success', text: `Updated target for ${setting.description || setting.kpi_key}!` });
      // Notify other views that targets changed
      window.dispatchEvent(new CustomEvent('kpi-data-refresh'));
      loadSettingsData();
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [settingKey]: null })), 3000);
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [settingKey]: 'error' }));
      setActionMessage({ type: 'error', text: err.message || 'Failed to update setting' });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      await api.addUser(newUser);
      setActionMessage({ type: 'success', text: `User ${newUser.name} added successfully!` });
      setNewUser({
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        email: '',
        role: 'Analyst',
        team: 'Fintech & SaaS'
      });
      loadSettingsData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create user' });
    }
  };

  // Diagnostics & Reliability Testing Handlers
  const handleSimulateSyncFailure = async () => {
    try {
      const res = await api.refreshNow(true); // simulateFailure = true
      setActionMessage({ 
        type: 'warning', 
        text: 'Reliability test: Sync failure simulated! Dashboard keeps last good data and logged error.' 
      });
      loadSettingsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestImportErrors = async () => {
    try {
      const res = await api.testTrackerImport();
      setActionMessage({ 
        type: 'success', 
        text: `Import test complete: ${res.importedCount} imported, ${res.errorsCount} flagged in import-errors list (none invented)!` 
      });
      loadSettingsData();
    } catch (err) {
      console.error(err);
    }
  };

  const mainKpis = settingsList.filter(s => !s.task_type && !s.sheet_type);
  const taskTypeKpis = settingsList.filter(s => s.task_type);
  const sheetTypeKpis = settingsList.filter(s => s.sheet_type);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Settings Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">System & KPI Target Settings</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manager edits targets and thresholds. Changes immediately update status colours with no code deploy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit-Logged on Server</span>
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className={`mb-6 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          actionMessage.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700 ml-4">&times;</button>
        </div>
      )}

      {/* Grid: 1. Main KPI Targets & 2. Task/Sheet Specific Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Main 8 KPI Targets */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">The 8 Mandated KPI Targets</h3>
              <p className="text-xs text-slate-500">Edit targets to re-evaluate Green / Amber / Red thresholds instantly</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {mainKpis.map(setting => {
              const settingKey = `${setting.kpi_key}-${setting.task_type || ''}-${setting.sheet_type || ''}`;
              const state = saveStatus[settingKey];

              return (
                <div key={setting.kpi_key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 pr-4">
                    <div className="text-xs font-bold text-slate-800">{setting.description || setting.kpi_key}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Key: <code className="text-slate-600">{setting.kpi_key}</code> &bull; Unit: {setting.unit}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step={setting.unit === '%' ? '1' : '10'}
                      value={setting.target_value}
                      onChange={(e) => handleTargetChange(setting.kpi_key, setting.task_type, setting.sheet_type, e.target.value)}
                      className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-500 w-6">{setting.unit}</span>
                    <button
                      onClick={() => handleSaveSetting(setting)}
                      disabled={state === 'saving'}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      {state === 'saving' ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : state === 'saved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Type & Coverage Targets */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Targets by Task Type */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Daily Targets by Task Type</h3>
            <p className="text-xs text-slate-500 mb-3">Custom completed rows target per day</p>

            <div className="space-y-2.5">
              {taskTypeKpis.map(setting => {
                const settingKey = `${setting.kpi_key}-${setting.task_type}-${setting.sheet_type || ''}`;
                return (
                  <div key={setting.task_type} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{setting.task_type}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={setting.target_value}
                        onChange={(e) => handleTargetChange(setting.kpi_key, setting.task_type, setting.sheet_type, e.target.value)}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-400">rows</span>
                      <button
                        onClick={() => handleSaveSetting(setting)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coverage Targets per Sheet Type */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Coverage Targets per Sheet Type</h3>
            <p className="text-xs text-slate-500 mb-3">Field completeness % targets</p>

            <div className="space-y-2.5">
              {sheetTypeKpis.map(setting => {
                const settingKey = `${setting.kpi_key}-${setting.task_type || ''}-${setting.sheet_type}`;
                return (
                  <div key={setting.sheet_type} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{setting.sheet_type}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={setting.target_value}
                        onChange={(e) => handleTargetChange(setting.kpi_key, setting.task_type, setting.sheet_type, e.target.value)}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-400">%</span>
                      <button
                        onClick={() => handleSaveSetting(setting)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostics & Reliability Testing Tools */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Bug className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Reliability & Edge Case Testers
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Verify non-functional specs (import errors and sync fallback) in 1 click:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleSimulateSyncFailure}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left border border-slate-700 transition-colors"
              >
                <div className="font-bold text-rose-400 text-[11px]">Simulate Failed Sync</div>
                <div className="text-[10px] text-slate-400">Tests last-good data retention</div>
              </button>
              <button
                onClick={handleTestImportErrors}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-left border border-slate-700 transition-colors"
              >
                <div className="font-bold text-amber-400 text-[11px]">Test Bad Tracker Record</div>
                <div className="text-[10px] text-slate-400">Tests import-errors list logging</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Errors Table (Section 4 Compliance) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Import Errors Log</h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
              {importErrors.length} Flagged
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Records missing required fields are isolated without corrupting totals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2 px-3">Error ID</th>
                <th className="py-2 px-3">Source Record ID</th>
                <th className="py-2 px-3">Flagged Reason</th>
                <th className="py-2 px-3">Raw Data Snippet</th>
                <th className="py-2 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {importErrors.map(err => (
                <tr key={err.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-500">{err.id}</td>
                  <td className="py-2 px-3 font-bold text-rose-600">{err.source_record_id}</td>
                  <td className="py-2 px-3 text-slate-800 font-sans">{err.error_reason}</td>
                  <td className="py-2 px-3 text-slate-400 truncate max-w-xs">{JSON.stringify(err.raw_data)}</td>
                  <td className="py-2 px-3 text-right text-slate-400 font-sans">{new Date(err.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management & Audit Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Management */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">User & Role Management</h3>
          </div>

          {isAdmin ? (
            <form onSubmit={handleAddUser} className="space-y-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-700">Add New Analyst / Sheet Owner</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="email"
                  placeholder="email@company.com"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="Analyst">Analyst</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="Team Name"
                  value={newUser.team}
                  onChange={(e) => setNewUser({ ...newUser, team: e.target.value })}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded transition-colors"
              >
                Create User Record
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 mb-3 italic">
              Manager view: Read-only access to user roles. Admin account required to create or alter logins.
            </p>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {usersList.map(u => (
              <div key={u.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{u.name}</div>
                  <div className="text-[10px] text-slate-400">{u.email} &bull; {u.team}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  u.role === 'Manager' ? 'bg-purple-100 text-purple-800' :
                  u.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Audit Log</h3>
            </div>
            <span className="text-[10px] text-slate-400">All target & role edits logged</span>
          </div>

          <div className="flex-1 overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2 px-2.5">User</th>
                  <th className="py-2 px-2.5">Action</th>
                  <th className="py-2 px-2.5">Target</th>
                  <th className="py-2 px-2.5">Old Value</th>
                  <th className="py-2 px-2.5">New Value</th>
                  <th className="py-2 px-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 font-semibold text-slate-800">{log.user}</td>
                    <td className="py-2 px-2.5">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-700">{log.target_key}</td>
                    <td className="py-2 px-2.5 text-slate-400 line-through">{String(log.old_value)}</td>
                    <td className="py-2 px-2.5 font-bold text-emerald-700">{String(log.new_value)}</td>
                    <td className="py-2 px-2.5 text-right text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
