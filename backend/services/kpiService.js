import db from '../database/dataStore.js';

/**
 * KPI Calculation Engine (Single Source of Truth)
 * Implements the 8 KPI formulas defined in Section 5 of Technical Build Spec.
 */

export class KPIService {
  // Retrieve settings mapped by key
  static getSettingsMap() {
    const settingsList = db.get('settings');
    const map = {};
    settingsList.forEach(s => {
      const compositeKey = s.sheet_type 
        ? `${s.kpi_key}:${s.sheet_type}` 
        : (s.task_type ? `${s.kpi_key}:${s.task_type}` : s.kpi_key);
      map[compositeKey] = s;
      if (!map[s.kpi_key]) {
        map[s.kpi_key] = s;
      }
    });
    return map;
  }

  /**
   * Filter tasks based on query parameters
   */
  static filterTasks(filter = {}) {
    let tasks = db.get('tasks');
    const {
      startDate,
      endDate,
      analystId,
      team,
      vertical,
      city,
      taskType,
      sheetType,
      taskName
    } = filter;

    // Filter by date range (considers date_assigned or delivery_date or due_date)
    if (startDate) {
      tasks = tasks.filter(t => (t.delivery_date || t.due_date || t.date_assigned) >= startDate);
    }
    if (endDate) {
      tasks = tasks.filter(t => (t.delivery_date || t.due_date || t.date_assigned) <= endDate);
    }

    // Filter by analyst
    if (analystId && analystId !== 'all') {
      tasks = tasks.filter(t => t.analyst_id === analystId);
    }

    // Filter by team
    if (team && team !== 'all') {
      const users = db.get('users');
      const analystIdsInTeam = new Set(users.filter(u => u.team === team).map(u => u.id));
      tasks = tasks.filter(t => analystIdsInTeam.has(t.analyst_id));
    }

    // Filter by vertical
    if (vertical && vertical !== 'all') {
      tasks = tasks.filter(t => t.vertical === vertical);
    }

    // Filter by city
    if (city && city !== 'all') {
      tasks = tasks.filter(t => t.city === city);
    }

    // Filter by task type
    if (taskType && taskType !== 'all') {
      tasks = tasks.filter(t => t.task_type === taskType);
    }

    // Filter by sheet type
    if (sheetType && sheetType !== 'all') {
      tasks = tasks.filter(t => t.sheet_type === sheetType);
    }

    // Filter by task name or sheet name
    if (taskName && taskName !== 'all') {
      tasks = tasks.filter(t => t.task_name === taskName || t.id === taskName);
    }

    return tasks;
  }

