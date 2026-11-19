import React, { useState, useEffect } from 'react';
import { X, Search, FileText, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function DrilldownModal({ kpiKey, filters, isOpen, onClose, onSelectTask }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && kpiKey) {
      setLoading(true);
      api.getDrilldown(kpiKey, filters)
        .then(res => setData(res))
        .catch(err => console.error('Error fetching drilldown:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, kpiKey, filters]);

  if (!isOpen) return null;

  const filteredRows = (data?.rows || []).filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      (r.task_name && r.task_name.toLowerCase().includes(q)) ||
      (r.analyst_name && r.analyst_name.toLowerCase().includes(q)) ||
      (r.source_record_id && r.source_record_id.toLowerCase().includes(q)) ||
      (r.vertical && r.vertical.toLowerCase().includes(q)) ||
      (r.city && r.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Drill-Down Explorer
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Underlying Tasks & Records: <span className="text-emerald-700 capitalize">{kpiKey}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data?.summaryMetric || 'Loading underlying source records...'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by task, analyst, source ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredRows.length}</span> of {data?.count || 0} tasks
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-2"></div>
              <p>Fetching row-level audit records...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No records found for this drill-down filter</p>
              <p className="mt-1">Try resetting the search terms or date bounds.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Task ID</th>
                    <th className="py-2.5 px-3">Source ID</th>
                    <th className="py-2.5 px-3">Task / Sheet Name</th>
                    <th className="py-2.5 px-3">Analyst</th>
                    <th className="py-2.5 px-3">Vertical / City</th>
                    <th className="py-2.5 px-3 text-right">Assigned</th>
                    <th className="py-2.5 px-3 text-right">Completed</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">QA Sample</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.id}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{row.source_record_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {row.task_name}
                        <div className="text-[10px] text-slate-400">{row.sheet_type} &bull; {row.task_type}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{row.analyst_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.vertical} &bull; {row.city}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600">{row.rows_assigned}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{row.rows_completed}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          row.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                        {row.rows_checked === '—' ? (
                          <span className="text-slate-400 italic">Not checked</span>
                        ) : (
                          <span>{row.rows_correct}/{row.rows_checked} corr</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (onSelectTask) onSelectTask(row.id);
                            onClose();
                          }}
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source tracker lineage verified &bull; Single source of truth calculation engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
