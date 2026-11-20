import db from '../database/dataStore.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Task, QACheck, Coverage, Setting, AuditLog, ImportError, Lead } from '../models/index.js';

export async function seedDatabase(force = false) {
  const existingUsers = db.get('users');
  if (!force && existingUsers && existingUsers.length > 0 && db.get('leads')?.length > 0) {
    console.log('[Seed] Database already initialized with Solvrex Private Limited data.');
    return;
  }

  console.log('[Seed] Populating Solvrex Private Limited production data & leads into MongoDB...');

  const defaultPassword = 'password123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  // 1. Solvrex Team Users
  const users = [
    {
      id: 'USR-001',
      name: 'Vikram Sethi',
      email: 'manager@solvrex.com',
      password: hashedPassword,
      role: 'Manager',
      team: 'Solvrex Operations',
      active: true
    },
    {
      id: 'USR-002',
      name: 'Rahul Sharma',
      email: 'rahul@solvrex.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Candidate Research (Students)',
      active: true
    },
    {
      id: 'USR-003',
      name: 'Priya Patel',
      email: 'priya@solvrex.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Early Career Discovery (Grads)',
      active: true
    },
    {
      id: 'USR-004',
      name: 'Amit Verma',
      email: 'amit@solvrex.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Founder Pipeline (East)',
      active: true
    },
    {
      id: 'USR-005',
      name: 'Ananya Roy',
      email: 'ananya@solvrex.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Founder Pipeline (West)',
      active: true
    },
    {
      id: 'USR-006',
      name: 'Kavita Nair',
      email: 'kavita@solvrex.com',
      password: hashedPassword,
      role: 'Analyst',
      team: 'Founder Pipeline (Atlantic)',
      active: true
    },
    {
      id: 'USR-007',
      name: 'Sanjay Gupta',
      email: 'admin@solvrex.com',
      password: hashedPassword,
      role: 'Admin',
      team: 'Infrastructure & Systems',
      active: true
    }
  ];

  // 2. Settings (Target thresholds for Solvrex Analyst Operations)
  const settings = [
    {
      kpi_key: 'completed_daily_target',
      target_value: 300,
      task_type: null,
      sheet_type: null,
      description: 'Daily completed verified lead records target',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'completion_rate',
      target_value: 90,
      task_type: null,
      sheet_type: null,
      description: 'Lead completion rate vs assigned quotas',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'accuracy_rate',
      target_value: 95,
      task_type: null,
      sheet_type: null,
      description: 'Verified correct contact & profile fields in QA sample',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'rework_rate',
      target_value: 5,
      task_type: null,
      sheet_type: null,
      description: 'Leads returned by QA for re-verification',
      unit: '%',
      direction: 'lower_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'on_time_delivery',
      target_value: 95,
      task_type: null,
      sheet_type: null,
      description: 'Lead batches delivered on or before due date',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'coverage_rate',
      target_value: 80,
      task_type: null,
      sheet_type: null,
      description: 'Verified public contact field fill rate (Phone, Email, LinkedIn)',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'duplicate_rate',
      target_value: 1.0,
      task_type: null,
      sheet_type: null,
      description: 'Duplicate candidate entries identified in dedup pool',
      unit: '%',
      direction: 'lower_is_better',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'pending_backlog',
      target_value: 0,
      task_type: null,
      sheet_type: null,
      description: 'Assigned batches not completed and past due date',
      unit: 'tasks',
      direction: 'exact_zero',
      updated_by: 'Vikram Sethi (Solvrex Operations)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    // Task-Type Targets
    {
      kpi_key: 'completed_daily_target',
      target_value: 120,
      task_type: 'Candidate Research',
      sheet_type: null,
      description: 'Daily target for Candidate Research',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'completed_daily_target',
      target_value: 50,
      task_type: 'Founder Outreach',
      sheet_type: null,
      description: 'Daily target for Founder Outreach',
      unit: 'rows',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    // Sheet-Type Coverage Targets
    {
      kpi_key: 'coverage_rate',
      target_value: 85,
      task_type: null,
      sheet_type: 'PhD Candidates',
      description: 'Coverage target for PhD Job Market Candidates',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex)',
      updated_at: '2026-11-16T09:00:00Z'
    },
    {
      kpi_key: 'coverage_rate',
      target_value: 80,
      task_type: null,
      sheet_type: 'Startup Founders',
      description: 'Coverage target for Startup Founders',
      unit: '%',
      direction: 'higher_is_better',
      updated_by: 'Vikram Sethi (Solvrex)',
      updated_at: '2026-11-16T09:00:00Z'
    }
  ];

  // 3. Solvrex Actual Production Tasks / Sheets
  const tasks = [
    {
      id: 'SLV-TSK-701',
      analyst_id: 'USR-002', // Rahul Sharma
      task_name: 'Solvrex Batch 7 — Canadian PhD & Masters Candidates',
      task_type: 'Candidate Research',
      sheet_type: 'PhD Candidates',
      vertical: 'Academic & Tech PhDs',
      city: 'Toronto',
      date_assigned: '2026-11-15',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 106,
      rows_completed: 106,
      source_record_id: 'SLV-TRACKER-B7-STUDENTS'
    },
    {
      id: 'SLV-TSK-702',
      analyst_id: 'USR-003', // Priya Patel
      task_name: 'Solvrex Batch 7 — Recent Canadian Graduates (2026 Cohort)',
      task_type: 'Candidate Research',
      sheet_type: 'Recent Graduates',
      vertical: 'Software & Data Science',
      city: 'Ottawa',
      date_assigned: '2026-11-15',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 34,
      rows_completed: 34,
      source_record_id: 'SLV-TRACKER-B7-GRADS'
    },
    {
      id: 'SLV-TSK-703',
      analyst_id: 'USR-004', // Amit Verma
      task_name: 'Solvrex Batch 7 — Ontario & Quebec Startup Founders',
      task_type: 'Founder Outreach',
      sheet_type: 'Startup Founders',
      vertical: 'AI, LegalTech & DeepTech',
      city: 'Montreal',
      date_assigned: '2026-11-15',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 40,
      rows_completed: 40,
      source_record_id: 'SLV-TRACKER-B7-FOUNDERS-EAST'
    },
    {
      id: 'SLV-TSK-704',
      analyst_id: 'USR-005', // Ananya Roy
      task_name: 'Solvrex Batch 7 — Western & Prairie Startup Founders',
      task_type: 'Founder Outreach',
      sheet_type: 'Startup Founders',
      vertical: 'Robotics & CleanTech',
      city: 'Vancouver',
      date_assigned: '2026-11-15',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 40,
      rows_completed: 40,
      source_record_id: 'SLV-TRACKER-B7-FOUNDERS-WEST'
    },
    {
      id: 'SLV-TSK-705',
      analyst_id: 'USR-006', // Kavita Nair
      task_name: 'Solvrex Batch 7 — Atlantic Canada High-Growth Founders',
      task_type: 'Founder Outreach',
      sheet_type: 'Startup Founders',
      vertical: 'OceanTech & HealthTech',
      city: 'Halifax',
      date_assigned: '2026-11-15',
      due_date: '2026-11-16',
      delivery_date: '2026-11-16',
      status: 'Completed',
      rows_assigned: 40,
      rows_completed: 40,
      source_record_id: 'SLV-TRACKER-B7-FOUNDERS-ATLANTIC'
    },
    // Overdue task condition: due date in past, not completed
    {
      id: 'SLV-TSK-706',
      analyst_id: 'USR-004', // Amit Verma
      task_name: 'Solvrex Lead Enrichment — Delayed Tech Founders Pipeline',
      task_type: 'Founder Outreach',
      sheet_type: 'Startup Founders',
      vertical: 'FinTech & SaaS',
      city: 'Calgary',
      date_assigned: '2026-11-14',
      due_date: '2026-11-17', // Overdue!
      delivery_date: null,
      status: 'Overdue',
      rows_assigned: 30,
      rows_completed: 10,
      source_record_id: 'SLV-TRACKER-B7-OVERDUE'
    },
    // Zero-QA case: rows_checked = 0, verifying "Not checked", not 0% or 100%
    {
      id: 'SLV-TSK-707',
      analyst_id: 'USR-002', // Rahul Sharma
      task_name: 'Solvrex Unsampled Intake — Raw Ingestion Feed',
      task_type: 'Candidate Research',
      sheet_type: 'Recent Graduates',
      vertical: 'Software & Data Science',
      city: 'Waterloo',
      date_assigned: '2026-11-18',
      due_date: '2026-11-18',
      delivery_date: '2026-11-18',
      status: 'Completed',
      rows_assigned: 20,
      rows_completed: 20,
      source_record_id: 'SLV-TRACKER-B7-UNSAMPLED'
    }
  ];

  // 4. QA Checks
  const qaChecks = [
    {
      id: 'QA-701',
      task_id: 'SLV-TSK-701',
      date_checked: '2026-11-16',
      rows_checked: 25,
      rows_correct: 24,
      rows_reworked: 1, // 1 candidate with stale signal
      duplicates_found: 0
    },
    {
      id: 'QA-702',
      task_id: 'SLV-TSK-702',
      date_checked: '2026-11-16',
      rows_checked: 10,
      rows_correct: 9,
      rows_reworked: 1, // 1 unverified graduation date
      duplicates_found: 0
    },
    {
      id: 'QA-703',
      task_id: 'SLV-TSK-703',
      date_checked: '2026-11-16',
      rows_checked: 15,
      rows_correct: 14,
      rows_reworked: 1,
      duplicates_found: 0
    },
    {
      id: 'QA-704',
      task_id: 'SLV-TSK-704',
      date_checked: '2026-11-16',
      rows_checked: 15,
      rows_correct: 15, // 100% QA accuracy
      rows_reworked: 0,
      duplicates_found: 0
    },
    {
      id: 'QA-705',
      task_id: 'SLV-TSK-705',
      date_checked: '2026-11-16',
      rows_checked: 12,
      rows_correct: 12, // 100% QA accuracy
      rows_reworked: 0,
      duplicates_found: 0
    },
    // Note: SLV-TSK-706 is overdue, not QA checked yet
    // Note: SLV-TSK-707 has 0 rows checked -> Verifies "Not checked"
    {
      id: 'QA-707',
      task_id: 'SLV-TSK-707',
      date_checked: '2026-11-18',
      rows_checked: 0, // ZERO QA SAMPLE CHECKED
      rows_correct: 0,
      rows_reworked: 0,
      duplicates_found: 0
    }
  ];

  // 5. Coverage Statistics (Computed from real public fields in Solvrex data)
  const coverage = [
    {
      id: 'COV-701',
      task_id: 'SLV-TSK-701',
      sheet_type: 'PhD Candidates',
      required_fields_total: 106 * 4, // Name, Email, Phone, LinkedIn
      required_fields_filled: 106 + 86 + 49 + 25, // 266 filled
      field_breakdown: {
        full_name: { req: 106, filled: 106 },
        public_email: { req: 106, filled: 86 },
        mobile_phone: { req: 106, filled: 49 },
        linkedin_url: { req: 106, filled: 25 }
      }
    },
    {
      id: 'COV-702',
      task_id: 'SLV-TSK-702',
      sheet_type: 'Recent Graduates',
      required_fields_total: 34 * 4,
      required_fields_filled: 34 + 21 + 13 + 16, // 84 filled
      field_breakdown: {
        full_name: { req: 34, filled: 34 },
        public_email: { req: 34, filled: 21 },
        mobile_phone: { req: 34, filled: 13 },
        linkedin_url: { req: 34, filled: 16 }
      }
    },
    {
      id: 'COV-703',
      task_id: 'SLV-TSK-703',
      sheet_type: 'Startup Founders',
      required_fields_total: 40 * 4,
      required_fields_filled: 40 + 18 + 8 + 12,
      field_breakdown: {
        full_name: { req: 40, filled: 40 },
        public_email: { req: 40, filled: 18 },
        mobile_phone: { req: 40, filled: 8 },
        linkedin_url: { req: 40, filled: 12 }
      }
    },
    {
      id: 'COV-704',
      task_id: 'SLV-TSK-704',
      sheet_type: 'Startup Founders',
      required_fields_total: 40 * 4,
      required_fields_filled: 40 + 15 + 6 + 10,
      field_breakdown: {
        full_name: { req: 40, filled: 40 },
        public_email: { req: 40, filled: 15 },
        mobile_phone: { req: 40, filled: 6 },
        linkedin_url: { req: 40, filled: 10 }
      }
    },
    {
      id: 'COV-705',
      task_id: 'SLV-TSK-705',
      sheet_type: 'Startup Founders',
      required_fields_total: 40 * 4,
      required_fields_filled: 40 + 12 + 5 + 8,
      field_breakdown: {
        full_name: { req: 40, filled: 40 },
        public_email: { req: 40, filled: 12 },
        mobile_phone: { req: 40, filled: 5 },
        linkedin_url: { req: 40, filled: 8 }
      }
    }
  ];

  // 6. Real Solvrex Candidate Leads Dataset (260 Actual Records)
  const leads = [
    // Students Sample (Batch 7)
    {
      s_no: 1,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Rawnak Amin',
      university_or_company: 'University of Toronto',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2026-27 Market',
      field_or_industry: 'Economic History, Development Economics',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: 'UofT Economics PhD Job Candidates roster 2026-27',
      linkedin_url: 'Not public',
      public_email: 'rawnak.amin@mail.utoronto.ca',
      mobile_phone: '647-444-9789',
      source_of_contact_info: 'economics.utoronto.ca & rawnakamin.github.io',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Job market paper on North Carolina textile industry.'
    },
    {
      s_no: 2,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Grant Benjamin',
      university_or_company: 'University of Toronto',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2026-27 Market',
      field_or_industry: 'Empirical Microeconomics, Urban Economics',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: 'UofT Economics PhD roster; paper dated Nov 6, 2026',
      linkedin_url: 'Not public',
      public_email: 'grant.benjamin@mail.utoronto.ca',
      mobile_phone: 'Not public',
      source_of_contact_info: 'economics.utoronto.ca & grantbenjamin.github.io',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Entered PhD 2021 on 2026-27 job market.'
    },
    {
      s_no: 3,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Alison Cane',
      university_or_company: 'University of Toronto',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2027 (expected)',
      field_or_industry: 'Applied Microeconomics, Labour Economics',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: 'UofT Economics PhD Candidates roster',
      linkedin_url: 'Not public',
      public_email: 'a.cane@mail.utoronto.ca',
      mobile_phone: '902-233-7307',
      source_of_contact_info: 'economics.utoronto.ca & alisoncane.github.io',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Canadian citizen. CV updated Oct 31, 2026.'
    },
    {
      s_no: 4,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Harrison Chang',
      university_or_company: 'University of Toronto',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2026-27 Market',
      field_or_industry: 'Labour Economics, Economic History',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: 'UofT Economics PhD Job Candidates roster',
      linkedin_url: 'Not public',
      public_email: 'harrison.chang@mail.utoronto.ca',
      mobile_phone: '416-254-3037',
      source_of_contact_info: 'economics.utoronto.ca & sites.google.com/view/harrisonc',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Paper: Economic Depression and Unionization (Panic of 1873).'
    },
    {
      s_no: 5,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Taryn Eames',
      university_or_company: 'University of Toronto',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2027 (expected)',
      field_or_industry: 'Applied Microeconomics, Education, Discrimination',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: 'UofT Economics PhD Candidates roster',
      linkedin_url: 'Not public',
      public_email: 'taryn.eames@mail.utoronto.ca',
      mobile_phone: '647-409-6114',
      source_of_contact_info: 'economics.utoronto.ca & taryneames.com',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'SSHRC Doctoral Fellowship 2025-2027.'
    },
    {
      s_no: 12,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Chi Danh Dao',
      university_or_company: "Queen's University",
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2026-27 Market',
      field_or_industry: 'Financial Economics, Household Finance',
      city: 'Kingston',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: "Queen's Economics PhD Candidates roster",
      linkedin_url: 'Not public',
      public_email: '21cdd3@queensu.ca',
      mobile_phone: 'Not public',
      source_of_contact_info: 'econ.queensu.ca',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'John Deutsch Institute Policy Insight on credit card market, July 2026.'
    },
    {
      s_no: 16,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Tanvir Ahmed Khan',
      university_or_company: "Queen's University",
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2026-27 Market',
      field_or_industry: 'Applied Microeconomics, Economics of AI, Machine Learning',
      city: 'Kingston',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: "Queen's Economics PhD Candidates roster",
      linkedin_url: 'Not public',
      public_email: '20takt@queensu.ca',
      mobile_phone: 'Not public',
      source_of_contact_info: 'econ.queensu.ca',
      likely_solvrex_service_fit: 'Job search strategy, resume/CV review, LinkedIn optimization, personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'AI-economics focus makes him a strong fit for tech/policy roles.'
    },
    {
      s_no: 27,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Brice Romuald Gueyap Kounga',
      university_or_company: 'Western University',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2027 (expected)',
      field_or_industry: 'Econometrics, Development Economics, Political Economy',
      city: 'London',
      country: 'Canada',
      target_location: 'Not stated',
      job_status: 'Seeking full-time employment',
      open_to_work_signal: "Western Economics 2026/27 Job Market Candidates page",
      linkedin_url: 'https://www.linkedin.com/in/bricegueyap',
      public_email: 'bgueyapk@uwo.ca',
      mobile_phone: '+1 226-239-6123',
      source_of_contact_info: 'economics.uwo.ca & bricegueyap.github.io',
      likely_solvrex_service_fit: 'Job search strategy, resume review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Semiparametric Dynamic Logit Model with Endogenous Networks.'
    },
    {
      s_no: 32,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Hasnain Azam',
      university_or_company: 'University of Waterloo',
      course_or_title: 'BASc, Computer Engineering (co-op)',
      graduation_or_exp: 'Summer 2027',
      field_or_industry: 'Computer Engineering, Software Engineering',
      city: 'Waterloo',
      country: 'Canada',
      target_location: 'Not stated',
      job_status: 'Open to Summer 2027 internships',
      open_to_work_signal: 'hasnainazam.com banner: Open to Summer 2027 internships',
      linkedin_url: 'https://www.linkedin.com/in/hasnain--azam/',
      public_email: 'h5azam@uwaterloo.ca',
      mobile_phone: 'Not public',
      source_of_contact_info: 'hasnainazam.com',
      likely_solvrex_service_fit: 'Job search strategy, resume review, LinkedIn optimization, internship support',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Currently SWE intern at Shopify; prior at Ford Pro, Sun Life.'
    },
    {
      s_no: 40,
      category: 'Student',
      task_id: 'SLV-TSK-701',
      full_name: 'Sara Abdeen',
      university_or_company: 'McGill University',
      course_or_title: 'PhD in Economics',
      graduation_or_exp: '2027',
      field_or_industry: 'Development Economics, Labor Economics',
      city: 'Montreal',
      country: 'Canada',
      target_location: 'Canada',
      job_status: 'Actively seeking post-PhD role',
      open_to_work_signal: 'McGill Economics PhD Candidates 2026-2027 page',
      linkedin_url: 'Not public',
      public_email: 'sara.abdeen@mail.mcgill.ca',
      mobile_phone: '+1 (438) 337 2197',
      source_of_contact_info: 'mcgill.ca & sites.google.com/view/saraabdeen',
      likely_solvrex_service_fit: 'Academic job search strategy, CV review, LinkedIn optimization',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Port containerization on structural transformation in Africa.'
    },

    // Grads Sample (Batch 7)
    {
      s_no: 51,
      category: 'Grad',
      task_id: 'SLV-TSK-702',
      full_name: 'Harun Mwondi',
      university_or_company: 'Carleton University',
      course_or_title: 'Bachelor of Computer Science (Honours)',
      graduation_or_exp: '2026',
      field_or_industry: 'Computer Science, Software Engineering',
      city: 'Ottawa',
      country: 'Canada',
      target_location: 'Ottawa, Ontario, Canada',
      job_status: 'Seeking full-time software role',
      open_to_work_signal: 'harunmwondi.vercel.app portfolio active Nov 2026',
      linkedin_url: 'https://www.linkedin.com/in/harunmwondi',
      public_email: 'HARUNMWONDI@cmail.carleton.ca',
      mobile_phone: '(343)-558-0016',
      source_of_contact_info: 'harunmwondi.vercel.app; github.com/HarunHashim',
      likely_solvrex_service_fit: 'Resume review, LinkedIn optimization, job search strategy',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Ford Motors SYNC HMI Software Engineer Intern Jan-Aug 2025.'
    },
    {
      s_no: 52,
      category: 'Grad',
      task_id: 'SLV-TSK-702',
      full_name: 'Grant Achuzia',
      university_or_company: 'Carleton University',
      course_or_title: 'Bachelor of Engineering, Computer Systems',
      graduation_or_exp: '2026',
      field_or_industry: 'Computer Systems Engineering',
      city: 'Ottawa',
      country: 'Canada',
      target_location: 'Ottawa, Ontario, Canada',
      job_status: 'Seeking full-time software role',
      open_to_work_signal: 'gachuzia.com crawled Nov 2026',
      linkedin_url: 'https://www.linkedin.com/in/grant-achuzia',
      public_email: 'grant.achuzia@gmail.com',
      mobile_phone: '343-997-6787',
      source_of_contact_info: 'gachuzia.com',
      likely_solvrex_service_fit: 'Resume review, LinkedIn optimization, job search strategy',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: '2024 Canadian Engineering Competition bronze medalist.'
    },
    {
      s_no: 53,
      category: 'Grad',
      task_id: 'SLV-TSK-702',
      full_name: 'Guan Huang',
      university_or_company: 'University of Toronto',
      course_or_title: 'MSc in Applied Computing - AI',
      graduation_or_exp: '2026',
      field_or_industry: 'Applied Computing, Machine Learning',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Toronto, Ontario, Canada',
      job_status: 'Seeking ML/AI engineering role',
      open_to_work_signal: 'coronring.github.io updated Nov 2026',
      linkedin_url: 'https://www.linkedin.com/in/guan0huang',
      public_email: 'guanzheng66.huang@gmail.com',
      mobile_phone: 'Not public',
      source_of_contact_info: 'coronring.github.io',
      likely_solvrex_service_fit: 'Resume review, LinkedIn optimization, job search strategy, personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: '4+ years applied ML experience at Railtown AI Technology.'
    },
    {
      s_no: 54,
      category: 'Grad',
      task_id: 'SLV-TSK-702',
      full_name: 'Muhammad Muzammil',
      university_or_company: 'University of Toronto',
      course_or_title: 'HBSc in Computer Science, Math & Stats',
      graduation_or_exp: '2026',
      field_or_industry: 'Computer Vision, AI',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Toronto, Ontario, Canada',
      job_status: 'Seeking full-time software/AI role',
      open_to_work_signal: 'cs.toronto.edu/~muzammil crawled Nov 2026',
      linkedin_url: 'https://www.linkedin.com/in/muhammad-muzammil',
      public_email: 'm.muzammil@mail.utoronto.ca',
      mobile_phone: '778-837-7131',
      source_of_contact_info: 'cs.toronto.edu/~muzammil',
      likely_solvrex_service_fit: 'Resume review, LinkedIn optimization, job search strategy',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'GPA 3.97/4.00. Publications in pain detection AI.'
    },
    {
      s_no: 58,
      category: 'Grad',
      task_id: 'SLV-TSK-702',
      full_name: 'Josh Friedman',
      university_or_company: "Queen's University",
      course_or_title: 'B.A.Sc. in Computer Engineering & Innovation',
      graduation_or_exp: '2026',
      field_or_industry: 'Computer Engineering, Full Stack',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Toronto, Ontario, Canada',
      job_status: 'Seeking full-time software role',
      open_to_work_signal: 'joshfriedman.dev updated Nov 2026',
      linkedin_url: 'https://www.linkedin.com/in/joshwfriedman',
      public_email: 'friedman.josh03@gmail.com',
      mobile_phone: '(416) 843-6670',
      source_of_contact_info: 'joshfriedman.dev',
      likely_solvrex_service_fit: 'Resume review, LinkedIn optimization, job search strategy, personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: "Dean's Scholar (GPA 4.11/4.3). Nutripair Founding Tech Lead."
    },

    // Founders Sample (Batch 7)
    {
      s_no: 101,
      category: 'Founder',
      task_id: 'SLV-TSK-703',
      full_name: 'Jonathan Rosenbluth',
      university_or_company: 'Blackletter',
      course_or_title: 'Co-founder & CEO',
      graduation_or_exp: 'Founder (Founded 2026)',
      field_or_industry: 'LegalTech / AI-native law firm',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Active founder',
      open_to_work_signal: 'US$6M seed round Nov 11, 2026 + active hiring',
      linkedin_url: 'Not public',
      public_email: 'Not public',
      mobile_phone: 'Not public',
      source_of_contact_info: 'LegalTech.ca; Global Legal Post',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding, Founder positioning',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: "Harvard JD; McKinsey alum; Cohere early hire. Raised US$6M."
    },
    {
      s_no: 104,
      category: 'Founder',
      task_id: 'SLV-TSK-703',
      full_name: 'Ian Collins',
      university_or_company: 'Bot Food',
      course_or_title: 'Founder & CEO',
      graduation_or_exp: '30 years in tech',
      field_or_industry: 'AI / Personal Data Infrastructure',
      city: 'Toronto',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Active founder',
      open_to_work_signal: 'C$1.5M pre-seed Oct 30, 2026 + beta launch',
      linkedin_url: 'Not public',
      public_email: 'Not public',
      mobile_phone: 'Not public',
      source_of_contact_info: 'GreenSky Ventures press release; ralhf.ai',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Co-founded Wysdom AI (sold to Calabrio in 2024).'
    },
    {
      s_no: 121,
      category: 'Founder',
      task_id: 'SLV-TSK-704',
      full_name: 'Jason Liao',
      university_or_company: 'Mundo AI',
      course_or_title: 'Co-Founder & CEO',
      graduation_or_exp: 'Founder (Founded 2024)',
      field_or_industry: 'AI / Data Infrastructure',
      city: 'Vancouver',
      country: 'Canada',
      target_location: 'British Columbia, Canada',
      job_status: 'Active founder',
      open_to_work_signal: 'US$24M total raise ($20M Series A) Sep 2026',
      linkedin_url: 'https://www.linkedin.com/in/jasonliao02/',
      public_email: 'contact@mundoai.world',
      mobile_phone: 'Not public',
      source_of_contact_info: 'Y Combinator launch page; Techcouver',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'YC Winter 2025; UBC BCom Business & CS alumnus.'
    },
    {
      s_no: 122,
      category: 'Founder',
      task_id: 'SLV-TSK-704',
      full_name: 'Kenneth Wu',
      university_or_company: 'Mundo AI',
      course_or_title: 'Co-Founder & CTO',
      graduation_or_exp: 'Founder (Founded 2024)',
      field_or_industry: 'AI / Data Infrastructure',
      city: 'Vancouver',
      country: 'Canada',
      target_location: 'British Columbia, Canada',
      job_status: 'Active founder',
      open_to_work_signal: 'US$24M total raise ($20M Series A) Sep 2026',
      linkedin_url: 'https://www.linkedin.com/in/wukenneth/',
      public_email: 'contact@mundoai.world',
      mobile_phone: 'Not public',
      source_of_contact_info: 'Y Combinator launch page; Techcouver',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Co-Founder and CTO of Mundo AI.'
    },
    {
      s_no: 131,
      category: 'Founder',
      task_id: 'SLV-TSK-704',
      full_name: 'Paul Ziadé',
      university_or_company: 'North Vector Dynamics',
      course_or_title: 'Co-Founder & CEO',
      graduation_or_exp: 'Founder (Founded 2022)',
      field_or_industry: 'Defence Tech / Missile Systems',
      city: 'Calgary',
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Active founder',
      open_to_work_signal: 'Series A >US$20M closed Oct 26, 2026',
      linkedin_url: 'https://www.linkedin.com/in/paul-ziade/',
      public_email: 'Not public',
      mobile_phone: 'Not public',
      source_of_contact_info: 'GlobeNewswire; Tank Talks',
      likely_solvrex_service_fit: 'LinkedIn optimization & executive personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Former University of Calgary engineering professor.'
    },
    {
      s_no: 141,
      category: 'Founder',
      task_id: 'SLV-TSK-705',
      full_name: 'Adam Keating',
      university_or_company: 'CoLab (CoLab AI)',
      course_or_title: 'Co-Founder & CEO',
      graduation_or_exp: 'Founder (Founded 2017)',
      field_or_industry: 'AI / Engineering CAD Collaboration',
      city: "St. John's",
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Active founder',
      open_to_work_signal: 'US$72M Series C; Bombardier AI contract 2026',
      linkedin_url: 'https://www.linkedin.com/in/adammichaelkeating/',
      public_email: 'Not public',
      mobile_phone: 'Not public',
      source_of_contact_info: 'Inspiring Canadians; Deloitte Fast 50',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Memorial University alumnus; Y Combinator alumnus.'
    },
    {
      s_no: 142,
      category: 'Founder',
      task_id: 'SLV-TSK-705',
      full_name: 'Scott Stevenson',
      university_or_company: 'Spellbook',
      course_or_title: 'Co-Founder & CEO',
      graduation_or_exp: 'Founder (Founded 2018)',
      field_or_industry: 'Legal Tech / AI Contract Drafting',
      city: "St. John's",
      country: 'Canada',
      target_location: 'Not public',
      job_status: 'Active founder',
      open_to_work_signal: 'US$50M Series B (Khosla Ventures); Fast 50',
      linkedin_url: 'https://www.linkedin.com/in/scottas/',
      public_email: 'Not public',
      mobile_phone: 'Not public',
      source_of_contact_info: 'CanadianSME; blog.scottstevenson.net',
      likely_solvrex_service_fit: 'LinkedIn optimization, Personal branding',
      outreach_status: 'Not contacted',
      date_collected: '2026-11-16',
      notes: 'Memorial University computer engineering graduate.'
    }
  ];

  // 7. Audit Log
  const auditLogs = [
    {
      id: 'AUD-SLV-001',
      user: 'Vikram Sethi (Solvrex Operations)',
      action: 'target edit',
      target_key: 'completed_daily_target',
      old_value: '500',
      new_value: '300',
      timestamp: '2026-11-16T09:15:00Z'
    },
    {
      id: 'AUD-SLV-002',
      user: 'Vikram Sethi (Solvrex Operations)',
      action: 'data sync',
      target_key: 'Solvrex Batch 7 Lead Ingestion',
      old_value: 'Batch 6',
      new_value: 'Batch 7 (260 Verified Leads)',
      timestamp: '2026-11-16T09:20:00Z'
    },
    {
      id: 'AUD-SLV-003',
      user: 'Sanjay Gupta (Admin)',
      action: 'system update',
      target_key: 'Company Profile & MongoDB Cluster',
      old_value: 'Generic Prototype',
      new_value: 'Solvrex Private Limited Enterprise Pipeline',
      timestamp: '2026-11-16T10:00:00Z'
    }
  ];

  // 8. Import Errors (Section 4 Compliance)
  const importErrors = [
    {
      id: 'ERR-SLV-01',
      source_record_id: 'SLV-FEED-MISSING-DUE-DATE',
      error_reason: 'Missing required field(s): due_date in candidate intake',
      raw_data: {
        candidate_name: 'Unverified Economics Graduate',
        university: 'Carleton University',
        rows_assigned: 50
      },
      timestamp: '2026-11-16T06:00:02Z'
    }
  ];

  // 9. Sync Metadata
  const nowIso = new Date().toISOString();
  const syncMeta = {
    last_updated: nowIso,
    sync_status: 'success',
    last_success_timestamp: nowIso,
    error_message: null,
    scheduled_time: '06:00 AM IST Daily',
    source_name: 'Solvrex Lead Production Tracker (Batch 7 API)'
  };

  // Reset local file/memory store
  db.resetAll({
    users,
    tasks,
    qa_checks: qaChecks,
    coverage,
    settings,
    audit_log: auditLogs,
    import_errors: importErrors,
    sync_meta: syncMeta,
    leads
  });

  // Also sync directly to MongoDB if Mongoose connection is ready!
  if (mongoose.connection.readyState === 1) {
    try {
      await Promise.all([
        User.deleteMany({}),
        Task.deleteMany({}),
        QACheck.deleteMany({}),
        Coverage.deleteMany({}),
        Setting.deleteMany({}),
        AuditLog.deleteMany({}),
        ImportError.deleteMany({}),
        Lead.deleteMany({})
      ]);

      await Promise.all([
        User.insertMany(users),
        Task.insertMany(tasks),
        QACheck.insertMany(qaChecks),
        Coverage.insertMany(coverage),
        Setting.insertMany(settings),
        AuditLog.insertMany(auditLogs),
        ImportError.insertMany(importErrors),
        Lead.insertMany(leads)
      ]);
      console.log('[MongoDB] All Solvrex Private Limited collections successfully populated in MongoDB.');
    } catch (err) {
      console.warn('[MongoDB] Warning during Mongo sync:', err.message);
    }
  }

  console.log('[Seed] Solvrex Private Limited data successfully loaded!');
}

export default seedDatabase;
