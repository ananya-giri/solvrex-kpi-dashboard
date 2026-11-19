# Analyst Team KPI Dashboard (Zero Spend — Rs. 0 Budget)

> One web dashboard for the analyst team: output, quality and delivery in one trusted view. Built strictly according to the **KPI Dashboard Technical Build Specification** using the **MERN stack** (MongoDB, Express, React, Node.js).

---

## 🚀 Features & Deliverables (v1 Scope)

### 1. The 5 Complete Views
- **Login View:** Built-in email & password authentication with 1-click demo persona buttons (Manager Vikram Sethi, Analyst Rahul Sharma, Analyst Priya Patel, Admin Sanjay Gupta). Auto-redirects by role.
- **Team View (Manager Default):**
  - **Filter Bar:** Date Range, Analyst, Team / Vertical, City, Sheet Type, and Export.
  - **4 Top KPI Cards:** Completed (Number + vs target), Completion % (Green/Amber/Red), Accuracy % (Green/Amber/Red), and Overdue (Red if > 0).
  - **Trend Chart:** Completed and accuracy by day (last 30 days) powered by Recharts.
  - **Team Summary Table:** One row per analyst, all 8 KPIs, sortable columns, and status colors.
  - **Work Mix:** Breakdown of completed rows by vertical, city, and sheet type.
  - **Needs Attention:** Real-time flagged list of overdue tasks, high rework (>5%), and accuracy below 90%.
- **Individual View:**
  - Manager can select and inspect any analyst.
  - **Analyst can view self ONLY** (access control enforced on frontend and backed by HTTP 403 Forbidden checks on the server).
  - Displays that analyst's 8 KPIs, 30-day output trend, and detailed task list.
- **Task / Sheet View:**
  - In-depth sheet inspection: assigned vs completed rows, coverage / fill rate %, duplicates found, QA sample results (checked, correct, reworked), and underlying row-level records.
- **Settings View (Manager + Admin):**
  - Editable global targets for all 8 KPIs.
  - Editable daily targets by task type (Lead Generation, Data Enrichment, Phone Verification, Email Discovery).
  - Editable coverage targets per sheet type (B2B Companies, Executive Contacts, Healthcare Providers, Local Retailers).
  - User and role management (Admin only).
  - **Full Audit Log:** Every target edit and user change is audit-logged with user, old value, new value, and timestamp.
  - **Reliability & Diagnostics Sandbox:** 1-click simulation of tracker sync failure and ingestion of malformed records to verify the import-errors log.

### 2. The 8 Mandated KPIs — Exact Formulas
1. **Tasks / rows completed:** Count of rows completed in period (vs daily target).
2. **Completion rate:** `(Rows completed / rows assigned) * 100` (target: ≥ 90%).
3. **Accuracy rate:** `(Rows verified correct / rows checked in QA sample) * 100` (target: ≥ 95%).
   - *Zero-QA Rule:* If `rows_checked == 0`, shows **"Not checked" / "—"**, never 0% or 100%.
4. **Rework rate:** `(Rows sent back / rows completed) * 100` (target: ≤ 5%).
   - *No double counting:* Reworked rows count once on final delivery and once in rework rate.
5. **On-time delivery:** `(Tasks delivered on/before due date / tasks due) * 100` (target: ≥ 95%).
6. **Coverage / fill rate:** `(Required fields filled / required fields total) * 100` (per sheet type target).
7. **Duplicate rate:** `(Duplicate rows found / rows completed) * 100` (target: ≤ 1%).
8. **Pending / backlog:** Count of assigned tasks not completed and past due date (**Red if > 0**).

### 3. Status Colours Rule
- **Green:** At or better than target.
- **Amber:** Within 10% below target.
- **Red:** More than 10% below target, or any overdue backlog.
- **Neutral:** Blank / Not checked (zero division case).

### 4. Zero Spend & Technology Stack
- **Frontend:** React 18, Tailwind CSS, Recharts, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB via Mongoose + embedded zero-config persistent fallback JSON engine.
- **Exports:** ExcelJS (.xlsx), CSV (.csv), and browser Print-to-PDF (.pdf).
- **Zero Paid Tools:** Total invoices = **Rs. 0**. No credit/debit card required.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional)* Docker & Docker Compose or MongoDB Community Edition

### 1. Installation
```bash
# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### 2. Build Frontend Production Bundle
```bash
npm run build
```

### 3. Start the Full Application
```bash
npm start
```
The unified full-stack dashboard will run at **`http://localhost:5000`**.

### 4. Run Formula & Access Control Tests
```bash
npm test
```
Runs 11 automated test cases verifying all 8 KPI formulas, zero-QA sample behavior, status colors, and drill-down row counts.

---

## 👥 Demo Credentials

| Persona | Email | Password | Default Redirect |
|---|---|---|---|
| **Vikram Sethi (Manager)** | `manager@company.com` | `password123` | `/team` (Team View) |
| **Rahul Sharma (Analyst)** | `rahul@company.com` | `password123` | `/individual` (Individual View) |
| **Priya Patel (Analyst)** | `priya@company.com` | `password123` | `/individual` (Individual View) |
| **Sanjay Gupta (Admin)** | `admin@company.com` | `password123` | `/settings` (Settings View) |

---

## 📄 Handover Note
See [HANDOVER_NOTE.md](file:///c:/Users/ANANYA%20GIRI/OneDrive/Desktop/KPI%20Dashboard/HANDOVER_NOTE.md) for the complete 1-page operational handover document and filled zero-spend checklist.