  /**
   * Calculate all 8 KPIs for a filtered set of tasks
   */
  static calculateKPIs(filter = {}) {
    const tasks = this.filterTasks(filter);
    const taskIds = new Set(tasks.map(t => t.id));
    
    // Linked records
    const qaChecks = db.get('qa_checks').filter(q => taskIds.has(q.task_id));
    const coverageRecords = db.get('coverage').filter(c => taskIds.has(c.task_id));
    const settings = this.getSettingsMap();

    // 1. Tasks / rows completed
    // Formula: Count of rows completed in period
    const rowsCompleted = tasks.reduce((sum, t) => sum + (Number(t.rows_completed) || 0), 0);
    const tasksCompletedCount = tasks.filter(t => t.status === 'Completed').length;

    // Daily target calculation (reads from settings, dynamic)
    const targetCompletedSetting = settings['completed_daily_target'] || { target_value: 500 };
    const completedTarget = Number(targetCompletedSetting.target_value) || 500;

    // 2. Completion rate
    // Formula: Rows completed / rows assigned x 100
    // Target: 90% or above
    const rowsAssigned = tasks.reduce((sum, t) => sum + (Number(t.rows_assigned) || 0), 0);
    const completionRate = rowsAssigned > 0 
      ? Number(((rowsCompleted / rowsAssigned) * 100).toFixed(1)) 
      : null;
    const targetCompletionSetting = settings['completion_rate'] || { target_value: 90 };
    const completionTarget = Number(targetCompletionSetting.target_value) || 90;

    // 3. Accuracy rate
    // Formula: Rows verified correct / rows checked in QA sample x 100
    // Target: 95% or above
    // BLANK IS NOT ZERO: If no QA sample exists, shows null ("Not checked"), NEVER 0% or 100%!
    const rowsChecked = qaChecks.reduce((sum, q) => sum + (Number(q.rows_checked) || 0), 0);
    const rowsCorrect = qaChecks.reduce((sum, q) => sum + (Number(q.rows_correct) || 0), 0);
    const accuracyRate = rowsChecked > 0 
      ? Number(((rowsCorrect / rowsChecked) * 100).toFixed(1)) 
      : null;
    const targetAccuracySetting = settings['accuracy_rate'] || { target_value: 95 };
    const accuracyTarget = Number(targetAccuracySetting.target_value) || 95;

    // 4. Rework rate
    // Formula: Rows sent back / rows completed x 100
    // Target: 5% or below
    // No double counting: a reworked row counts once as completed (on final delivery) and once in rework rate.
    const rowsReworked = qaChecks.reduce((sum, q) => sum + (Number(q.rows_reworked) || 0), 0);
    const reworkRate = rowsCompleted > 0 
      ? Number(((rowsReworked / rowsCompleted) * 100).toFixed(1)) 
      : null;
    const targetReworkSetting = settings['rework_rate'] || { target_value: 5 };
    const reworkTarget = Number(targetReworkSetting.target_value) || 5;

    // 5. On-time delivery
    // Formula: Tasks delivered on / before due date / tasks due x 100
    // Target: 95% or above
    // Tasks due = all tasks in the filter period that have a due date
    const tasksDue = tasks.filter(t => t.due_date);
    const tasksOnTime = tasksDue.filter(t => {
      if (!t.delivery_date) return false;
      return t.delivery_date <= t.due_date;
    });
    const onTimeDelivery = tasksDue.length > 0 
      ? Number(((tasksOnTime.length / tasksDue.length) * 100).toFixed(1)) 
      : null;
    const targetOnTimeSetting = settings['on_time_delivery'] || { target_value: 95 };
    const onTimeTarget = Number(targetOnTimeSetting.target_value) || 95;

    // 6. Coverage / fill rate
    // Formula: Required fields filled with verified data / required fields total x 100
    // Target: Per sheet type (from settings)
    const requiredFieldsTotal = coverageRecords.reduce((sum, c) => sum + (Number(c.required_fields_total) || 0), 0);
    const requiredFieldsFilled = coverageRecords.reduce((sum, c) => sum + (Number(c.required_fields_filled) || 0), 0);
    const coverageRate = requiredFieldsTotal > 0 
      ? Number(((requiredFieldsFilled / requiredFieldsTotal) * 100).toFixed(1)) 
      : null;
    const targetCoverageSetting = settings['coverage_rate'] || { target_value: 85 };
    const coverageTarget = Number(targetCoverageSetting.target_value) || 85;

    // 7. Duplicate rate
    // Formula: Duplicate rows found / rows completed x 100
    // Target: 1% or below
    const duplicatesFound = qaChecks.reduce((sum, q) => sum + (Number(q.duplicates_found) || 0), 0);
    const duplicateRate = rowsCompleted > 0 
      ? Number(((duplicatesFound / rowsCompleted) * 100).toFixed(2)) 
      : null;
    const targetDuplicateSetting = settings['duplicate_rate'] || { target_value: 1.0 };
    const duplicateTarget = Number(targetDuplicateSetting.target_value) || 1.0;

    // 8. Pending / backlog
    // Formula: Count of assigned tasks not completed and past due date
    // Target: 0 overdue
    // Today's date reference for backlog check
    const today = new Date().toISOString().split('T')[0];
    const pendingTasks = tasks.filter(t => {
      const isNotCompleted = t.status !== 'Completed';
      const isPastDue = t.due_date && t.due_date < today;
      return isNotCompleted && isPastDue;
    });
    const pendingBacklog = pendingTasks.length;
    const targetBacklogSetting = settings['pending_backlog'] || { target_value: 0 };
    const backlogTarget = Number(targetBacklogSetting.target_value) || 0;

    // Package the 8 KPIs with status colors
    return {
      kpis: {
        completed: {
          key: 'completed',
          label: 'Tasks / Rows Completed',
          value: rowsCompleted,
          tasksCount: tasksCompletedCount,
          totalAssigned: rowsAssigned,
          target: completedTarget,
          unit: 'rows',
          status: this.getStatusColor('completed', rowsCompleted, completedTarget),
          formatted: rowsCompleted.toLocaleString(),
          subtext: `vs target ${completedTarget.toLocaleString()} rows`
        },
        completionRate: {
          key: 'completionRate',
          label: 'Completion Rate',
          value: completionRate,
          rowsCompleted,
          rowsAssigned,
          target: completionTarget,
          unit: '%',
          status: this.getStatusColor('completionRate', completionRate, completionTarget),
          formatted: completionRate !== null ? `${completionRate}%` : '—',
          subtext: `Target: ≥ ${completionTarget}%`
        },
        accuracyRate: {
          key: 'accuracyRate',
          label: 'Accuracy Rate',
          value: accuracyRate,
          rowsChecked,
          rowsCorrect,
          target: accuracyTarget,
          unit: '%',
          status: this.getStatusColor('accuracyRate', accuracyRate, accuracyTarget),
          formatted: accuracyRate !== null ? `${accuracyRate}%` : 'Not checked',
          subtext: accuracyRate !== null ? `Target: ≥ ${accuracyTarget}%` : 'No QA sample'
        },
        reworkRate: {
          key: 'reworkRate',
          label: 'Rework Rate',
          value: reworkRate,
          rowsReworked,
          rowsCompleted,
          target: reworkTarget,
          unit: '%',
          status: this.getStatusColor('reworkRate', reworkRate, reworkTarget),
          formatted: reworkRate !== null ? `${reworkRate}%` : '—',
          subtext: `Target: ≤ ${reworkTarget}%`
        },
        onTimeDelivery: {
          key: 'onTimeDelivery',
          label: 'On-Time Delivery',
          value: onTimeDelivery,
          tasksOnTime: tasksOnTime.length,
          tasksDue: tasksDue.length,
          target: onTimeTarget,
          unit: '%',
          status: this.getStatusColor('onTimeDelivery', onTimeDelivery, onTimeTarget),
          formatted: onTimeDelivery !== null ? `${onTimeDelivery}%` : '—',
          subtext: `Target: ≥ ${onTimeTarget}%`
        },
        coverageRate: {
          key: 'coverageRate',
          label: 'Coverage / Fill Rate',
          value: coverageRate,
          requiredFieldsFilled,
          requiredFieldsTotal,
          target: coverageTarget,
          unit: '%',
          status: this.getStatusColor('coverageRate', coverageRate, coverageTarget),
          formatted: coverageRate !== null ? `${coverageRate}%` : '—',
          subtext: `Target: ≥ ${coverageTarget}%`
        },
        duplicateRate: {
          key: 'duplicateRate',
          label: 'Duplicate Rate',
          value: duplicateRate,
          duplicatesFound,
          rowsCompleted,
          target: duplicateTarget,
          unit: '%',
          status: this.getStatusColor('duplicateRate', duplicateRate, duplicateTarget),
          formatted: duplicateRate !== null ? `${duplicateRate}%` : '—',
          subtext: `Target: ≤ ${duplicateTarget}%`
        },
        pendingBacklog: {
          key: 'pendingBacklog',
          label: 'Pending / Backlog',
          value: pendingBacklog,
          target: backlogTarget,
          unit: 'tasks',
          status: this.getStatusColor('pendingBacklog', pendingBacklog, backlogTarget),
          formatted: pendingBacklog.toString(),
          subtext: pendingBacklog > 0 ? 'Overdue tasks require action' : 'Zero overdue backlog'
        }
      },
      taskCount: tasks.length,
      filterApplied: filter
    };
  }

