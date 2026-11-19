import express from 'express';
import db from '../database/dataStore.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/tasks - List all tasks / sheets
router.get('/', (req, res) => {
  let tasks = db.get('tasks');
  const users = db.get('users');
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.name; });

  // Access control: Analyst sees only own sheets
  if (req.user.role === 'Analyst') {
    tasks = tasks.filter(t => t.analyst_id === req.user.id);
  }

  const result = tasks.map(t => ({
    ...t,
    analyst_name: userMap[t.analyst_id] || t.analyst_id
  }));

  res.json(result);
});

// GET /api/tasks/:id - Detailed Task / Sheet View
router.get('/:id', (req, res) => {
  const task = db.findOne('tasks', t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task / sheet not found' });
  }

  // Role check: Analyst cannot view another analyst's sheet
  if (req.user.role === 'Analyst' && task.analyst_id !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden: You are only permitted to view your own assigned sheets.'
    });
  }

  const qaCheck = db.findOne('qa_checks', q => q.task_id === task.id) || null;
  const coverage = db.findOne('coverage', c => c.task_id === task.id) || null;
  const analyst = db.findOne('users', u => u.id === task.analyst_id);

  // Generate realistic sample row-level data for this sheet (demonstrating underlying rows)
  const underlyingRows = [];
  const rowCount = Math.min(task.rows_assigned, 20); // Display sample of rows
  for (let i = 1; i <= rowCount; i++) {
    const isCompleted = i <= (task.rows_completed / (task.rows_assigned || 1)) * rowCount;
    const isQAChecked = qaCheck && i <= 5;
    const isCorrect = isQAChecked && (i !== 4 || qaCheck.rows_reworked === 0);
    underlyingRows.push({
      row_index: i,
      record_id: `REC-${task.id.replace('TSK-', '')}-${1000 + i}`,
      company_name: `Enterprise Account #${1000 + i}`,
      lead_contact: `Contact Lead ${i}`,
      email_status: isCompleted ? 'Verified Valid' : 'Unprocessed',
      phone_status: isCompleted ? (coverage?.field_breakdown?.phone ? 'Discovered & Formatted' : 'Missing') : 'Unprocessed',
      qa_status: isQAChecked ? (isCorrect ? 'Pass' : 'Rework Needed') : 'Unsampled',
      updated_at: task.delivery_date || task.date_assigned
    });
  }

  res.json({
    task,
    analyst: analyst ? { id: analyst.id, name: analyst.name, email: analyst.email, team: analyst.team } : null,
    qa_check: qaCheck,
    coverage,
    underlying_rows: underlyingRows
  });
});

export default router;
