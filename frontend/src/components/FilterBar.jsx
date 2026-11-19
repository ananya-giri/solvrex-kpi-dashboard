import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Filter, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';

export default function FilterBar({ filters, setFilters, onExport }) {
  const { user, isAnalyst } = useAuth();
  const [options, setOptions] = useState({
    analysts: [],
    teams: [],
    verticals: [],
    cities: [],
    sheetTypes: []
  });
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  useEffect(() => {
    api.getFilterOptions()
      .then(opts => setOptions(opts))
      .catch(err => console.error('Error fetching filter options:', err));
  }, []);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      analystId: isAnalyst ? user.id : 'all',
      team: 'all',
      vertical: 'all',
      city: 'all',
      sheetType: 'all'
    });
  };

  // Quick Date Range Presets
  const setDatePreset = (preset) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const dStr = formatDate(today);
      setFilters(prev => ({ ...prev, startDate: dStr, endDate: dStr }));
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFilters(prev => ({ ...prev, startDate: formatDate(d), endDate: formatDate(today) }));
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFilters(prev => ({ ...prev, startDate: formatDate(d), endDate: formatDate(today) }));
    } else if (preset === 'pilot') {
      // 5-day pilot period from spec
      setFilters(prev => ({ ...prev, startDate: '2026-11-15', endDate: '2026-11-19' }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 filter-bar">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-3">
          {/* Date Presets Dropdown / Range */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Date:
            </span>
            <select
              onChange={(e) => setDatePreset(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="pilot">5-Day Pilot Period (Nov 15-19)</option>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Analyst Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Analyst:</span>
            <select
              value={isAnalyst ? user.id : (filters.analystId || 'all')}
              disabled={isAnalyst}
              onChange={(e) => handleChange('analystId', e.target.value)}
              className={`bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                isAnalyst ? 'bg-slate-100 cursor-not-allowed opacity-80' : ''
              }`}
            >
              {!isAnalyst && <option value="all">All Analysts ({options.analysts.length})</option>}
              {options.analysts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.team})
                </option>
              ))}
            </select>
          </div>

          {/* Team / Vertical Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Vertical:</span>
            <select
              value={filters.vertical || 'all'}
              onChange={(e) => handleChange('vertical', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Verticals</option>
              {options.verticals?.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* City Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">City:</span>
            <select
              value={filters.city || 'all'}
              onChange={(e) => handleChange('city', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Cities</option>
              {options.cities?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sheet Type Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Sheet:</span>
            <select
              value={filters.sheetType || 'all'}
              onChange={(e) => handleChange('sheetType', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Sheet Types</option>
              {options.sheetTypes?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleReset}
            title="Reset filters to default"
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-700 text-xs py-1 px-2 rounded hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right: Export Menu */}
        <div className="relative flex justify-end">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export View</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {exportDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1"
                onMouseLeave={() => setExportDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    api.downloadExport('excel', filters);
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export to Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    api.downloadExport('csv', filters);
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export to CSV (.csv)</span>
                </button>
                <button
                  onClick={() => {
                    setExportDropdownOpen(false);
                    window.print();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print / Save to PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
