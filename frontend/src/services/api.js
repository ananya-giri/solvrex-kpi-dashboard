const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('kpi_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  },

  getDemoAccounts: async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-accounts`);
    return res.json();
  },

  // KPIs
  getKPISummary: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/kpi/summary?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load KPI summary');
    return res.json();
  },

  getTrendData: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/kpi/trend?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load trend data');
    return res.json();
  },

  getTeamTable: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/kpi/team?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load team data');
    return res.json();
  },

  getWorkMix: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/kpi/work-mix?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load work mix');
    return res.json();
  },

  getNeedsAttention: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/kpi/needs-attention?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load attention list');
    return res.json();
  },

  getDrilldown: async (kpiKey, filters = {}) => {
    const params = new URLSearchParams({ ...filters, kpiKey });
    const res = await fetch(`${BASE_URL}/kpi/drilldown?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load drill-down records');
    return res.json();
  },

  getFilterOptions: async () => {
    const res = await fetch(`${BASE_URL}/kpi/filter-options`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load filter options');
    return res.json();
  },

  // Tasks & Sheet View
  getTasks: async () => {
    const res = await fetch(`${BASE_URL}/tasks`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
  },

  getTaskSheetDetail: async (taskId) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load sheet details');
    }
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${BASE_URL}/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  updateSetting: async (payload) => {
    const res = await fetch(`${BASE_URL}/settings/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update setting');
    }
    return res.json();
  },

  addUser: async (userData) => {
    const res = await fetch(`${BASE_URL}/settings/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to manage user');
    }
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch(`${BASE_URL}/settings/audit-logs`, { headers: getHeaders() });
    return res.json();
  },

  // Sync
  getSyncStatus: async () => {
    const res = await fetch(`${BASE_URL}/sync/status`, { headers: getHeaders() });
    return res.json();
  },

  refreshNow: async (simulateFailure = false) => {
    const res = await fetch(`${BASE_URL}/sync/refresh`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ simulateFailure })
    });
    return res.json();
  },

  getImportErrors: async () => {
    const res = await fetch(`${BASE_URL}/sync/errors`, { headers: getHeaders() });
    return res.json();
  },

  testTrackerImport: async () => {
    const res = await fetch(`${BASE_URL}/sync/test-import`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Export URLs
  getExportUrl: (type, filters = {}) => {
    const params = new URLSearchParams(filters);
    const token = localStorage.getItem('kpi_auth_token');
    // Note: token can be passed in header or query if needed, or fetched via blob
    return `${BASE_URL}/export/${type}?${params.toString()}`;
  },

  downloadExport: async (type, filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/export/${type}?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Export to ${type} failed`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KPI_Dashboard_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default api;
