import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import TeamView from './views/TeamView';
import IndividualView from './views/IndividualView';
import TaskSheetView from './views/TaskSheetView';
import SettingsView from './views/SettingsView';
import PrintPDFView from './components/PrintPDFView';
import api from './services/api';

function DashboardContent() {
  const { user, loading, isAnalyst, isManager, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('team');
  const [selectedAnalystId, setSelectedAnalystId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // PDF Print data cache
  const [kpiSummary, setKpiSummary] = useState(null);
  const [teamTableData, setTeamTableData] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);

  // Default tab based on role
  useEffect(() => {
    if (user) {
      if (isAnalyst) {
        setActiveTab('individual');
        setSelectedAnalystId(user.id);
      } else if (isAdmin) {
        setActiveTab('team');
      } else {
        setActiveTab('team');
      }
    }
  }, [user, isAnalyst, isAdmin]);

  // Load print preview summary data
  useEffect(() => {
    if (user) {
      Promise.all([
        api.getKPISummary({}),
        api.getTeamTable({}),
        api.getSyncStatus()
      ]).then(([kpis, team, status]) => {
        setKpiSummary(kpis);
        setTeamTableData(team);
        setSyncStatus(status);
      }).catch(err => console.error(err));
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-xs font-semibold text-slate-600">Initializing KPI Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(loggedInUser) => {
      if (loggedInUser.role === 'Analyst') {
        setActiveTab('individual');
        setSelectedAnalystId(loggedInUser.id);
      } else {
        setActiveTab('team');
      }
    }} />;
  }

  const navigateToIndividual = (analystId) => {
    setSelectedAnalystId(analystId);
    setActiveTab('individual');
  };

  const navigateToSheet = (taskId) => {
    setSelectedTaskId(taskId);
    setActiveTab('sheets');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Interactive Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Screen Views */}
      <main className="flex-1 pb-12">
        {activeTab === 'team' && (
          <TeamView
            onNavigateToIndividual={navigateToIndividual}
            onNavigateToSheet={navigateToSheet}
          />
        )}

        {activeTab === 'individual' && (
          <IndividualView
            selectedAnalystId={selectedAnalystId || user.id}
            onNavigateToSheet={navigateToSheet}
          />
        )}

        {activeTab === 'sheets' && (
          <TaskSheetView
            initialTaskId={selectedTaskId}
            onBack={() => setActiveTab(isAnalyst ? 'individual' : 'team')}
          />
        )}

        {activeTab === 'settings' && (isManager || isAdmin) && (
          <SettingsView />
        )}
      </main>

      {/* Browser Print-to-PDF Format Component */}
      <PrintPDFView
        kpiData={kpiSummary}
        teamData={teamTableData}
        syncStatus={syncStatus}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
