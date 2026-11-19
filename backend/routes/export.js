import express from 'express';
import ExcelJS from 'exceljs';
import KPIService from '../services/kpiService.js';
import { authenticate, enforceAnalystIsolation } from '../middleware/auth.js';
import db from '../database/dataStore.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceAnalystIsolation);

/**
 * Helper to build export dataset matching current filtered view
 */
function buildExportData(filter) {
  const kpiData = KPIService.calculateKPIs(filter);
  const tasks = KPIService.filterTasks(filter);
  const qaChecks = db.get('qa_checks');
  const coverage = db.get('coverage');
  const users = db.get('users');

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.name; });
  const qaMap = {};
  qaChecks.forEach(q => { qaMap[q.task_id] = q; });
  const covMap = {};
  coverage.forEach(c => { covMap[c.task_id] = c; });

  const rows = tasks.map(t => {
    const qa = qaMap[t.id] || {};
    const cov = covMap[t.id] || {};
    return {
      task_id: t.id,
      source_record_id: t.source_record_id,
      task_name: t.task_name,
      analyst_name: userMap[t.analyst_id] || t.analyst_id,
      analyst_id: t.analyst_id,
      team: (users.find(u => u.id === t.analyst_id) || {}).team || 'N/A',
      vertical: t.vertical,
      city: t.city,
      sheet_type: t.sheet_type,
      task_type: t.task_type,
      date_assigned: t.date_assigned,
      due_date: t.due_date,
      delivery_date: t.delivery_date || 'Pending',
      status: t.status,
      rows_assigned: t.rows_assigned,
      rows_completed: t.rows_completed,
      qa_checked: qa.rows_checked !== undefined ? qa.rows_checked : 'Not checked',
      qa_correct: qa.rows_correct !== undefined ? qa.rows_correct : '—',
      qa_reworked: qa.rows_reworked !== undefined ? qa.rows_reworked : 0,
      duplicates_found: qa.duplicates_found !== undefined ? qa.duplicates_found : 0,
      field_coverage_total: cov.required_fields_total || '—',
      field_coverage_filled: cov.required_fields_filled || '—'
    };
  });

  return { kpiData, rows };
}

/**
 * GET /api/export/csv
 * Exports the filtered view to CSV
 */
