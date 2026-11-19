import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Copy, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';

export default function TaskSheetView({ initialTaskId, onBack }) {
  const { user, isAnalyst } = useAuth();
  const [taskList, setTaskList] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || '');
  const [sheetDetail, setSheetDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTasks()
      .then(tasks => {
        setTaskList(tasks);
        if (!selectedTaskId && tasks.length > 0) {
          setSelectedTaskId(tasks[0].id);
        }
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      setLoading(true);
      setError(null);
      api.getTaskSheetDetail(selectedTaskId)
        .then(data => setSheetDetail(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [selectedTaskId]);

  const task = sheetDetail?.task;
  const qa = sheetDetail?.qa_check;
  const coverage = sheetDetail?.coverage;
  const underlyingRows = sheetDetail?.underlying_rows || [];

  const coveragePct = coverage && coverage.required_fields_total > 0
    ? ((coverage.required_fields_filled / coverage.required_fields_total) * 100).toFixed(1)
    : '—';

  const completionPct = task && task.rows_assigned > 0
    ? ((task.rows_completed / task.rows_assigned) * 100).toFixed(1)
    : '—';

  const accuracyPct = qa && qa.rows_checked > 0
    ? ((qa.rows_correct / qa.rows_checked) * 100).toFixed(1)
    : 'Not checked';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Sheet Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{task?.task_name || 'Task / Sheet View'}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                task?.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                task?.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {task?.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Source ID: <code className="text-slate-600">{task?.source_record_id}</code> &bull; Vertical: {task?.vertical} &bull; City: {task?.city}
            </p>
          </div>
        </div>

        {/* Sheet Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Select Sheet:</span>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-xs"
          >
            {taskList.map(t => (
              <option key={t.id} value={t.id}>
                {t.task_name} ({t.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-2"></div>
          <p>Loading sheet details & underlying rows...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards for this Sheet */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Assigned vs Completed */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned / Done</span>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {task?.rows_completed} <span className="text-xs font-normal text-slate-400">/ {task?.rows_assigned}</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                {completionPct}% complete
              </div>
            </div>

            {/* QA Verification */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">QA Accuracy</span>
              <div className={`text-lg font-extrabold mt-1 ${accuracyPct === 'Not checked' ? 'text-slate-500' : 'text-slate-900'}`}>
                {accuracyPct === 'Not checked' ? 'Not checked' : `${accuracyPct}%`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {qa?.rows_checked > 0 ? `${qa.rows_correct}/${qa.rows_checked} correct` : 'Zero sample'}
              </div>
            </div>

            {/* Reworked Rows */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rework Rows</span>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {qa?.rows_reworked || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                sent back by QA
              </div>
            </div>

            {/* Duplicates Found */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Duplicates</span>
              <div className={`text-lg font-extrabold mt-1 ${qa?.duplicates_found > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {qa?.duplicates_found || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                duplicate rows flagged
              </div>
            </div>

            {/* Coverage / Fill Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Field Coverage</span>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {coveragePct !== '—' ? `${coveragePct}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {coverage?.required_fields_filled || 0}/{coverage?.required_fields_total || 0} fields
              </div>
            </div>

            {/* Delivery Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery</span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {task?.delivery_date ? (
                  task.delivery_date <= task.due_date ? 'On-Time' : 'Delivered Late'
                ) : (
                  task?.status === 'Overdue' ? 'Past Due' : 'In Progress'
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Due: {task?.due_date}
              </div>
            </div>
          </div>

          {/* Field Coverage Breakdown (Per Sheet Type) */}
          {coverage?.field_breakdown && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Mandatory Field Coverage Breakdown ({task?.sheet_type})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(coverage.field_breakdown).map(([field, stats]) => {
                  const pct = stats.req > 0 ? ((stats.filled / stats.req) * 100).toFixed(0) : 0;
                  return (
                    <div key={field} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 capitalize">
                        <span>{field.replace('_', ' ')}</span>
                        <span className="text-emerald-600 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {stats.filled} of {stats.req} verified
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Underlying Rows Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Underlying Sheet Rows (Audited Records)</h3>
                <p className="text-xs text-slate-500">
                  Sample rows extracted from production tracker &bull; Traceable to source ID {task?.source_record_id}
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Displaying sample rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Record ID</th>
                    <th className="py-2.5 px-3">Company / Entity</th>
                    <th className="py-2.5 px-3">Primary Contact</th>
                    <th className="py-2.5 px-3">Email Status</th>
                    <th className="py-2.5 px-3">Phone Status</th>
                    <th className="py-2.5 px-3 text-center">QA Sample</th>
                    <th className="py-2.5 px-3 text-right">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {underlyingRows.map(row => (
                    <tr key={row.row_index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{row.row_index}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{row.record_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{row.company_name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.lead_contact}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {row.email_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{row.phone_status}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.qa_status === 'Pass' ? 'bg-emerald-100 text-emerald-800' :
                          row.qa_status === 'Rework Needed' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {row.qa_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">{row.updated_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
