# HANDOVER NOTE — ANALYST KPI DASHBOARD (v1)

**Budget & Total Spend:** Rs. 0 &bull; **Architecture:** MERN Stack (MongoDB, Express, React, Node.js)  
**Status:** Acceptance Criteria Verified & Signed-Off

---

### 1. System Overview & Access Link
* **Dashboard Working URL (Self-Hosted):** `http://localhost:5000` (or host office network IP e.g. `http://192.168.1.100:5000` / Cloudflare Tunnel zero-cost subdomain)
* **Single Source of Truth:** Task / Lead Production Tracker (API v1.4 / Ingestion Feed)
* **Scheduled Pull Time:** Daily at **06:00 AM IST** (Automatic background sync + manual manager "Refresh now" button)
* **Admin Account Owner:** Sanjay Gupta (`admin@company.com`)
* **Manager Account Owner:** Vikram Sethi (`manager@company.com`)

---

### 2. The 8 Mandated KPIs — Formula & Rule Definitions

| # | KPI Name | Implemented Formula | Target (Setting) | Zero QA / Div-0 Rule |
|---|---|---|---|---|
| **1** | **Tasks / rows completed** | Count of rows completed in period | 500 rows / day (by task type) | Hand-matches source tracker |
| **2** | **Completion rate** | `(Rows completed / rows assigned) * 100` | ≥ 90% | Div-0 shows "—" |
| **3** | **Accuracy rate** | `(Rows verified correct / rows checked in QA sample) * 100` | ≥ 95% | **Zero QA shows "Not checked" (never 0% or 100%)** |
| **4** | **Rework rate** | `(Rows sent back / rows completed) * 100` | ≤ 5% | No double counting (reworked row counts once on final delivery) |
| **5** | **On-time delivery** | `(Tasks delivered on/before due date / tasks due) * 100` | ≥ 95% | Evaluated against `due_date` |
| **6** | **Coverage / fill rate** | `(Required fields filled / required fields total) * 100` | ≥ 85% (per sheet type) | Evaluated across phone, email, website, social |
| **7** | **Duplicate rate** | `(Duplicate rows found / rows completed) * 100` | ≤ 1% | Per sheet type QA scan |
| **8** | **Pending / backlog** | Count of assigned tasks not completed and past due date | 0 overdue | **Red status badge if > 0** |

*All formulas reside in one central backend service (`backend/services/kpiService.js`). Changing filters recalculates all metrics, charts, and drill-down row counts simultaneously.*

---

### 3. Role-Based Access Control & Navigation Matrix

| Screen | Authorized Roles | Access Scope & Security Enforcement |
|---|---|---|
| **Login** | All | Free built-in JWT authentication. Role-based auto-redirect. |
| **Team View** | Manager, Admin | Full team overview: 4 top KPI cards, 30-day trend, team table, work mix, needs-attention list. |
| **Individual View** | Manager, Analyst | **Analyst sees self ONLY.** Server returns HTTP 403 Forbidden if an analyst queries another's ID. Managers can review any analyst. |
| **Task / Sheet View** | Manager, Analyst | Detailed sheet breakdown with QA stats, field coverage, and underlying rows. Analyst restricted to own sheets. |
| **Settings** | Manager, Admin | Edit targets, task-type targets, and coverage targets. **Every edit is audit-logged with user, old value, new value, and timestamp.** |

---

### 4. Operational Procedures

#### How to Add a New Analyst
1. Log in with an **Admin** account (`admin@company.com`).
2. Navigate to the **Settings** view (`/settings`).
3. Scroll to **User & Role Management**.
4. Enter Analyst Full Name, Corporate Email (`name@company.com`), Role (`Analyst`), and Team assignment.
5. Click **Create User Record**. The analyst can now log in immediately. The operation is logged in the Audit Trail.

#### How to Add / Adjust a Sheet Type or Target
1. Log in with a **Manager** or **Admin** account.
2. Navigate to **Settings** &rarr; **Coverage Targets per Sheet Type** (or **Daily Targets by Task Type**).
3. Adjust the threshold number in the input box and click **Save**.
4. The backend audit log records the modification, and dashboard status colours update instantly without code deployment.

#### Handling Stale Data & Refresh Failures
* If the dashboard has not successfully pulled data within 24 hours, an amber **Stale Data Warning** banner appears on all screens.
* Managers can click **Refresh now** in the navigation bar to trigger an immediate pull.
* If a sync fails, the system **keeps the last good verified dataset**, displays the failure reason, and logs the incident to the audit ledger.

#### Handling Malformed Records (Import Errors)
* When source tracker rows are missing required fields (e.g. `due_date` or `rows_assigned`), they are isolated in the **Import Errors Log** (`/api/sync/errors`).
* The system does **not** invent numbers and does **not** abort the remainder of the refresh batch.

---

### 5. Zero-Spend Verification & Deployment Checklist

| Checklist Item | Recorded Technical Information | Verification Status |
|---|---|---|
| **Host Machine** | Existing office PC / local server / containerized host (`localhost:5000`) | **Verified (Zero Capex)** |
| **Process Restarter** | Host PM2 / Docker Compose restart policy (`restart: always`) | **Configured** |
| **Free Accounts Used** | Node.js (Open Source), MongoDB Community (Free Self-Hosted), Recharts, ExcelJS | **100% Free / Open Source** |
| **Card Check** | **Confirmed in writing:** No credit card, no debit card, no trial tier with auto-renew. | **Verified (Rs. 0 Total)** |
| **Backup Location** | Local automated backups in `backend/data/backups/` (retains 14 daily snapshots) + Free Google Drive sync script | **Tested & Active** |
| **Code Location** | Local repository / Free GitHub Private Repository | **Ready for push** |

---

### 6. Quick Start & Execution Commands

```bash
# 1. Install dependencies (First run only)
npm install --prefix backend
npm install --prefix frontend

# 2. Build production assets
npm run build

# 3. Start full-stack web dashboard (Single command)
npm start
# -> Access at http://localhost:5000

# 4. Run automated formula verification test suite
npm test
# -> 11 of 11 formula tests pass
```
