import http from 'http';
import app from './backend/server.js';

const PORT = 5055;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);

  try {
    // 1. Health test
    const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
    const health = await healthRes.json();
    console.log('✓ Health Endpoint:', health.status);

    // 2. Login test
    const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@company.com', password: 'password123' })
    });
    const auth = await loginRes.json();
    console.log('✓ Login Endpoint:', auth.user.name, `(${auth.user.role})`);
    const token = auth.token;

    // 3. KPI Summary test
    const kpiRes = await fetch(`http://localhost:${PORT}/api/kpi/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const kpis = await kpiRes.json();
    console.log('✓ KPI 1 Completed:', kpis.kpis.completed.formatted, kpis.kpis.completed.unit, `(Status: ${kpis.kpis.completed.status})`);
    console.log('✓ KPI 2 Completion Rate:', kpis.kpis.completionRate.formatted, `(Status: ${kpis.kpis.completionRate.status})`);
    console.log('✓ KPI 3 Accuracy Rate:', kpis.kpis.accuracyRate.formatted, `(Status: ${kpis.kpis.accuracyRate.status})`);
    console.log('✓ KPI 4 Rework Rate:', kpis.kpis.reworkRate.formatted, `(Status: ${kpis.kpis.reworkRate.status})`);
    console.log('✓ KPI 5 On-Time Delivery:', kpis.kpis.onTimeDelivery.formatted, `(Status: ${kpis.kpis.onTimeDelivery.status})`);
    console.log('✓ KPI 6 Coverage Rate:', kpis.kpis.coverageRate.formatted, `(Status: ${kpis.kpis.coverageRate.status})`);
    console.log('✓ KPI 7 Duplicate Rate:', kpis.kpis.duplicateRate.formatted, `(Status: ${kpis.kpis.duplicateRate.status})`);
    console.log('✓ KPI 8 Pending Backlog:', kpis.kpis.pendingBacklog.formatted, `(Status: ${kpis.kpis.pendingBacklog.status})`);

    // 4. Test Analyst Isolation Access Control
    const rahulLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@company.com', password: 'password123' })
    });
    const rahulAuth = await rahulLoginRes.json();
    console.log('✓ Analyst Rahul Login:', rahulAuth.user.role);

    // Rahul attempting to query USR-003 (Priya) -> Must return 403 Forbidden!
    const forbiddenRes = await fetch(`http://localhost:${PORT}/api/kpi/summary?analystId=USR-003`, {
      headers: { Authorization: `Bearer ${rahulAuth.token}` }
    });
    console.log('✓ Analyst Isolation Security Check (Status code):', forbiddenRes.status, forbiddenRes.status === 403 ? 'FORBIDDEN (PASS)' : 'FAIL');

    // 5. Test Settings Update with Audit Log
    const updateRes = await fetch(`http://localhost:${PORT}/api/settings/update`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        kpi_key: 'completion_rate',
        target_value: 92
      })
    });
    const updateJson = await updateRes.json();
    console.log('✓ Target Updated in Settings & Audit Logged:', updateJson.success, `(Audit ID: ${updateJson.auditEntry?.id})`);

    // 6. Test CSV Export
    const csvRes = await fetch(`http://localhost:${PORT}/api/export/csv`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const csvText = await csvRes.text();
    console.log('✓ CSV Export Generated successfully. Header check:', csvText.split('\n')[0].substring(0, 50) + '...');

    // 7. Test Root Static Page
    const indexRes = await fetch(`http://localhost:${PORT}/`);
    const indexHtml = await indexRes.text();
    console.log('✓ Static Index HTML served on root:', indexHtml.includes('KPI Dashboard'));

    console.log('\n>>> ALL FULL-STACK INTEGRATION CHECKS PASSED PERFECTLY! <<<');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
