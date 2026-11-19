import express from 'express';
import SyncService from '../services/syncService.js';
import db from '../database/dataStore.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/sync/status - Returns sync status, last updated, stale warning
router.get('/status', (req, res) => {
  const status = SyncService.getStatus();
  res.json(status);
});

// POST /api/sync/refresh - Manual "Refresh now" (Manager or Admin)
router.post('/refresh', requireRole(['Manager', 'Admin']), (req, res) => {
  const { simulateFailure } = req.body || {};
  const result = SyncService.refreshNow(req.user, simulateFailure);
  res.json(result);
});

// GET /api/sync/errors - Get all import errors flagged during tracker pulls
router.get('/errors', (req, res) => {
  const errors = db.get('import_errors').slice().reverse();
  res.json(errors);
});

// POST /api/sync/test-import - Test tracker import with optional bad data to verify error handling
router.post('/test-import', requireRole(['Manager', 'Admin']), (req, res) => {
  const records = req.body.records || [
    // 1 Valid sample record
    {
      source_record_id: `SRC-TEST-${Date.now()}`,
      analyst_id: 'USR-002',
      task_name: 'Ad-hoc Lead Qualification Batch',
      task_type: 'Lead Generation',
      sheet_type: 'B2B Companies',
      vertical: 'Fintech',
      city: 'Bangalore',
      date_assigned: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      rows_assigned: 250,
      rows_completed: 245
    },
    // 1 Invalid sample record missing 'due_date' and 'rows_assigned'
    {
      source_record_id: `SRC-FAIL-${Date.now()}`,
      analyst_id: 'USR-002',
      task_name: 'Corrupt Sheet Without Due Date or Assigned Count',
      vertical: 'Healthcare',
      city: 'Mumbai',
      date_assigned: new Date().toISOString().split('T')[0]
      // missing due_date and rows_assigned!
    }
  ];

  const outcome = SyncService.processImportRecords(records, req.user.name);
  res.json(outcome);
});

export default router;
