import db from '../database/dataStore.js';
import crypto from 'crypto';

/**
 * Sync & Data Import Service
 * Handles scheduled daily sync, manual "Refresh now", field validation,
 * error logging to import_errors table, and stale data tracking (> 24 hours).
 */
export class SyncService {
  /**
   * Check if the data is stale (over 24 hours since last successful sync)
   */
  static isDataStale() {
    const syncMeta = db.getSyncMeta();
    if (!syncMeta || !syncMeta.last_success_timestamp) return true;
    const lastSync = new Date(syncMeta.last_success_timestamp).getTime();
    const now = Date.now();
    const diffHours = (now - lastSync) / (1000 * 60 * 60);
    return diffHours >= 24;
  }

  /**
   * Get sync status and last updated metadata
   */
  static getStatus() {
    const meta = db.getSyncMeta();
    const isStale = this.isDataStale();
    const importErrors = db.get('import_errors');

    return {
      ...meta,
      is_stale: isStale,
      stale_warning: isStale ? 'Data is over 24 hours old. Please trigger a refresh.' : null,
      import_errors_count: importErrors.length
    };
  }

  /**
   * Validate and import records from source tracker.
   * If a required field is missing: flags the record in import-errors list,
   * does not fail the whole refresh silently, and does not invent a value!
   */
  static processImportRecords(records = [], triggeredBy = 'system') {
    const requiredFields = [
      'source_record_id',
      'analyst_id',
      'task_name',
      'vertical',
      'city',
      'date_assigned',
      'due_date',
      'rows_assigned'
    ];

    let importedCount = 0;
    const errorsEncountered = [];

    records.forEach(rec => {
      const missing = requiredFields.filter(field => rec[field] === undefined || rec[field] === null || rec[field] === '');
      
      if (missing.length > 0) {
        // Flag in import_errors list with source record ID and specific reason
        const errorRecord = {
          id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          source_record_id: rec.source_record_id || 'UNKNOWN_SOURCE_ID',
          error_reason: `Missing required field(s): ${missing.join(', ')}`,
          raw_data: rec,
          timestamp: new Date().toISOString()
        };
        db.insert('import_errors', errorRecord);
        errorsEncountered.push(errorRecord);
        return; // skip bad record without inventing values or failing whole batch
      }

      // Check if user exists
      const user = db.findOne('users', u => u.id === rec.analyst_id);
      if (!user) {
        const errorRecord = {
          id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          source_record_id: rec.source_record_id,
          error_reason: `Analyst ID '${rec.analyst_id}' does not match any registered analyst.`,
          raw_data: rec,
          timestamp: new Date().toISOString()
        };
        db.insert('import_errors', errorRecord);
        errorsEncountered.push(errorRecord);
        return;
      }

      // Valid record: upsert task
      const existing = db.findOne('tasks', t => t.source_record_id === rec.source_record_id);
      const taskDoc = {
        id: existing ? existing.id : `TSK-${100 + db.get('tasks').length + 1}`,
        analyst_id: rec.analyst_id,
        task_name: rec.task_name,
        task_type: rec.task_type || 'General Task',
        sheet_type: rec.sheet_type || 'Standard Sheet',
        vertical: rec.vertical,
        city: rec.city,
        date_assigned: rec.date_assigned,
        due_date: rec.due_date,
        delivery_date: rec.delivery_date || null,
        status: rec.status || 'In Progress',
        rows_assigned: Number(rec.rows_assigned) || 0,
        rows_completed: Number(rec.rows_completed) || 0,
        source_record_id: rec.source_record_id
      };

      if (existing) {
        db.update('tasks', t => t.id === existing.id, taskDoc);
      } else {
        db.insert('tasks', taskDoc);
      }

      // Optional QA and coverage linking
      if (rec.qa_sample) {
        const existingQA = db.findOne('qa_checks', q => q.task_id === taskDoc.id);
        const qaDoc = {
          id: existingQA ? existingQA.id : `QA-${taskDoc.id}`,
          task_id: taskDoc.id,
          date_checked: rec.qa_sample.date_checked || rec.delivery_date || rec.due_date,
          rows_checked: Number(rec.qa_sample.rows_checked) || 0,
          rows_correct: Number(rec.qa_sample.rows_correct) || 0,
          rows_reworked: Number(rec.qa_sample.rows_reworked) || 0,
          duplicates_found: Number(rec.qa_sample.duplicates_found) || 0
        };
        if (existingQA) {
          db.update('qa_checks', q => q.id === existingQA.id, qaDoc);
        } else {
          db.insert('qa_checks', qaDoc);
        }
      }

      if (rec.coverage) {
        const existingCov = db.findOne('coverage', c => c.task_id === taskDoc.id);
        const covDoc = {
          id: existingCov ? existingCov.id : `COV-${taskDoc.id}`,
          task_id: taskDoc.id,
          sheet_type: taskDoc.sheet_type,
          required_fields_total: Number(rec.coverage.required_fields_total) || 0,
          required_fields_filled: Number(rec.coverage.required_fields_filled) || 0,
          field_breakdown: rec.coverage.field_breakdown || {}
        };
        if (existingCov) {
          db.update('coverage', c => c.id === existingCov.id, covDoc);
        } else {
          db.insert('coverage', covDoc);
        }
      }

      importedCount++;
    });

    const nowIso = new Date().toISOString();
    db.updateSyncMeta({
      last_updated: nowIso,
      sync_status: 'success',
      last_success_timestamp: nowIso,
      last_sync_records_count: importedCount,
      error_message: null
    });

    // Create automatic zero-cost local backup snapshot
    db.createBackup('sync');

    return {
      success: true,
      importedCount,
      errorsCount: errorsEncountered.length,
      errors: errorsEncountered,
      last_updated: nowIso
    };
  }

  /**
   * Manual "Refresh now" for Managers
   * Simulates a live pull from the single source of truth tracker
   */
  static refreshNow(user, simulateFailure = false) {
    if (simulateFailure) {
      // Reliability requirement: a failed sync keeps the last good data, shows its timestamp, and logs failure
      const errorMsg = 'Failed to connect to source tracker API (HTTP 503 Service Unavailable)';
      db.updateSyncMeta({
        sync_status: 'failed',
        error_message: errorMsg
      });

      db.insert('audit_log', {
        id: `AUD-${Date.now()}`,
        user: user ? user.name : 'Manager',
        action: 'data sync failed',
        target_key: 'tracker_refresh',
        old_value: 'success',
        new_value: 'failed: 503 Service Unavailable',
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: errorMsg,
        last_updated: db.getSyncMeta().last_success_timestamp,
        kept_last_good_data: true
      };
    }

    // Normal refresh: touch timestamp and refresh metrics
    const nowIso = new Date().toISOString();
    db.updateSyncMeta({
      last_updated: nowIso,
      last_success_timestamp: nowIso,
      sync_status: 'success',
      error_message: null
    });

    db.insert('audit_log', {
      id: `AUD-${Date.now()}`,
      user: user ? user.name : 'Manager',
      action: 'manual refresh',
      target_key: 'tracker_refresh',
      old_value: 'manual sync triggered',
      new_value: 'success',
      timestamp: nowIso
    });

    return {
      success: true,
      message: 'Source tracker sync completed successfully.',
      last_updated: nowIso
    };
  }
}

export default SyncService;
