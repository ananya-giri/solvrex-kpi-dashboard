import express from 'express';
import KPIService from '../services/kpiService.js';
import { authenticate, enforceAnalystIsolation } from '../middleware/auth.js';
import db from '../database/dataStore.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceAnalystIsolation);

// GET /api/kpi/summary - The 8 KPIs with current filters
router.get('/summary', (req, res) => {
  try {
    const summary = KPIService.calculateKPIs(req.query);
    const syncMeta = db.getSyncMeta();
    res.json({
      ...summary,
      last_updated: syncMeta.last_updated,
      is_stale: (Date.now() - new Date(syncMeta.last_success_timestamp).getTime()) > 24 * 60 * 60 * 1000
    });
  } catch (err) {
    console.error('Error calculating KPIs:', err);
    res.status(500).json({ error: 'Internal error calculating KPIs' });
  }
});

// GET /api/kpi/trend - 30-day trend chart
router.get('/trend', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trend = KPIService.getTrendData(req.query, days);
    res.json(trend);
  } catch (err) {
    console.error('Error fetching trend data:', err);
    res.status(500).json({ error: 'Internal error generating trend chart' });
  }
});

// GET /api/kpi/team - Team summary table (one row per analyst)
router.get('/team', (req, res) => {
  try {
    // If analyst, return only their row
    if (req.user.role === 'Analyst') {
      const single = KPIService.getTeamTable({ ...req.query, analystId: req.user.id });
      return res.json(single);
    }
    const teamData = KPIService.getTeamTable(req.query);
    res.json(teamData);
  } catch (err) {
    console.error('Error fetching team table:', err);
    res.status(500).json({ error: 'Internal error generating team table' });
  }
});

// GET /api/kpi/work-mix - Bar chart breakdown by vertical / city / sheet type
router.get('/work-mix', (req, res) => {
  try {
    const mix = KPIService.getWorkMix(req.query);
    res.json(mix);
  } catch (err) {
    console.error('Error fetching work mix:', err);
    res.status(500).json({ error: 'Internal error calculating work mix' });
  }
});

// GET /api/kpi/needs-attention - Overdue tasks, high rework, accuracy below 90%
router.get('/needs-attention', (req, res) => {
  try {
    const items = KPIService.getNeedsAttention(req.query);
    res.json(items);
  } catch (err) {
    console.error('Error fetching needs attention:', err);
    res.status(500).json({ error: 'Internal error fetching attention items' });
  }
});

// GET /api/kpi/drilldown - Underlying rows for any clicked KPI or chart point
router.get('/drilldown', (req, res) => {
  try {
    const { kpiKey } = req.query;
    if (!kpiKey) {
      return res.status(400).json({ error: 'kpiKey parameter is required' });
    }
    const drilldown = KPIService.getDrilldown(kpiKey, req.query);
    res.json(drilldown);
  } catch (err) {
    console.error('Error fetching drilldown:', err);
    res.status(500).json({ error: 'Internal error retrieving drilldown records' });
  }
});

// GET /api/kpi/filter-options - Distinct lists for filter dropdowns
router.get('/filter-options', (req, res) => {
  try {
    const tasks = db.get('tasks');
    const users = db.get('users');

    const analysts = users
      .filter(u => u.role === 'Analyst')
      .map(u => ({ id: u.id, name: u.name, team: u.team }));

    const teams = [...new Set(users.map(u => u.team).filter(Boolean))];
    const verticals = [...new Set(tasks.map(t => t.vertical).filter(Boolean))];
    const cities = [...new Set(tasks.map(t => t.city).filter(Boolean))];
    const taskTypes = [...new Set(tasks.map(t => t.task_type).filter(Boolean))];
    const sheetTypes = [...new Set(tasks.map(t => t.sheet_type).filter(Boolean))];
    const sheets = tasks.map(t => ({ id: t.id, name: t.task_name, analyst_id: t.analyst_id }));

    res.json({
      analysts,
      teams,
      verticals,
      cities,
      taskTypes,
      sheetTypes,
      sheets
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching filter options' });
  }
});

export default router;
