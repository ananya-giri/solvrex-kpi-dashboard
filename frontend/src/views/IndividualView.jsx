import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertTriangle, 
  ShieldAlert,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import KPICard from '../components/KPICard';
import DrilldownModal from '../components/DrilldownModal';
import api from '../services/api';

export default function IndividualView({ selectedAnalystId, onNavigateToSheet }) {
  const { user, isAnalyst, isManager } = useAuth();
  
  // Mandatory Access Control: Analyst MUST see self only!
  const effectiveAnalystId = isAnalyst ? user.id : (selectedAnalystId || user.id);
  
  const [analystId, setAnalystId] = useState(effectiveAnalystId);
  const [analystsList, setAnalystsList] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '2026-11-15',
    endDate: '2026-11-19'
  });

  const [kpiData, setKpiData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [analystInfo, setAnalystInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drilldown modal
  const [selectedDrilldown, setSelectedDrilldown] = useState(null);
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);

  useEffect(() => {
    // If user is analyst, lock analystId to their own
    if (isAnalyst) {
      setAnalystId(user.id);
    } else if (selectedAnalystId) {
      setAnalystId(selectedAnalystId);
    }
  }, [selectedAnalystId, isAnalyst, user]);

  useEffect(() => {
    api.getFilterOptions()
      .then(res => setAnalystsList(res.analysts || []))
      .catch(err => console.error(err));
  }, []);

  const loadAnalystData = async () => {
    setLoading(true);
    try {
      const filter = {
        ...dateRange,
        analystId
      };

      const [kpis, trend, tasks, options] = await Promise.all([
        api.getKPISummary(filter),
        api.getTrendData(filter, 30),
        api.getTasks(),
        api.getFilterOptions()
      ]);

      setKpiData(kpis);
      setTrendData(trend);
      // Filter tasks to this analyst and date range
      const analystTasks = tasks.filter(t => t.analyst_id === analystId);
      setTasksList(analystTasks);

      const foundAnalyst = (options.analysts || []).find(a => a.id === analystId);
      setAnalystInfo(foundAnalyst || { id: analystId, name: user?.name, team: user?.team });
    } catch (err) {
      console.error('Error fetching individual view data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalystData();
  }, [analystId, dateRange]);

  const openDrilldown = (kpiKey) => {
    setSelectedDrilldown(kpiKey);
    setDrilldownModalOpen(true);
  };

  const k = kpiData?.kpis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Analyst Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg">
            {analystInfo?.name ? analystInfo.name.charAt(0) : 'A'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">{analystInfo?.name || 'Analyst Performance'}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {analystInfo?.team}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual Output, Quality & Delivery Metrics &bull; ID: <code className="text-slate-600">{analystId}</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Analyst Selector (Only Manager / Admin can switch analysts) */}
          {isManager && (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-500">Switch Analyst:</span>
              <select
                value={analystId}
                onChange={(e) => setAnalystId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {analystsList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.team})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAnalyst && (
            <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1">
              <span>Personal Workspace (Private View)</span>
            </div>
          )}
        </div>
      </div>

      {/* The 8 KPIs for this Analyst */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
          Individual 8 KPIs — Target vs Actual
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="1. Rows Completed"
            kpiKey="completed"
            value={k?.completed?.formatted || '0'}
            unit="rows"
            status={k?.completed?.status}
            targetText={`Target: ${k?.completed?.target || 500} / day`}
            subtext={`${k?.completed?.tasksCount || 0} tasks finished`}
            onClick={openDrilldown}
          />

          <KPICard
            title="2. Completion Rate"
            kpiKey="completionRate"
            value={k?.completionRate?.formatted || '—'}
            unit="%"
            status={k?.completionRate?.status}
            targetText={`Target: ≥ ${k?.completionRate?.target || 90}%`}
            subtext={`${k?.completionRate?.rowsCompleted || 0}/${k?.completionRate?.rowsAssigned || 0} rows`}
            onClick={openDrilldown}
          />

          <KPICard
            title="3. Accuracy Rate"
            kpiKey="accuracyRate"
            value={k?.accuracyRate?.formatted || 'Not checked'}
            unit="%"
            status={k?.accuracyRate?.status}
            targetText={`Target: ≥ ${k?.accuracyRate?.target || 95}%`}
            subtext={k?.accuracyRate?.rowsChecked > 0 ? `${k?.accuracyRate?.rowsCorrect}/${k?.accuracyRate?.rowsChecked} QA verified` : 'No QA sample'}
            onClick={openDrilldown}
          />

          <KPICard
            title="4. Rework Rate"
            kpiKey="reworkRate"
            value={k?.reworkRate?.formatted || '—'}
            unit="%"
            status={k?.reworkRate?.status}
            targetText={`Target: ≤ ${k?.reworkRate?.target || 5}%`}
            subtext={`${k?.reworkRate?.rowsReworked || 0} rows returned`}
            onClick={openDrilldown}
          />

          <KPICard
            title="5. On-Time Delivery"
            kpiKey="onTimeDelivery"
            value={k?.onTimeDelivery?.formatted || '—'}
            unit="%"
            status={k?.onTimeDelivery?.status}
            targetText={`Target: ≥ ${k?.onTimeDelivery?.target || 95}%`}
            subtext={`${k?.onTimeDelivery?.tasksOnTime || 0}/${k?.onTimeDelivery?.tasksDue || 0} tasks on-time`}
            onClick={openDrilldown}
          />

          <KPICard
            title="6. Coverage / Fill Rate"
            kpiKey="coverageRate"
            value={k?.coverageRate?.formatted || '—'}
            unit="%"
            status={k?.coverageRate?.status}
            targetText={`Target: ≥ ${k?.coverageRate?.target || 85}%`}
            subtext={`${k?.coverageRate?.requiredFieldsFilled || 0}/${k?.coverageRate?.requiredFieldsTotal || 0} fields`}
            onClick={openDrilldown}
          />

          <KPICard
            title="7. Duplicate Rate"
            kpiKey="duplicateRate"
            value={k?.duplicateRate?.formatted || '—'}
            unit="%"
            status={k?.duplicateRate?.status}
            targetText={`Target: ≤ ${k?.duplicateRate?.target || 1}%`}
            subtext={`${k?.duplicateRate?.duplicatesFound || 0} duplicates`}
            onClick={openDrilldown}
          />

          <KPICard
            title="8. Pending / Backlog"
            kpiKey="pendingBacklog"
            value={k?.pendingBacklog?.formatted || '0'}
            unit="tasks"
            status={k?.pendingBacklog?.status}
            targetText="Target: 0 overdue"
            subtext={k?.pendingBacklog?.value > 0 ? 'Overdue tasks pending' : 'Zero overdue backlog'}
            onClick={openDrilldown}
          />
        </div>
      </div>

      {/* 30-Day Trend Chart for this Analyst */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">30-Day Output & Accuracy Trend</h3>
            <p className="text-xs text-slate-500">Day-by-day completed rows and QA accuracy percentage</p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
            Click points to drill-down
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={trendData}
              onClick={(e) => {
                if (e && e.activePayload) {
                  openDrilldown('completed');
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                formatter={(val, name) => [
                  name === 'Completed Rows' ? `${val} rows` : (val !== null ? `${val}%` : 'Not checked'),
                  name
                ]}
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="completed" 
                name="Completed Rows" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={{ r: 3 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="accuracy" 
                name="Accuracy Rate (%)" 
                stroke="#6366f1" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                connectNulls={false}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task List for Selected Period */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assigned Tasks & Sheets</h3>
            <p className="text-xs text-slate-500">Tasks assigned to {analystInfo?.name}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {tasksList.length} Tasks Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Task ID</th>
                <th className="py-2.5 px-3">Task / Sheet Name</th>
                <th className="py-2.5 px-3">Vertical / City</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Assigned Rows</th>
                <th className="py-2.5 px-3 text-right">Completed Rows</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasksList.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{task.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {task.task_name}
                    <div className="text-[10px] text-slate-400">{task.sheet_type} &bull; {task.task_type}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{task.vertical} &bull; {task.city}</td>
                  <td className="py-2.5 px-3 text-slate-700">{task.due_date}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-medium">{task.rows_assigned}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{task.rows_completed}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      task.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onNavigateToSheet && onNavigateToSheet(task.id)}
                      className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs inline-flex items-center space-x-1"
                    >
                      <span>Sheet View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Modal */}
      <DrilldownModal
        kpiKey={selectedDrilldown}
        filters={{ ...dateRange, analystId }}
        isOpen={drilldownModalOpen}
        onClose={() => setDrilldownModalOpen(false)}
        onSelectTask={(taskId) => {
          if (onNavigateToSheet) onNavigateToSheet(taskId);
        }}
      />
    </div>
  );
}
