import express from 'express';
import db from '../database/dataStore.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import cache from '../database/cache.js';

const router = express.Router();

router.use(authenticate);

// Settings page is accessible to Manager and Admin only
router.use(requireRole(['Manager', 'Admin']));

// GET /api/settings - List all KPI targets, task type targets, coverage targets
router.get('/', (req, res) => {
  const settings = db.get('settings');
  const auditLogs = db.get('audit_log').slice(-50).reverse(); // Last 50 audit logs
  const users = db.get('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team,
    active: u.active
  }));

  res.json({
    settings,
    auditLogs,
    users
  });
});

// POST /api/settings/update - Update a KPI target / setting with audit logging
router.post('/update', (req, res) => {
  const { kpi_key, target_value, task_type, sheet_type } = req.body;

  if (!kpi_key || target_value === undefined) {
    return res.status(400).json({ error: 'kpi_key and target_value are required' });
  }

  const numValue = Number(target_value);
  if (isNaN(numValue)) {
    return res.status(400).json({ error: 'target_value must be a valid number' });
  }

  // Find setting matching key, task_type, sheet_type
  const predicate = (s) => {
    if (s.kpi_key !== kpi_key) return false;
    if (task_type && s.task_type !== task_type) return false;
    if (sheet_type && s.sheet_type !== sheet_type) return false;
    return true;
  };

  const existing = db.findOne('settings', predicate);
  const oldValue = existing ? existing.target_value : 'None';
  const nowIso = new Date().toISOString();

  if (existing) {
    db.update('settings', predicate, {
      target_value: numValue,
      updated_by: req.user.name || req.user.email,
      updated_at: nowIso
    });
  } else {
    db.insert('settings', {
      kpi_key,
      target_value: numValue,
      task_type: task_type || null,
      sheet_type: sheet_type || null,
      updated_by: req.user.name || req.user.email,
      updated_at: nowIso
    });
  }

  // Mandatory Requirement: "All changes audit-logged with who and when"
  const auditEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user: req.user.name || req.user.email,
    action: 'target edit',
    target_key: sheet_type ? `${kpi_key} (${sheet_type})` : (task_type ? `${kpi_key} (${task_type})` : kpi_key),
    old_value: oldValue,
    new_value: numValue,
    timestamp: nowIso
  };
  db.insert('audit_log', auditEntry);

  // Invalidate KPI caches so updated targets reflect immediately
  cache.del('kpi_cache:*').catch(() => {});

  res.json({
    success: true,
    message: 'Setting updated and audit logged successfully',
    setting: { kpi_key, target_value: numValue, updated_at: nowIso },
    auditEntry
  });
});

// POST /api/settings/users - Add or update a user (Admin only)
router.post('/users', requireRole(['Admin']), (req, res) => {
  const { id, name, email, role, team, active } = req.body;

  if (!id || !name || !email || !role) {
    return res.status(400).json({ error: 'id, name, email and role are required' });
  }

  const existing = db.findOne('users', u => u.id === id || u.email === email);
  const nowIso = new Date().toISOString();

  if (existing) {
    const oldRole = existing.role;
    db.update('users', u => u.id === existing.id, {
      name,
      email,
      role,
      team: team || existing.team,
      active: active !== undefined ? active : existing.active
    });

    db.insert('audit_log', {
      id: `AUD-${Date.now()}`,
      user: req.user.name,
      action: 'user change',
      target_key: `User ${name} (${id})`,
      old_value: `Role: ${oldRole}`,
      new_value: `Role: ${role}`,
      timestamp: nowIso
    });

    return res.json({ success: true, message: 'User updated successfully' });
  } else {
    // New user
    const newUser = {
      id,
      name,
      email,
      password: 'password123', // default initial password
      role,
      team: team || 'Alpha',
      active: active !== undefined ? active : true
    };
    db.insert('users', newUser);

    db.insert('audit_log', {
      id: `AUD-${Date.now()}`,
      user: req.user.name,
      action: 'user change',
      target_key: `User Created: ${name} (${id})`,
      old_value: 'None',
      new_value: `Role: ${role}, Team: ${newUser.team}`,
      timestamp: nowIso
    });

    return res.json({ success: true, message: 'User created successfully', user: newUser });
  }
});

// GET /api/settings/audit-logs
router.get('/audit-logs', (req, res) => {
  const logs = db.get('audit_log').slice().reverse();
  res.json(logs);
});

export default router;
