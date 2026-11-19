import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid 
} from 'recharts';
import { 
  AlertCircle, 
  ArrowUpDown, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import KPICard from '../components/KPICard';
import DrilldownModal from '../components/DrilldownModal';
import api from '../services/api';

export default function TeamView({ onNavigateToIndividual, onNavigateToSheet }) {
  const [filters, setFilters] = useState({
    startDate: '2026-11-15',
    endDate: '2026-11-19',
    analystId: 'all',
    team: 'all',
    vertical: 'all',
    city: 'all',
    sheetType: 'all'
  });

  const [kpiData, setKpiData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [teamTable, setTeamTable] = useState([]);
  const [workMix, setWorkMix] = useState({ byVertical: [], byCity: [], bySheetType: [] });
  const [workMixTab, setWorkMixTab] = useState('vertical');
  const [needsAttention, setNeedsAttention] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drilldown Modal State
  const [selectedDrilldown, setSelectedDrilldown] = useState(null);
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);

  // Sorting state for team table
  const [sortField, setSortField] = useState('completed');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [kpis, trend, team, mix, attention] = await Promise.all([
        api.getKPISummary(filters),
        api.getTrendData(filters),
        api.getTeamTable(filters),
        api.getWorkMix(filters),
        api.getNeedsAttention(filters)
      ]);

      setKpiData(kpis);
      setTrendData(trend);
      setTeamTable(team);
      setWorkMix(mix);
      setNeedsAttention(attention);
    } catch (err) {
      console.error('Error fetching team view data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filters]);

  useEffect(() => {
    const handleRefreshEvent = () => loadAllData();
    window.addEventListener('kpi-data-refresh', handleRefreshEvent);
    return () => window.removeEventListener('kpi-data-refresh', handleRefreshEvent);
  }, [filters]);

  const openDrilldown = (kpiKey) => {
    setSelectedDrilldown(kpiKey);
    setDrilldownModalOpen(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTeamTable = [...teamTable].sort((a, b) => {
    let aVal = a.kpis[sortField]?.value;
    let bVal = b.kpis[sortField]?.value;
    if (aVal === null || aVal === undefined) aVal = -9999;
    if (bVal === null || bVal === undefined) bVal = -9999;
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const k = kpiData?.kpis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Global Filter Bar */}
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* 2. Top 4 KPI Cards (As Wireframed on Page 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 card-container">
        {/* Card 1: Completed */}
        <KPICard
          title="Completed"
          kpiKey="completed"
          value={k?.completed?.formatted || '0'}
          unit="rows"
          status={k?.completed?.status}
          targetText={`Target: ${k?.completed?.target || 500} / day`}
          subtext={`${k?.completed?.tasksCount || 0} tasks done`}
          onClick={openDrilldown}
        />

        {/* Card 2: Completion % */}
        <KPICard
          title="Completion %"
          kpiKey="completionRate"
          value={k?.completionRate?.formatted || '—'}
          unit="%"
          status={k?.completionRate?.status}
          targetText={`Target: ≥ ${k?.completionRate?.target || 90}%`}
          subtext={`${k?.completionRate?.rowsCompleted || 0}/${k?.completionRate?.rowsAssigned || 0} rows`}
          onClick={openDrilldown}
        />

        {/* Card 3: Accuracy % */}
        <KPICard
          title="Accuracy %"
          kpiKey="accuracyRate"
          value={k?.accuracyRate?.formatted || 'Not checked'}
          unit="%"
          status={k?.accuracyRate?.status}
          targetText={`Target: ≥ ${k?.accuracyRate?.target || 95}%`}
          subtext={k?.accuracyRate?.rowsChecked > 0 ? `${k?.accuracyRate?.rowsCorrect}/${k?.accuracyRate?.rowsChecked} QA sample` : 'No QA sample'}
          onClick={openDrilldown}
        />

        {/* Card 4: Overdue (Red if above 0) */}
        <KPICard
          title="Overdue Tasks"
          kpiKey="pendingBacklog"
          value={k?.pendingBacklog?.formatted || '0'}
          unit="tasks"
          status={k?.pendingBacklog?.status}
          targetText="Target: 0 overdue"
          subtext={k?.pendingBacklog?.value > 0 ? 'Action required immediately' : 'Clean backlog'}
          onClick={openDrilldown}
        />
      </div>

      {/* 3. Middle Section: Trend Chart (Left) & Team Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Trend Chart (Line chart: Completed and Accuracy by day, last 30 days) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">30-Day Trend Chart</h3>
              <p className="text-xs text-slate-500">Completed Rows & QA Accuracy by day</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              Click dot to drill-down
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
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[80, 100]} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                />
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
                  activeDot={{ r: 6 }} 
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

        {/* Team Table (One row per analyst: all 8 KPIs, sortable, status colours) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Team Summary Table</h3>
              <p className="text-xs text-slate-500">One row per analyst with all 8 KPIs & status colours</p>
            </div>
            <span className="text-[10px] text-slate-400">Click row for Individual view</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2 px-2.5">Analyst</th>
                  <th 
                    onClick={() => handleSort('completed')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Completed</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('completionRate')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>Comp %</span>
                  </th>
                  <th 
                    onClick={() => handleSort('accuracyRate')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>Acc %</span>
                  </th>
                  <th 
                    onClick={() => handleSort('reworkRate')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>Rework</span>
                  </th>
                  <th 
                    onClick={() => handleSort('onTimeDelivery')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>On-Time</span>
                  </th>
                  <th 
                    onClick={() => handleSort('coverageRate')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>Cover</span>
                  </th>
                  <th 
                    onClick={() => handleSort('duplicateRate')} 
                    className="py-2 px-2 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <span>Dup %</span>
                  </th>
                  <th 
                    onClick={() => handleSort('pendingBacklog')} 
                    className="py-2 px-2 text-center cursor-pointer hover:bg-slate-100"
                  >
                    <span>Backlog</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTeamTable.map(analyst => (
                  <tr 
                    key={analyst.analystId}
                    onClick={() => onNavigateToIndividual && onNavigateToIndividual(analyst.analystId)}
                    className="hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-2.5 font-semibold text-slate-900 group-hover:text-emerald-700">
                      {analyst.analystName}
                      <div className="text-[10px] text-slate-400 font-normal">{analyst.team}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-800">
                      {analyst.kpis.completed.formatted}
                    </td>
                    {/* Completion % */}
                    <td className="py-2.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        analyst.kpis.completionRate.status === 'green' ? 'text-emerald-700 bg-emerald-50' :
                        analyst.kpis.completionRate.status === 'amber' ? 'text-amber-700 bg-amber-50' :
                        'text-rose-700 bg-rose-50'
                      }`}>
                        {analyst.kpis.completionRate.formatted}
                      </span>
                    </td>
                    {/* Accuracy % */}
                    <td className="py-2.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        analyst.kpis.accuracyRate.status === 'green' ? 'text-emerald-700 bg-emerald-50' :
                        analyst.kpis.accuracyRate.status === 'amber' ? 'text-amber-700 bg-amber-50' :
                        analyst.kpis.accuracyRate.status === 'red' ? 'text-rose-700 bg-rose-50' :
                        'text-slate-500 bg-slate-100'
                      }`}>
                        {analyst.kpis.accuracyRate.formatted}
                      </span>
                    </td>
                    {/* Rework % */}
                    <td className="py-2.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        analyst.kpis.reworkRate.status === 'green' ? 'text-emerald-700' :
                        analyst.kpis.reworkRate.status === 'amber' ? 'text-amber-700' :
                        'text-rose-700 bg-rose-50'
                      }`}>
                        {analyst.kpis.reworkRate.formatted}
                      </span>
                    </td>
                    {/* On-Time % */}
                    <td className="py-2.5 px-2 text-right text-slate-700 font-medium">
                      {analyst.kpis.onTimeDelivery.formatted}
                    </td>
                    {/* Coverage % */}
                    <td className="py-2.5 px-2 text-right text-slate-700 font-medium">
                      {analyst.kpis.coverageRate.formatted}
                    </td>
                    {/* Duplicate % */}
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {analyst.kpis.duplicateRate.formatted}
                    </td>
                    {/* Pending Backlog */}
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        analyst.kpis.pendingBacklog.value > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {analyst.kpis.pendingBacklog.formatted}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Work Mix (Left) & Needs Attention (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Work Mix: Completed by vertical / city / sheet type (Bar Chart) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Work Mix</h3>
              <p className="text-xs text-slate-500">Completed rows breakdown</p>
            </div>
            {/* Tabs for Vertical / City / Sheet Type */}
            <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setWorkMixTab('vertical')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  workMixTab === 'vertical' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Vertical
              </button>
              <button
                onClick={() => setWorkMixTab('city')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  workMixTab === 'city' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                City
              </button>
              <button
                onClick={() => setWorkMixTab('sheetType')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  workMixTab === 'sheetType' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sheet Type
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  workMixTab === 'vertical' ? workMix.byVertical :
                  workMixTab === 'city' ? workMix.byCity :
                  workMix.bySheetType
                }
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#334155' }} 
                  width={90}
                />
                <Tooltip 
                  formatter={(val) => [`${val.toLocaleString()} rows`, 'Completed']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="rows" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Attention: Overdue tasks, high rework, accuracy below 90% */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
              <h3 className="text-sm font-bold text-slate-900">Needs Attention</h3>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {needsAttention.length} Items Flagged
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Overdue tasks, high rework (&gt;5%), and QA accuracy below 90%
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-60">
            {needsAttention.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">All quality & delivery metrics healthy</p>
                <p>No overdue tasks or quality threshold breaches</p>
              </div>
            ) : (
              needsAttention.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onNavigateToSheet && onNavigateToSheet(item.taskId)}
                  className="p-3 bg-slate-50 hover:bg-rose-50/40 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      item.issueType === 'Overdue Task' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          item.issueType === 'Overdue Task' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.issueType}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.taskName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Analyst: <span className="font-medium text-slate-700">{item.analystName}</span> &bull; Due: {item.dueDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-600 block">{item.metric}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-rose-600 flex items-center justify-end space-x-0.5 mt-0.5">
                      <span>View sheet</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drill-Down Modal */}
      <DrilldownModal
        kpiKey={selectedDrilldown}
        filters={filters}
        isOpen={drilldownModalOpen}
        onClose={() => setDrilldownModalOpen(false)}
        onSelectTask={(taskId) => {
          if (onNavigateToSheet) onNavigateToSheet(taskId);
        }}
      />
    </div>
  );
}