router.get('/csv', async (req, res) => {
  try {
    const { rows } = buildExportData(req.query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="KPI_Dashboard_Filtered_View.csv"');

    // Write CSV header
    const headers = [
      'Task ID',
      'Source Record ID',
      'Task / Sheet Name',
      'Analyst Name',
      'Analyst ID',
      'Team',
      'Vertical',
      'City',
      'Sheet Type',
      'Task Type',
      'Date Assigned',
      'Due Date',
      'Delivery Date',
      'Status',
      'Rows Assigned',
      'Rows Completed',
      'QA Sample Checked',
      'QA Correct',
      'QA Reworked',
      'Duplicates Found',
      'Required Fields Total',
      'Required Fields Filled'
    ];

    res.write(headers.join(',') + '\n');

    rows.forEach(r => {
      const line = [
        `"${r.task_id}"`,
        `"${r.source_record_id}"`,
        `"${(r.task_name || '').replace(/"/g, '""')}"`,
        `"${r.analyst_name}"`,
        `"${r.analyst_id}"`,
        `"${r.team}"`,
        `"${r.vertical}"`,
        `"${r.city}"`,
        `"${r.sheet_type}"`,
        `"${r.task_type}"`,
        `"${r.date_assigned}"`,
        `"${r.due_date}"`,
        `"${r.delivery_date}"`,
        `"${r.status}"`,
        r.rows_assigned,
        r.rows_completed,
        `"${r.qa_checked}"`,
        `"${r.qa_correct}"`,
        r.qa_reworked,
        r.duplicates_found,
        `"${r.field_coverage_total}"`,
        `"${r.field_coverage_filled}"`
      ];
      res.write(line.join(',') + '\n');
    });

    res.end();
  } catch (err) {
    console.error('CSV Export Error:', err);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

/**
 * GET /api/export/excel
 * Exports filtered view with both KPI Summary sheet and Detailed Tasks sheet
 */
router.get('/excel', async (req, res) => {
  try {
    const { kpiData, rows } = buildExportData(req.query);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Analyst KPI Dashboard (Zero Spend)';
    workbook.created = new Date();

    // Sheet 1: 8 KPIs Summary
    const summarySheet = workbook.addWorksheet('8 KPIs Summary');
    summarySheet.columns = [
      { header: 'KPI Number', key: 'kpi_num', width: 12 },
      { header: 'KPI Name', key: 'name', width: 28 },
      { header: 'Current Value', key: 'val', width: 18 },
      { header: 'Target (Setting)', key: 'target', width: 18 },
      { header: 'Status Color', key: 'status', width: 15 },
      { header: 'Notes / Formula', key: 'formula', width: 45 }
    ];

    const k = kpiData.kpis;
    summarySheet.addRows([
      { kpi_num: '1', name: 'Tasks / Rows Completed', val: k.completed.formatted, target: `${k.completed.target} rows`, status: k.completed.status.toUpperCase(), formula: 'Count of rows completed in period' },
      { kpi_num: '2', name: 'Completion Rate', val: k.completionRate.formatted, target: `≥ ${k.completionRate.target}%`, status: k.completionRate.status.toUpperCase(), formula: 'Rows completed / rows assigned x 100' },
      { kpi_num: '3', name: 'Accuracy Rate', val: k.accuracyRate.formatted, target: `≥ ${k.accuracyRate.target}%`, status: k.accuracyRate.status.toUpperCase(), formula: 'Rows verified correct / rows checked in QA sample x 100' },
      { kpi_num: '4', name: 'Rework Rate', val: k.reworkRate.formatted, target: `≤ ${k.reworkRate.target}%`, status: k.reworkRate.status.toUpperCase(), formula: 'Rows sent back / rows completed x 100' },
      { kpi_num: '5', name: 'On-Time Delivery', val: k.onTimeDelivery.formatted, target: `≥ ${k.onTimeDelivery.target}%`, status: k.onTimeDelivery.status.toUpperCase(), formula: 'Tasks delivered on/before due date / tasks due x 100' },
      { kpi_num: '6', name: 'Coverage / Fill Rate', val: k.coverageRate.formatted, target: `≥ ${k.coverageRate.target}%`, status: k.coverageRate.status.toUpperCase(), formula: 'Required fields filled / required fields total x 100' },
      { kpi_num: '7', name: 'Duplicate Rate', val: k.duplicateRate.formatted, target: `≤ ${k.duplicateRate.target}%`, status: k.duplicateRate.status.toUpperCase(), formula: 'Duplicate rows found / rows completed x 100' },
      { kpi_num: '8', name: 'Pending / Backlog', val: k.pendingBacklog.formatted, target: '0 overdue', status: k.pendingBacklog.status.toUpperCase(), formula: 'Assigned tasks not completed and past due date' }
    ]);

    // Style summary headers
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    // Sheet 2: Underlying Rows Data
    const tasksSheet = workbook.addWorksheet('Underlying Tasks & Rows');
    tasksSheet.columns = [
      { header: 'Task ID', key: 'task_id', width: 14 },
      { header: 'Source ID', key: 'source_record_id', width: 18 },
      { header: 'Task / Sheet Name', key: 'task_name', width: 32 },
      { header: 'Analyst Name', key: 'analyst_name', width: 20 },
      { header: 'Team', key: 'team', width: 14 },
      { header: 'Vertical', key: 'vertical', width: 16 },
      { header: 'City', key: 'city', width: 14 },
      { header: 'Sheet Type', key: 'sheet_type', width: 22 },
      { header: 'Assigned', key: 'date_assigned', width: 14 },
      { header: 'Due Date', key: 'due_date', width: 14 },
      { header: 'Delivery Date', key: 'delivery_date', width: 14 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assigned Rows', key: 'rows_assigned', width: 15 },
      { header: 'Completed Rows', key: 'rows_completed', width: 16 },
      { header: 'QA Checked', key: 'qa_checked', width: 14 },
      { header: 'QA Correct', key: 'qa_correct', width: 14 },
      { header: 'QA Reworked', key: 'qa_reworked', width: 14 },
      { header: 'Duplicates', key: 'duplicates_found', width: 14 }
    ];

    tasksSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tasksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };

    rows.forEach(r => tasksSheet.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="KPI_Dashboard_Filtered_View.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

/**
 * GET /api/export/pdf-data
 * Returns formatted data payload optimized for browser Print-to-PDF
 * (Complies with Section 2: "browser Print to PDF for PDF. No paid PDF or reporting library.")
 */
router.get('/pdf-data', (req, res) => {
  const { kpiData, rows } = buildExportData(req.query);
  const syncMeta = db.getSyncMeta();
  res.json({
    generatedAt: new Date().toISOString(),
    lastUpdated: syncMeta.last_updated,
    kpis: kpiData.kpis,
    taskCount: kpiData.taskCount,
    rows: rows.slice(0, 100), // First 100 rows for neat printable view
    totalRowsCount: rows.length
  });
});

export default router;