  /**
   * Status colours rule:
   * Green = at or better than target.
   * Amber = within 10% below target.
   * Red = more than 10% below target, or any overdue backlog.
   */
  static getStatusColor(kpiKey, value, target) {
    if (value === null || value === undefined) {
      return 'neutral'; // "Not checked" or "—"
    }

    // Lower is better metrics
    if (kpiKey === 'reworkRate' || kpiKey === 'duplicateRate') {
      if (value <= target) return 'green';
      if (value <= target * 1.10) return 'amber'; // Within 10% margin above target
      return 'red';
    }

    // Pending backlog (target is 0)
    if (kpiKey === 'pendingBacklog') {
      return value === 0 ? 'green' : 'red';
    }

    // Higher is better metrics (completed, completionRate, accuracyRate, onTimeDelivery, coverageRate)
    if (value >= target) {
      return 'green';
    }
    const amberThreshold = target * 0.90; // within 10% below target
    if (value >= amberThreshold) {
      return 'amber';
    }
    return 'red';
  }

  /**
   * 30-Day Trend Data: Completed and Accuracy by Day
   */
  static getTrendData(filter = {}, days = 30) {
    const tasks = this.filterTasks(filter);
    const qaChecks = db.get('qa_checks');
    const qaByTask = {};
    qaChecks.forEach(q => {
      qaByTask[q.task_id] = q;
    });

    // Group tasks by day (last N days)
    const dayMap = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dayMap[dateStr] = {
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completedRows: 0,
        rowsChecked: 0,
        rowsCorrect: 0,
        accuracy: null
      };
    }

