import mongoose from 'mongoose';

/*
  Data model as specified in Section 4:
  - users: id, name, email, role (Manager / Analyst / Admin), team, active flag
  - tasks: id, analyst_id, task / sheet name, vertical, city, date assigned, due_date, delivery_date, status, rows_assigned, rows_completed
  - qa_checks: id, task_id, date checked, rows_checked, rows_correct, rows_reworked, duplicates_found
  - coverage: task_id, required_fields_total, required_fields_filled (phone, website, email, social)
  - settings: kpi key, target value, task type / sheet type where applicable, updated_by, updated_at
  - audit_log: id, user, action (target edit / data edit / user change), old value, new value, timestamp
  - import_errors: source record ID, reason, raw data, timestamp
*/

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'Analyst', 'Admin'], required: true },
  team: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  analyst_id: { type: String, required: true },
  task_name: { type: String, required: true },
  task_type: { type: String, required: true },
  sheet_type: { type: String, required: true },
  vertical: { type: String, required: true },
  city: { type: String, required: true },
  date_assigned: { type: String, required: true }, // YYYY-MM-DD
  due_date: { type: String, required: true }, // YYYY-MM-DD
  delivery_date: { type: String, default: null }, // YYYY-MM-DD or null
  status: { 
    type: String, 
    enum: ['In Progress', 'Completed', 'Pending Review', 'Rework', 'Overdue'], 
    default: 'In Progress' 
  },
  rows_assigned: { type: Number, required: true, default: 0 },
  rows_completed: { type: Number, required: true, default: 0 },
  source_record_id: { type: String, required: true }
}, { timestamps: true });

const QACheckSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  task_id: { type: String, required: true },
  date_checked: { type: String, required: true },
  rows_checked: { type: Number, default: 0 },
  rows_correct: { type: Number, default: 0 },
  rows_reworked: { type: Number, default: 0 },
  duplicates_found: { type: Number, default: 0 }
}, { timestamps: true });

const CoverageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  task_id: { type: String, required: true },
  sheet_type: { type: String, required: true },
  required_fields_total: { type: Number, required: true, default: 0 },
  required_fields_filled: { type: Number, required: true, default: 0 },
  field_breakdown: { type: Object, default: {} }
}, { timestamps: true });

const SettingSchema = new mongoose.Schema({
  kpi_key: { type: String, required: true },
  target_value: { type: Number, required: true },
  task_type: { type: String, default: null },
  sheet_type: { type: String, default: null },
  description: { type: String },
  unit: { type: String, default: '%' },
  direction: { type: String, enum: ['higher_is_better', 'lower_is_better', 'exact_zero'], default: 'higher_is_better' },
  updated_by: { type: String, required: true },
  updated_at: { type: String, required: true }
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  target_key: { type: String },
  old_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: String, required: true }
}, { timestamps: true });

const ImportErrorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  source_record_id: { type: String, required: true },
  error_reason: { type: String, required: true },
  raw_data: { type: Object, default: {} },
  timestamp: { type: String, required: true }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const QACheck = mongoose.models.QACheck || mongoose.model('QACheck', QACheckSchema);
export const Coverage = mongoose.models.Coverage || mongoose.model('Coverage', CoverageSchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const ImportError = mongoose.models.ImportError || mongoose.model('ImportError', ImportErrorSchema);
