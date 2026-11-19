import React from 'react';
import { ArrowUpRight, ArrowDownRight, HelpCircle, AlertCircle } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  targetText, 
  status = 'neutral', 
  unit = '', 
  subtext,
  onClick,
  kpiKey
}) {
  // Color styling based on Section 3 rules
  const getBadgeStyle = () => {
    switch (status) {
      case 'green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPillStyle = () => {
    switch (status) {
      case 'green':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'red':
        return 'bg-rose-500 animate-pulse';
      default:
        return 'bg-slate-400';
    }
  };

  const isNotChecked = value === null || value === undefined || value === 'Not checked';

  return (
    <div 
      onClick={() => onClick && onClick(kpiKey)}
      title="Click to view underlying tasks and row-level breakdown"
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Status indicator bar on left edge */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${getPillStyle()}`} />

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}>
          {isNotChecked ? 'Not checked' : (status === 'green' ? 'On Target' : (status === 'amber' ? 'Near Target' : 'Action Needed'))}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1">
          <span className={`text-3xl font-extrabold tracking-tight ${
            status === 'red' ? 'text-rose-600' : (status === 'green' ? 'text-slate-900' : 'text-amber-700')
          }`}>
            {isNotChecked ? 'Not checked' : value}
          </span>
          {!isNotChecked && unit && unit !== '%' && (
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          )}
        </div>
        
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-emerald-600 flex items-center transition-colors">
          View rows &rarr;
        </span>
      </div>

      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="font-medium text-slate-600">{targetText}</span>
        {subtext && <span className="text-[11px] text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
}
