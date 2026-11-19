import db from '../database/dataStore.js';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  const existingUsers = db.get('users');
  if (existingUsers && existingUsers.length > 0) {
    console.log('Database already contains data, skipping seed.');
    return;
  }

  console.log('Seeding initial dataset for KPI Dashboard (Zero Spend)...');

  const defaultPassword = 'password123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  // 1. Users
  const users = [
    {
      id: 'USR-001',
      name: 'Vikram Sethi',
      email: 'manager@company.com',
      password: hashedPassword,
      role: 'Manager',
      team: 'Enterprise Ops',
      active: true
    },
    {
      id: 'USR-002',
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Fintech & SaaS',
      active: true
    },
    {
      id: 'USR-003',
      name: 'Priya Patel',
      email: 'priya@company.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Healthcare & Commerce',
      active: true
    },
    {
      id: 'USR-004',
      name: 'Amit Verma',
      email: 'amit@company.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Fintech & SaaS',
      active: true
    },
    {
      id: 'USR-005',
      name: 'Ananya Roy',
      email: 'ananya@company.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Healthcare & Commerce',
      active: true
    },
    {
      id: 'USR-006',
      name: 'Sanjay Gupta',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'Admin',
      team: 'Systems & Infrastructure',
      active: true
    }
  ];

  // 2. Settings (KPI targets as per Section 5)
  const settings = [
    {
      kpi_key: 'completed_daily_target',
      target_value: 500,
      task_type: null,
      sheet_type: null,
      description: 'Daily completed rows target per analyst',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'completion_rate',
      target_value: 90,
      task_type: null,
      sheet_type: null,
      description: 'Rows completed divided by rows assigned (target: 90% or above)',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'accuracy_rate',
      target_value: 95,
      task_type: null,
      sheet_type: null,
      description: 'Rows correct divided by rows checked in QA sample (target: 95% or above)',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'rework_rate',
      target_value: 5,
      task_type: null,
      sheet_type: null,
      description: 'Rows sent back divided by rows completed (target: 5% or below)',
      unit: '%',
      direction: 'lower_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'on_time_delivery',
      target_value: 95,
      task_type: null,
      sheet_type: null,
      description: 'Tasks delivered on/before due date divided by tasks due (target: 95% or above)',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'coverage_rate',
      target_value: 85,
      task_type: null,
      sheet_type: null,
      description: 'Required fields filled divided by total required fields',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'duplicate_rate',
      target_value: 1.0,
      task_type: null,
      sheet_type: null,
      description: 'Duplicate rows found divided by rows completed (target: 1% or below)',
      unit: '%',
      direction: 'lower_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'pending_backlog',
      target_value: 0,
      task_type: null,
      sheet_type: null,
      description: 'Assigned tasks not completed and past due date (target: 0 overdue)',
      unit: 'tasks',
      direction: 'exact_zero',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    // Task-type specific targets
    {
      kpi_key: 'completed_daily_target',
      target_value: 600,
      task_type: 'Lead Generation',
      sheet_type: null,
      description: 'Daily target for Lead Generation',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'completed_daily_target',
      target_value: 450,
      task_type: 'Data Enrichment',
      sheet_type: null,
      description: 'Daily target for Data Enrichment',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    // Sheet-type specific coverage targets
    {
      kpi_key: 'coverage_rate',
      target_value: 90,
      task_type: null,
      sheet_type: 'B2B Companies',
      description: 'Field coverage target for B2B Companies sheet',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    },
    {
      kpi_key: 'coverage_rate',
      target_value: 85,
      task_type: null,
      sheet_type: 'Executive Contacts',
      description: 'Field coverage target for Executive Contacts sheet',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Manager)',
      updated_at: '2026-11-15T09:00:00Z'
    }
  ];

  // 3. Tasks / Sheets (5-Day Pilot Period: 2026-11-15 to 2026-11-19)
  const tasks = [
    // --- Day 1 (2026-11-15) ---
    {
      id: 'TSK-101',
      analyst_id: 'USR-002', // Rahul Sharma
      task_name: 'Bangalore Fintech CXO Outreach',
      task_type: 'Lead Generation',
      sheet_type: 'B2B Companies',
      vertical: 'Fintech',
      city: 'Bangalore',
      date_assigned: '2026-11-15',
      due_date: '2026-11-15',
      delivery_date: '2026-11-15',
      status: 'Completed',
      rows_assigned: 600,
      rows_completed: 580,
      source_record_id: 'SRC-PILOT-101'
    },
    {
      id: 'TSK-102',
      analyst_id: 'USR-003', // Priya Patel
      task_name: 'Mumbai Hospital Procurement Directory',
      task_type: 'Data Enrichment',
      sheet_type: 'Healthcare Providers',
      vertical: 'Healthcare',
      city: 'Mumbai',
      date_assigned: '2026-11-15',
      due_date: '2026-11-15',
      delivery_date: '2026-11-15',
      status: 'Completed',
      rows_assigned: 500,
      rows_completed: 485,
      source_record_id: 'SRC-PILOT-102'
    },
    {
      id: 'TSK-103',
      analyst_id: 'USR-004', // Amit Verma
      task_name: 'Delhi Retail Supplier Audit',
      task_type: 'Phone Verification',
      sheet_type: 'Local Retailers',
      vertical: 'E-commerce',
      city: 'Delhi',
      date_assigned: '2026-11-15',
      due_date: '2026-11-15',
      delivery_date: '2026-11-15',
      status: 'Completed',
      rows_assigned: 450,
      rows_completed: 440,
      source_record_id: 'SRC-PILOT-103'
    },

    // --- Day 2 (2026-11-16) ---
    {
      id: 'TSK-104',
      analyst_id: 'USR-002', // Rahul
      task_name: 'Hyderabad SaaS Seed Founders',
      task_type: 'Lead Generation',
      sheet_type: 'B2B Companies',
      vertical: 'SaaS',
      city: 'Hyderabad',
      date_assigned: '2026-11-16',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 550,
      rows_completed: 535,
      source_record_id: 'SRC-PILOT-104'
    },
    {
      id: 'TSK-105',
      analyst_id: 'USR-003', // Priya
      task_name: 'Pune Pharma Key Decision Makers',
      task_type: 'Executive Contacts',
      sheet_type: 'Executive Contacts',
      vertical: 'Healthcare',
      city: 'Pune',
      date_assigned: '2026-11-16',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 480,
      rows_completed: 460,
      source_record_id: 'SRC-PILOT-105'
    },
    {
      id: 'TSK-106',
      analyst_id: 'USR-005', // Ananya Roy
      task_name: 'Bangalore EdTech Founders Contact Matrix',
      task_type: 'Lead Generation',
      sheet_type: 'Executive Contacts',
      vertical: 'EdTech',
      city: 'Bangalore',
      date_assigned: '2026-11-16',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 520,
      rows_completed: 510,
      source_record_id: 'SRC-PILOT-106'
    },

    // --- Day 3 (2026-11-17) ---
    // Task 107 has high rework & accuracy test case
    {
      id: 'TSK-107',
      analyst_id: 'USR-004', // Amit Verma
      task_name: 'Mumbai Direct-to-Consumer Brands',
      task_type: 'Data Enrichment',
      sheet_type: 'B2B Companies',
      vertical: 'E-commerce',
      city: 'Mumbai',
      date_assigned: '2026-11-17',
      due_date: '2026-11-17',
      delivery_date: '2026-11-17',
      status: 'Completed',
      rows_assigned: 500,
      rows_completed: 450,
      source_record_id: 'SRC-PILOT-107'
    },
    // Task 108: OVERDUE task (past due date, not completed!)
    {
      id: 'TSK-108',
      analyst_id: 'USR-005', // Ananya Roy
      task_name: 'Delhi NCR Diagnostics Labs Verification',
      task_type: 'Phone Verification',
      sheet_type: 'Healthcare Providers',
      vertical: 'Healthcare',
      city: 'Delhi',
      date_assigned: '2026-11-16',
      due_date: '2026-11-17', // PAST DUE!
      delivery_date: null,
      status: 'Overdue',
      rows_assigned: 400,
      rows_completed: 120, // incomplete
      source_record_id: 'SRC-PILOT-108'
    },

    // --- Day 4 (2026-11-18) ---
    // Task 109: CRITICAL TEST CASE - NO QA SAMPLE CHECKED (rows_checked = 0)
    // To verify: "Accuracy shows 'Not checked' when no QA sample exists for the period — not 0% or 100%."
    {
      id: 'TSK-109',
      analyst_id: 'USR-002', // Rahul Sharma
      task_name: 'Bangalore AI Startups Technical Directors',
      task_type: 'Email Discovery',
      sheet_type: 'Executive Contacts',
      vertical: 'SaaS',
      city: 'Bangalore',
      date_assigned: '2026-11-18',
      due_date: '2026-11-18',
      delivery_date: '2026-11-18',
      status: 'Completed',
      rows_assigned: 500,
      rows_completed: 495,
      source_record_id: 'SRC-PILOT-109'
    },
    {
      id: 'TSK-110',
      analyst_id: 'USR-003', // Priya Patel
      task_name: 'Pune Auto Components Exporters',
      task_type: 'Lead Generation',
      sheet_type: 'B2B Companies',
      vertical: 'E-commerce',
      city: 'Pune',
      date_assigned: '2026-11-18',
      due_date: '2026-11-18',
      delivery_date: '2026-11-18',
      status: 'Completed',
      rows_assigned: 520,
      rows_completed: 510,
      source_record_id: 'SRC-PILOT-110'
    },

    // --- Day 5 (2026-11-19 - Current Day) ---
    {
      id: 'TSK-111',
      analyst_id: 'USR-002', // Rahul Sharma
      task_name: 'Hyderabad Cloud DevOps Leaders',
      task_type: 'Lead Generation',
      sheet_type: 'Executive Contacts',
      vertical: 'SaaS',
      city: 'Hyderabad',
      date_assigned: '2026-11-19',
      due_date: '2026-11-19',
      delivery_date: '2026-11-19',
      status: 'Completed',
      rows_assigned: 540,
      rows_completed: 530,
      source_record_id: 'SRC-PILOT-111'
    },
    {
      id: 'TSK-112',
      analyst_id: 'USR-003', // Priya Patel
      task_name: 'Delhi Tier-1 Hospital ICU Heads',
      task_type: 'Data Enrichment',
      sheet_type: 'Healthcare Providers',
      vertical: 'Healthcare',
      city: 'Delhi',
      date_assigned: '2026-11-19',
      due_date: '2026-11-19',
      delivery_date: '2026-11-19',
      status: 'Completed',
      rows_assigned: 460,
      rows_completed: 450,
      source_record_id: 'SRC-PILOT-112'
    },
    {
      id: 'TSK-113',
      analyst_id: 'USR-004', // Amit Verma
      task_name: 'Bangalore Fintech Product Managers',
      task_type: 'Email Discovery',
      sheet_type: 'Executive Contacts',
      vertical: 'Fintech',
      city: 'Bangalore',
      date_assigned: '2026-11-19',
      due_date: '2026-11-19',
      delivery_date: '2026-11-19',
      status: 'Completed',
      rows_assigned: 500,
      rows_completed: 490,
      source_record_id: 'SRC-PILOT-113'
    }
  ];

  // 4. QA Checks
  const qaChecks = [
    {
      id: 'QA-101',
      task_id: 'TSK-101',
      date_checked: '2026-11-15',
      rows_checked: 60,
      rows_correct: 59,
      rows_reworked: 1,
      duplicates_found: 2
    },
    {
      id: 'QA-102',
      task_id: 'TSK-102',
      date_checked: '2026-11-15',
      rows_checked: 50,
      rows_correct: 49,
      rows_reworked: 2,
      duplicates_found: 1
    },
    {
      id: 'QA-103',
      task_id: 'TSK-103',
      date_checked: '2026-11-15',
      rows_checked: 45,
      rows_correct: 44,
      rows_reworked: 3,
      duplicates_found: 3
    },
    {
      id: 'QA-104',
      task_id: 'TSK-104',
      date_checked: '2026-11-16',
      rows_checked: 55,
      rows_correct: 54,
      rows_reworked: 2,
      duplicates_found: 1
    },
    {
      id: 'QA-105',
      task_id: 'TSK-105',
      date_checked: '2026-11-16',
      rows_checked: 50,
      rows_correct: 48,
      rows_reworked: 4,
      duplicates_found: 2
    },
    {
      id: 'QA-106',
      task_id: 'TSK-106',
      date_checked: '2026-11-16',
      rows_checked: 50,
      rows_correct: 49,
      rows_reworked: 1,
      duplicates_found: 0
    },
    // Task 107 QA check: High rework (>5%) and low accuracy (88%)
    {
      id: 'QA-107',
      task_id: 'TSK-107',
      date_checked: '2026-11-17',
      rows_checked: 50,
      rows_correct: 44, // 44/50 = 88% (<90% triggers Needs Attention)
      rows_reworked: 28, // 28/450 = 6.2% (>5% triggers Needs Attention)
      duplicates_found: 4
    },
    // Note: TSK-108 has NO QA check yet (overdue / incomplete)
    // Note: TSK-109 has NO QA sample (rows_checked: 0) to verify "Not checked"
    {
      id: 'QA-109',
      task_id: 'TSK-109',
      date_checked: '2026-11-18',
      rows_checked: 0, // ZERO QA SAMPLE CHECKED!
      rows_correct: 0,
      rows_reworked: 0,
      duplicates_found: 0
    },
    {
      id: 'QA-110',
      task_id: 'TSK-110',
      date_checked: '2026-11-18',
      rows_checked: 50,
      rows_correct: 49,
      rows_reworked: 3,
      duplicates_found: 2
    },
    {
      id: 'QA-111',
      task_id: 'TSK-111',
      date_checked: '2026-11-19',
      rows_checked: 55,
      rows_correct: 54,
      rows_reworked: 2,
      duplicates_found: 1
    },
    {
      id: 'QA-112',
      task_id: 'TSK-112',
      date_checked: '2026-11-19',
      rows_checked: 45,
      rows_correct: 44,
      rows_reworked: 1,
      duplicates_found: 0
    },
    {
      id: 'QA-113',
      task_id: 'TSK-113',
      date_checked: '2026-11-19',
      rows_checked: 50,
      rows_correct: 48,
      rows_reworked: 3,
      duplicates_found: 1
    }
  ];

  // 5. Coverage
  const coverage = [
    {
      id: 'COV-101',
      task_id: 'TSK-101',
      sheet_type: 'B2B Companies',
      required_fields_total: 2320,
      required_fields_filled: 2180,
      field_breakdown: { phone: { req: 580, filled: 520 }, email: { req: 580, filled: 575 }, website: { req: 580, filled: 580 }, linkedin: { req: 580, filled: 505 } }
    },
    {
      id: 'COV-102',
      task_id: 'TSK-102',
      sheet_type: 'Healthcare Providers',
      required_fields_total: 1940,
      required_fields_filled: 1720,
      field_breakdown: { phone: { req: 485, filled: 440 }, email: { req: 485, filled: 410 }, address: { req: 485, filled: 485 }, license: { req: 485, filled: 385 } }
    },
    {
      id: 'COV-103',
      task_id: 'TSK-103',
      sheet_type: 'Local Retailers',
      required_fields_total: 1760,
      required_fields_filled: 1480,
      field_breakdown: { phone: { req: 440, filled: 420 }, gmap: { req: 440, filled: 440 }, category: { req: 440, filled: 400 }, gst: { req: 440, filled: 220 } }
    },
    {
      id: 'COV-104',
      task_id: 'TSK-104',
      sheet_type: 'B2B Companies',
      required_fields_total: 2140,
      required_fields_filled: 2010,
      field_breakdown: { phone: { req: 535, filled: 490 }, email: { req: 535, filled: 530 }, website: { req: 535, filled: 535 }, linkedin: { req: 535, filled: 455 } }
    },
    {
      id: 'COV-105',
      task_id: 'TSK-105',
      sheet_type: 'Executive Contacts',
      required_fields_total: 1840,
      required_fields_filled: 1690,
      field_breakdown: { direct_email: { req: 460, filled: 450 }, direct_phone: { req: 460, filled: 380 }, designation: { req: 460, filled: 460 }, linkedin: { req: 460, filled: 400 } }
    },
    {
      id: 'COV-106',
      task_id: 'TSK-106',
      sheet_type: 'Executive Contacts',
      required_fields_total: 2040,
      required_fields_filled: 1880,
      field_breakdown: { direct_email: { req: 510, filled: 505 }, direct_phone: { req: 510, filled: 410 }, designation: { req: 510, filled: 510 }, linkedin: { req: 510, filled: 455 } }
    },
    {
      id: 'COV-107',
      task_id: 'TSK-107',
      sheet_type: 'B2B Companies',
      required_fields_total: 1800,
      required_fields_filled: 1530,
      field_breakdown: { phone: { req: 450, filled: 380 }, email: { req: 450, filled: 420 }, website: { req: 450, filled: 450 }, ig_handle: { req: 450, filled: 280 } }
    },
    {
      id: 'COV-109',
      task_id: 'TSK-109',
      sheet_type: 'Executive Contacts',
      required_fields_total: 1980,
      required_fields_filled: 1890,
      field_breakdown: { direct_email: { req: 495, filled: 495 }, direct_phone: { req: 495, filled: 420 }, github: { req: 495, filled: 480 }, linkedin: { req: 495, filled: 495 } }
    },
    {
      id: 'COV-110',
      task_id: 'TSK-110',
      sheet_type: 'B2B Companies',
      required_fields_total: 2040,
      required_fields_filled: 1890,
      field_breakdown: { phone: { req: 510, filled: 470 }, email: { req: 510, filled: 500 }, website: { req: 510, filled: 510 }, export_code: { req: 510, filled: 410 } }
    },
    {
      id: 'COV-111',
      task_id: 'TSK-111',
      sheet_type: 'Executive Contacts',
      required_fields_total: 2120,
      required_fields_filled: 2010,
      field_breakdown: { direct_email: { req: 530, filled: 525 }, direct_phone: { req: 530, filled: 450 }, designation: { req: 530, filled: 530 }, linkedin: { req: 530, filled: 505 } }
    },
    {
      id: 'COV-112',
      task_id: 'TSK-112',
      sheet_type: 'Healthcare Providers',
      required_fields_total: 1800,
      required_fields_filled: 1650,
      field_breakdown: { phone: { req: 450, filled: 420 }, email: { req: 450, filled: 390 }, address: { req: 450, filled: 450 }, department: { req: 450, filled: 390 } }
    },
    {
      id: 'COV-113',
      task_id: 'TSK-113',
      sheet_type: 'Executive Contacts',
      required_fields_total: 1960,
      required_fields_filled: 1840,
      field_breakdown: { direct_email: { req: 490, filled: 485 }, direct_phone: { req: 490, filled: 410 }, designation: { req: 490, filled: 490 }, linkedin: { req: 490, filled: 455 } }
    }
  ];

  // 6. Audit Logs
  const auditLogs = [
    {
      id: 'AUD-001',
      user: 'Vikram Sethi (Manager)',
      action: 'target edit',
      target_key: 'completion_rate',
      old_value: '85',
      new_value: '90',
      timestamp: '2026-11-15T09:15:00Z'
    },
    {
      id: 'AUD-002',
      user: 'Vikram Sethi (Manager)',
      action: 'target edit',
      target_key: 'accuracy_rate',
      old_value: '92',
      new_value: '95',
      timestamp: '2026-11-15T09:20:00Z'
    },
    {
      id: 'AUD-003',
      user: 'Sanjay Gupta (Admin)',
      action: 'user change',
      target_key: 'User Ananya Roy (USR-005)',
      old_value: 'Role: Junior Analyst',
      new_value: 'Role: Analyst',
      timestamp: '2026-11-15T10:00:00Z'
    }
  ];

  // 7. Import Errors List (Demonstrating Section 4 requirement)
  const importErrors = [
    {
      id: 'ERR-PILOT-01',
      source_record_id: 'SRC-TRACKER-9941',
      error_reason: 'Missing required field(s): due_date in source record',
      raw_data: {
        source_record_id: 'SRC-TRACKER-9941',
        analyst_id: 'USR-002',
        task_name: 'Unscheduled Retail Verification Sample',
        vertical: 'E-commerce',
        city: 'Pune',
        rows_assigned: 300
      },
      timestamp: '2026-11-18T06:00:04Z'
    },
    {
      id: 'ERR-PILOT-02',
      source_record_id: 'SRC-TRACKER-9988',
      error_reason: 'Analyst ID USR-999 does not match any registered analyst',
      raw_data: {
        source_record_id: 'SRC-TRACKER-9988',
        analyst_id: 'USR-999',
        task_name: 'Unassigned Logistics Lead List',
        due_date: '2026-11-19',
        rows_assigned: 200
      },
      timestamp: '2026-11-19T06:00:07Z'
    }
  ];

  // 8. Sync Metadata
  const nowIso = new Date().toISOString();
  const syncMeta = {
    last_updated: nowIso,
    sync_status: 'success',
    last_success_timestamp: nowIso,
    error_message: null,
    scheduled_time: '06:00 AM IST Daily',
    source_name: 'Task / Lead Production Tracker (API v1.4)'
  };

  db.resetAll({
    users,
    tasks,
    qa_checks: qaChecks,
    coverage,
    settings,
    audit_log: auditLogs,
    import_errors: importErrors,
    sync_meta: syncMeta
  });

  console.log('Seeding completed successfully!');
}

export default seedDatabase;
