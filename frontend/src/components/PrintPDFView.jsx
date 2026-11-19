import React from 'react';

export default function PrintPDFView({ kpiData, teamData, filter, syncStatus }) {
  if (!kpiData) return null;
  const k = kpiData.kpis || {};

  return (
    <div className="print-only p-8 text-black bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
              Analyst Team Performance & KPI Report
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Zero-Spend Single Source of Truth Production Audit
            </p>
          </div>
          <div className="text-right text-xs">
            <div><span className="font-bold">Generated:</span> {new Date().toLocaleString()}</div>
            <div><span className="font-bold">Data Last Synced:</span> {new Date(syncStatus?.last_updated || Date.now()).toLocaleString()}</div>
            <div><span className="font-bold">Sync Schedule:</span> Daily at 06:00 AM IST</div>
          </div>
        </div>
      </div>

      {/* 8 KPIs Summary Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
          Section 1: The 8 Mandated KPIs — Performance vs Targets
        </h2>
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="p-2 border-r border-slate-300">#</th>
              <th className="p-2 border-r border-slate-300">KPI Metric</th>
              <th className="p-2 border-r border-slate-300">Actual Value</th>
              <th className="p-2 border-r border-slate-300">Target (Setting)</th>
              <th className="p-2 border-r border-slate-300">Status</th>
              <th className="p-2">Official Formula</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">1</td>
              <td className="p-2 border-r border-slate-300">Tasks / Rows Completed</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.completed?.formatted} rows</td>
              <td className="p-2 border-r border-slate-300">{k.completed?.target} rows/day</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.completed?.status}</td>
              <td className="p-2 text-slate-600">Count of rows completed in period</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">2</td>
              <td className="p-2 border-r border-slate-300">Completion Rate</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.completionRate?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&ge; {k.completionRate?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.completionRate?.status}</td>
              <td className="p-2 text-slate-600">Rows completed / rows assigned x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">3</td>
              <td className="p-2 border-r border-slate-300">Accuracy Rate</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.accuracyRate?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&ge; {k.accuracyRate?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.accuracyRate?.status}</td>
              <td className="p-2 text-slate-600">Rows verified correct / rows checked in QA sample x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">4</td>
              <td className="p-2 border-r border-slate-300">Rework Rate</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.reworkRate?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&le; {k.reworkRate?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.reworkRate?.status}</td>
              <td className="p-2 text-slate-600">Rows sent back / rows completed x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">5</td>
              <td className="p-2 border-r border-slate-300">On-Time Delivery</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.onTimeDelivery?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&ge; {k.onTimeDelivery?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.onTimeDelivery?.status}</td>
              <td className="p-2 text-slate-600">Tasks delivered on/before due date / tasks due x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">6</td>
              <td className="p-2 border-r border-slate-300">Coverage / Fill Rate</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.coverageRate?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&ge; {k.coverageRate?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.coverageRate?.status}</td>
              <td className="p-2 text-slate-600">Required fields filled with verified data / required fields total x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">7</td>
              <td className="p-2 border-r border-slate-300">Duplicate Rate</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.duplicateRate?.formatted}</td>
              <td className="p-2 border-r border-slate-300">&le; {k.duplicateRate?.target}%</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.duplicateRate?.status}</td>
              <td className="p-2 text-slate-600">Duplicate rows found / rows completed x 100</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-300 font-bold">8</td>
              <td className="p-2 border-r border-slate-300">Pending / Backlog</td>
              <td className="p-2 border-r border-slate-300 font-bold">{k.pendingBacklog?.formatted} tasks</td>
              <td className="p-2 border-r border-slate-300">0 overdue</td>
              <td className="p-2 border-r border-slate-300 font-bold uppercase">{k.pendingBacklog?.status}</td>
              <td className="p-2 text-slate-600">Assigned tasks not completed and past due date</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Team Table */}
      {teamData && teamData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
            Section 2: Analyst Performance Breakdown
          </h2>
          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300">Analyst</th>
                <th className="p-1.5 border-r border-slate-300">Team</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Completed</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Completion %</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Accuracy %</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Rework %</th>
                <th className="p-1.5 border-r border-slate-300 text-right">On-Time %</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Coverage %</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Duplicate %</th>
                <th className="p-1.5 text-right">Backlog</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-1.5 border-r border-slate-300 font-bold">{row.analystName}</td>
                  <td className="p-1.5 border-r border-slate-300">{row.team}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-medium">{row.kpis.completed.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.completionRate.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.accuracyRate.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.reworkRate.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.onTimeDelivery.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.coverageRate.formatted}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{row.kpis.duplicateRate.formatted}</td>
                  <td className="p-1.5 text-right font-bold">{row.kpis.pendingBacklog.formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / Handover Verification Note */}
      <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Zero Spend Guarantee: Built with 100% open-source software (Node.js, Express, React, MongoDB). Rs. 0 spent.</span>
        <span>Confidential &bull; Analyst Operations Internal Use Only</span>
      </div>
    </div>
  );
}
