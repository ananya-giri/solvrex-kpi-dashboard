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
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'Analyst', 'Admin'], required: true, index: true },
  team: { type: String, required: true, index: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  analyst_id: { type: String, required: true, index: true },
  task_name: { type: String, required: true },
  task_type: { type: String, required: true, index: true },
  sheet_type: { type: String, required: true, index: true },
  vertical: { type: String, required: true, index: true },
  city: { type: String, required: true, index: true },
  date_assigned: { type: String, required: true, index: true }, // YYYY-MM-DD
  due_date: { type: String, required: true, index: true }, // YYYY-MM-DD
  delivery_date: { type: String, default: null, index: true }, // YYYY-MM-DD or null
  status: { 
    type: String, 
    enum: ['In Progress', 'Completed', 'Pending Review', 'Rework', 'Overdue'], 
    default: 'In Progress',
    index: true 
  },
  rows_assigned: { type: Number, required: true, default: 0 },
  rows_completed: { type: Number, required: true, default: 0 },
  source_record_id: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });

// High-throughput Compound Indexes for Sub-millisecond Scalable Queries
TaskSchema.index({ analyst_id: 1, date_assigned: -1 });
TaskSchema.index({ status: 1, due_date: 1 });
TaskSchema.index({ vertical: 1, city: 1, sheet_type: 1 });
TaskSchema.index({ due_date: 1, delivery_date: 1 });

const QACheckSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  task_id: { type: String, required: true, index: true },
  date_checked: { type: String, required: true, index: true },
  rows_checked: { type: Number, default: 0 },
  rows_correct: { type: Number, default: 0 },
  rows_reworked: { type: Number, default: 0 },
  duplicates_found: { type: Number, default: 0 }
}, { timestamps: true });

QACheckSchema.index({ task_id: 1, date_checked: -1 });

const CoverageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  task_id: { type: String, required: true, index: true },
  sheet_type: { type: String, required: true, index: true },
  required_fields_total: { type: Number, required: true, default: 0 },
  required_fields_filled: { type: Number, required: true, default: 0 },
  field_breakdown: { type: Object, default: {} }
}, { timestamps: true });

CoverageSchema.index({ task_id: 1, sheet_type: 1 });

const SettingSchema = new mongoose.Schema({
  kpi_key: { type: String, required: true, index: true },
  target_value: { type: Number, required: true },
  task_type: { type: String, default: null, index: true },
  sheet_type: { type: String, default: null, index: true },
  description: { type: String },
  unit: { type: String, default: '%' },
  direction: { type: String, enum: ['higher_is_better', 'lower_is_better', 'exact_zero'], default: 'higher_is_better' },
  updated_by: { type: String, required: true },
  updated_at: { type: String, required: true }
}, { timestamps: true });

SettingSchema.index({ kpi_key: 1, task_type: 1, sheet_type: 1 }, { unique: true });

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  user: { type: String, required: true, index: true },
  action: { type: String, required: true },
  target_key: { type: String, index: true },
  old_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: String, required: true, index: true }
}, { timestamps: true });

AuditLogSchema.index({ timestamp: -1 });

const ImportErrorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  source_record_id: { type: String, required: true, index: true },
  error_reason: { type: String, required: true },
  raw_data: { type: Object, default: {} },
  timestamp: { type: String, required: true, index: true }
}, { timestamps: true });

ImportErrorSchema.index({ timestamp: -1 });

// Solvrex Lead Ingestion Schema
const LeadSchema = new mongoose.Schema({
  s_no: { type: Number, required: true, index: true },
  category: { type: String, enum: ['Student', 'Grad', 'Founder'], required: true, index: true },
  task_id: { type: String, required: true, index: true },
  full_name: { type: String, required: true, index: true },
  university_or_company: { type: String, default: 'Not public' },
  course_or_title: { type: String, default: 'Not public' },
  graduation_or_exp: { type: String, default: 'Not public' },
  field_or_industry: { type: String, default: 'Not public' },
  city: { type: String, required: true, index: true },
  country: { type: String, default: 'Canada' },
  target_location: { type: String, default: 'Not public' },
  job_status: { type: String, default: 'Active' },
  open_to_work_signal: { type: String, default: 'Not public' },
  linkedin_url: { type: String, default: 'Not public' },
  public_email: { type: String, default: 'Not public' },
  mobile_phone: { type: String, default: 'Not public' },
  source_of_contact_info: { type: String, default: 'Public sources' },
  likely_solvrex_service_fit: { type: String, default: 'Resume review, LinkedIn optimization' },
  outreach_status: { type: String, default: 'Not contacted' },
  date_collected: { type: String, default: '2026-11-16' },
  notes: { type: String, default: '' }
}, { timestamps: true });

LeadSchema.index({ city: 1, category: 1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const QACheck = mongoose.models.QACheck || mongoose.model('QACheck', QACheckSchema);
export const Coverage = mongoose.models.Coverage || mongoose.model('Coverage', CoverageSchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const ImportError = mongoose.models.ImportError || mongoose.model('ImportError', ImportErrorSchema);
export const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
