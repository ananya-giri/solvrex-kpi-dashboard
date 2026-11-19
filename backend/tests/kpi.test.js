import test from 'node:test';
import assert from 'node:assert/strict';
import KPIService from '../services/kpiService.js';
import db from '../database/dataStore.js';
import { seedDatabase } from '../seed/seedData.js';

// Initialize clean seed before running tests
seedDatabase();

test('KPI 1: Tasks / rows completed formula matches hand-checked total', () => {
  const allTasks = db.get('tasks');
  const expectedRows = allTasks.reduce((s, t) => s + (t.rows_completed || 0), 0);
  
  const result = KPIService.calculateKPIs();
  assert.equal(result.kpis.completed.value, expectedRows);
  assert.ok(result.kpis.completed.value > 0);
});

test('KPI 2: Completion rate = (rows completed / rows assigned) * 100', () => {
  const allTasks = db.get('tasks');
  const totalAssigned = allTasks.reduce((s, t) => s + (t.rows_assigned || 0), 0);
  const totalCompleted = allTasks.reduce((s, t) => s + (t.rows_completed || 0), 0);
  const expectedRate = Number(((totalCompleted / totalAssigned) * 100).toFixed(1));

  const result = KPIService.calculateKPIs();
  assert.equal(result.kpis.completionRate.value, expectedRate);
  assert.equal(result.kpis.completionRate.rowsCompleted, totalCompleted);
  assert.equal(result.kpis.completionRate.rowsAssigned, totalAssigned);
});

test('KPI 3: Accuracy rate = (rows correct / rows checked in QA) * 100', () => {
  const result = KPIService.calculateKPIs();
  const qaChecks = db.get('qa_checks');
  const checked = qaChecks.reduce((s, q) => s + q.rows_checked, 0);
  const correct = qaChecks.reduce((s, q) => s + q.rows_correct, 0);
  const expectedAccuracy = Number(((correct / checked) * 100).toFixed(1));

  assert.equal(result.kpis.accuracyRate.value, expectedAccuracy);
  assert.equal(result.kpis.accuracyRate.rowsChecked, checked);
  assert.equal(result.kpis.accuracyRate.rowsCorrect, correct);
});

test('KPI 3 Zero-QA Case: Accuracy shows null / "Not checked" when rows_checked is 0 (NEVER 0% or 100%)', () => {
  // Test with a specific task that has rows_checked = 0 (TSK-109)
  const result = KPIService.calculateKPIs({ taskName: 'TSK-109' });
  assert.equal(result.kpis.accuracyRate.value, null, 'Accuracy value must be null when QA sample is 0');
  assert.equal(result.kpis.accuracyRate.formatted, 'Not checked', 'Formatted label must be "Not checked"');
  assert.notEqual(result.kpis.accuracyRate.value, 0, 'Must NOT be 0%');
  assert.notEqual(result.kpis.accuracyRate.value, 100, 'Must NOT be 100%');
});

test('KPI 4: Rework rate = (rows sent back / rows completed) * 100 (No double counting)', () => {
  const result = KPIService.calculateKPIs();
  const qaChecks = db.get('qa_checks');
  const allTasks = db.get('tasks');
  const totalCompleted = allTasks.reduce((s, t) => s + (t.rows_completed || 0), 0);
  const totalReworked = qaChecks.reduce((s, q) => s + (q.rows_reworked || 0), 0);
  const expectedRework = Number(((totalReworked / totalCompleted) * 100).toFixed(1));

  assert.equal(result.kpis.reworkRate.value, expectedRework);
  assert.equal(result.kpis.reworkRate.rowsReworked, totalReworked);
});

test('KPI 5: On-time delivery = (tasks delivered on/before due date / tasks due) * 100', () => {
  const result = KPIService.calculateKPIs();
  const tasksDue = db.get('tasks').filter(t => t.due_date);
  const tasksOnTime = tasksDue.filter(t => t.delivery_date && t.delivery_date <= t.due_date);
  const expectedOnTime = Number(((tasksOnTime.length / tasksDue.length) * 100).toFixed(1));

  assert.equal(result.kpis.onTimeDelivery.value, expectedOnTime);
  assert.equal(result.kpis.onTimeDelivery.tasksOnTime, tasksOnTime.length);
  assert.equal(result.kpis.onTimeDelivery.tasksDue, tasksDue.length);
});

test('KPI 6: Coverage / fill rate = (required fields filled / required fields total) * 100', () => {
  const result = KPIService.calculateKPIs();
  const coverage = db.get('coverage');
  const total = coverage.reduce((s, c) => s + c.required_fields_total, 0);
  const filled = coverage.reduce((s, c) => s + c.required_fields_filled, 0);
  const expectedCoverage = Number(((filled / total) * 100).toFixed(1));

  assert.equal(result.kpis.coverageRate.value, expectedCoverage);
  assert.equal(result.kpis.coverageRate.requiredFieldsTotal, total);
  assert.equal(result.kpis.coverageRate.requiredFieldsFilled, filled);
});

test('KPI 7: Duplicate rate = (duplicate rows found / rows completed) * 100', () => {
  const result = KPIService.calculateKPIs();
  const qaChecks = db.get('qa_checks');
  const allTasks = db.get('tasks');
  const totalCompleted = allTasks.reduce((s, t) => s + (t.rows_completed || 0), 0);
  const totalDuplicates = qaChecks.reduce((s, q) => s + (q.duplicates_found || 0), 0);
  const expectedDupRate = Number(((totalDuplicates / totalCompleted) * 100).toFixed(2));

  assert.equal(result.kpis.duplicateRate.value, expectedDupRate);
  assert.equal(result.kpis.duplicateRate.duplicatesFound, totalDuplicates);
});

test('KPI 8: Pending / backlog = count of assigned tasks not completed and past due date', () => {
  const result = KPIService.calculateKPIs();
  assert.ok(result.kpis.pendingBacklog.value >= 1, 'Should find overdue task TSK-108');
  assert.equal(result.kpis.pendingBacklog.status, 'red', 'Overdue backlog must be status RED');
});

test('Status colours: Green (at or better), Amber (within 10% below), Red (>10% below)', () => {
  // Completion rate (target 90%)
  assert.equal(KPIService.getStatusColor('completionRate', 92, 90), 'green');
  assert.equal(KPIService.getStatusColor('completionRate', 85, 90), 'amber'); // 85 >= 81
  assert.equal(KPIService.getStatusColor('completionRate', 75, 90), 'red');   // 75 < 81

  // Rework rate (lower is better, target 5%)
  assert.equal(KPIService.getStatusColor('reworkRate', 3.5, 5), 'green');
  assert.equal(KPIService.getStatusColor('reworkRate', 5.2, 5), 'amber');
  assert.equal(KPIService.getStatusColor('reworkRate', 6.5, 5), 'red');

  // Pending backlog (target 0)
  assert.equal(KPIService.getStatusColor('pendingBacklog', 0, 0), 'green');
  assert.equal(KPIService.getStatusColor('pendingBacklog', 1, 0), 'red');
});

test('Drill-down returns exact underlying tasks and row count matches KPI value', () => {
  const drilldownCompleted = KPIService.getDrilldown('completed');
  assert.ok(drilldownCompleted.count > 0);
  assert.ok(drilldownCompleted.rows.length === drilldownCompleted.count);

  const drilldownPending = KPIService.getDrilldown('pendingBacklog');
  const summary = KPIService.calculateKPIs();
  assert.equal(drilldownPending.count, summary.kpis.pendingBacklog.value);
});