    tasks.forEach(t => {
      const taskDate = t.delivery_date || t.date_assigned;
      if (dayMap[taskDate]) {
        dayMap[taskDate].completedRows += (Number(t.rows_completed) || 0);
        const qa = qaByTask[t.id];
        if (qa && qa.rows_checked > 0) {
          dayMap[taskDate].rowsChecked += qa.rows_checked;
          dayMap[taskDate].rowsCorrect += qa.rows_correct;
        }
      }
    });

    return Object.values(dayMap).map(day => {
      const acc = day.rowsChecked > 0 
        ? Number(((day.rowsCorrect / day.rowsChecked) * 100).toFixed(1)) 
        : null;
      return {
        date: day.date,
        displayDate: day.displayDate,
        completed: day.completedRows,
        accuracy: acc // null if not checked, rendering correctly without fake 0 or 100
      };
    });
  }

  /**
   * Team summary table: one row per analyst with all 8 KPIs
   */
  static getTeamTable(filter = {}) {
    const users = db.get('users').filter(u => u.role === 'Analyst' && u.active);
    const result = [];

    users.forEach(analyst => {
      // If filter specifies analystId, match only that analyst
      if (filter.analystId && filter.analystId !== 'all' && filter.analystId !== analyst.id) {
        return;
      }
      if (filter.team && filter.team !== 'all' && analyst.team !== filter.team) {
        return;
      }

      const analystFilter = { ...filter, analystId: analyst.id };
      const { kpis, taskCount } = this.calculateKPIs(analystFilter);

      result.push({
        analystId: analyst.id,
        analystName: analyst.name,
        analystEmail: analyst.email,
        team: analyst.team,
        taskCount,
        kpis: {
          completed: kpis.completed,
          completionRate: kpis.completionRate,
          accuracyRate: kpis.accuracyRate,
          reworkRate: kpis.reworkRate,
          onTimeDelivery: kpis.onTimeDelivery,
          coverageRate: kpis.coverageRate,
          duplicateRate: kpis.duplicateRate,
          pendingBacklog: kpis.pendingBacklog
        }
      });
    });

    return result;
  }

  /**
   * Work mix: Completed rows by vertical / city / sheet type
   */
  static getWorkMix(filter = {}) {
    const tasks = this.filterTasks(filter);
    
    const byVertical = {};
    const byCity = {};
    const bySheetType = {};

    tasks.forEach(t => {
      const rows = Number(t.rows_completed) || 0;
      byVertical[t.vertical] = (byVertical[t.vertical] || 0) + rows;
      byCity[t.city] = (byCity[t.city] || 0) + rows;
      bySheetType[t.sheet_type] = (bySheetType[t.sheet_type] || 0) + rows;
    });

    const formatBreakdown = (obj) => Object.entries(obj).map(([name, rows]) => ({ name, rows }));

    return {
      byVertical: formatBreakdown(byVertical),
      byCity: formatBreakdown(byCity),
      bySheetType: formatBreakdown(bySheetType)
    };
  }

  /**
   * Needs attention list: Overdue tasks, high rework (>5%), accuracy below 90%
   */
  static getNeedsAttention(filter = {}) {
    const tasks = this.filterTasks(filter);
    const qaChecks = db.get('qa_checks');
    const users = db.get('users');
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const qaMap = {};
    qaChecks.forEach(q => { qaMap[q.task_id] = q; });

    const today = new Date().toISOString().split('T')[0];
    const items = [];

    tasks.forEach(t => {
      const qa = qaMap[t.id];
      const analystName = userMap[t.analyst_id] || t.analyst_id;

      // 1. Overdue task
      if (t.status !== 'Completed' && t.due_date && t.due_date < today) {
        items.push({
          id: `attn-od-${t.id}`,
          taskId: t.id,
          taskName: t.task_name,
          analystName,
          analystId: t.analyst_id,
          issueType: 'Overdue Task',
          severity: 'high',
          metric: `${t.rows_assigned} rows pending`,
          dueDate: t.due_date,
          status: t.status,
          action: 'Delivery past due date'
        });
      }

      // 2. High rework (> 5%)
      if (qa && qa.rows_reworked > 0 && t.rows_completed > 0) {
        const reworkPct = (qa.rows_reworked / t.rows_completed) * 100;
        if (reworkPct > 5.0) {
          items.push({
            id: `attn-rw-${t.id}`,
            taskId: t.id,
            taskName: t.task_name,
            analystName,
            analystId: t.analyst_id,
            issueType: 'High Rework',
            severity: reworkPct > 10 ? 'high' : 'medium',
            metric: `${reworkPct.toFixed(1)}% rework (${qa.rows_reworked} rows)`,
            dueDate: t.due_date,
            status: t.status,
            action: 'Review returned rows'
          });
        }
      }

      // 3. Accuracy below 90%
      if (qa && qa.rows_checked > 0) {
        const accuracyPct = (qa.rows_correct / qa.rows_checked) * 100;
        if (accuracyPct < 90.0) {
          items.push({
            id: `attn-acc-${t.id}`,
            taskId: t.id,
            taskName: t.task_name,
            analystName,
            analystId: t.analyst_id,
            issueType: 'Low Accuracy',
            severity: 'high',
            metric: `${accuracyPct.toFixed(1)}% QA accuracy`,
            dueDate: t.due_date,
            status: t.status,
            action: 'QA verification failed target'
          });
        }
      }
    });

    return items;
  }

  /**
   * Drill-down everywhere:
   * Clicking a KPI, chart point or table row opens the underlying tasks / rows.
   * Row counts MUST match the KPI value exactly!
   */
  static getDrilldown(kpiKey, filter = {}) {
    const tasks = this.filterTasks(filter);
    const qaChecks = db.get('qa_checks');
    const coverage = db.get('coverage');
    const users = db.get('users');

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const qaMap = {};
    qaChecks.forEach(q => { qaMap[q.task_id] = q; });

    const covMap = {};
    coverage.forEach(c => { covMap[c.task_id] = c; });

    const today = new Date().toISOString().split('T')[0];

    let matchingTasks = [];
    let summaryMetric = '';

    switch (kpiKey) {
      case 'completed':
        matchingTasks = tasks.filter(t => (Number(t.rows_completed) || 0) > 0);
        summaryMetric = `${matchingTasks.reduce((s, t) => s + t.rows_completed, 0)} completed rows across ${matchingTasks.length} tasks`;
        break;

      case 'completionRate':
        matchingTasks = tasks;
        summaryMetric = `Assigned vs Completed comparison for ${tasks.length} tasks`;
        break;

      case 'accuracyRate':
        matchingTasks = tasks.filter(t => qaMap[t.id] && qaMap[t.id].rows_checked > 0);
        summaryMetric = `${matchingTasks.length} tasks with QA verification samples`;
        break;

      case 'reworkRate':
        matchingTasks = tasks.filter(t => qaMap[t.id] && qaMap[t.id].rows_reworked > 0);
        summaryMetric = `${matchingTasks.length} tasks with rework reported`;
        break;

      case 'onTimeDelivery':
        matchingTasks = tasks.filter(t => t.due_date);
        summaryMetric = `${matchingTasks.length} tasks with due dates in period`;
        break;

      case 'coverageRate':
        matchingTasks = tasks.filter(t => covMap[t.id]);
        summaryMetric = `${matchingTasks.length} sheets with field coverage tracking`;
        break;

      case 'duplicateRate':
        matchingTasks = tasks.filter(t => qaMap[t.id] && qaMap[t.id].duplicates_found > 0);
        summaryMetric = `${matchingTasks.length} tasks with duplicates identified`;
        break;

      case 'pendingBacklog':
        matchingTasks = tasks.filter(t => t.status !== 'Completed' && t.due_date && t.due_date < today);
        summaryMetric = `${matchingTasks.length} overdue tasks pending completion`;
        break;

      default:
        matchingTasks = tasks;
        summaryMetric = `${tasks.length} tasks found`;
        break;
    }

    const rows = matchingTasks.map(t => {
      const qa = qaMap[t.id] || {};
      const cov = covMap[t.id] || {};
      return {
        id: t.id,
        source_record_id: t.source_record_id,
        task_name: t.task_name,
        analyst_name: userMap[t.analyst_id] || t.analyst_id,
        analyst_id: t.analyst_id,
        vertical: t.vertical,
        city: t.city,
        sheet_type: t.sheet_type,
        task_type: t.task_type,
        date_assigned: t.date_assigned,
        due_date: t.due_date,
        delivery_date: t.delivery_date,
        status: t.status,
        rows_assigned: t.rows_assigned,
        rows_completed: t.rows_completed,
        // QA metrics
        rows_checked: qa.rows_checked !== undefined ? qa.rows_checked : '—',
        rows_correct: qa.rows_correct !== undefined ? qa.rows_correct : '—',
        rows_reworked: qa.rows_reworked !== undefined ? qa.rows_reworked : 0,
        duplicates_found: qa.duplicates_found !== undefined ? qa.duplicates_found : 0,
        // Coverage metrics
        fields_total: cov.required_fields_total || '—',
        fields_filled: cov.required_fields_filled || '—'
      };
    });

    return {
      kpiKey,
      count: rows.length,
      summaryMetric,
      rows
    };
  }
}

export default KPIService;
