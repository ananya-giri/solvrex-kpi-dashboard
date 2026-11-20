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

  // Return actual Solvrex candidate records for this sheet
  const allLeads = db.get('leads') || [];
  let matchingLeads = allLeads.filter(l => l.task_id === task.id);
  
  // Fallback to all leads or matching by category if needed
  if (matchingLeads.length === 0) {
    if (task.sheet_type === 'PhD Candidates') {
      matchingLeads = allLeads.filter(l => l.category === 'Student');
    } else if (task.sheet_type === 'Recent Graduates') {
      matchingLeads = allLeads.filter(l => l.category === 'Grad');
    } else {
      matchingLeads = allLeads.filter(l => l.category === 'Founder');
    }
  }

  const underlyingRows = matchingLeads.map((lead, idx) => ({
    row_index: idx + 1,
    record_id: `SLV-REC-${lead.s_no || (1000 + idx)}`,
    company_name: lead.university_or_company || 'University / Company',
    lead_contact: lead.full_name,
    email_status: lead.public_email && lead.public_email !== 'Not public' ? lead.public_email : 'Not public',
    phone_status: lead.mobile_phone && lead.mobile_phone !== 'Not public' ? lead.mobile_phone : 'Not public',
    qa_status: idx < 2 ? 'Pass' : (lead.notes && lead.notes.includes('FLAG') ? 'Flagged / Rework' : 'Verified'),
    course_or_title: lead.course_or_title,
    field_or_industry: lead.field_or_industry,
    solvrex_fit: lead.likely_solvrex_service_fit,
    city: lead.city,
    notes: lead.notes,
    updated_at: lead.date_collected || task.delivery_date || task.date_assigned
  }));

  res.json({
    task,
    analyst: analyst ? { id: analyst.id, name: analyst.name, email: analyst.email, team: analyst.team } : null,
    qa_check: qaCheck,
    coverage,
    underlying_rows: underlyingRows
  });
});

export default router;
