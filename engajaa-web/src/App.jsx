import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { Sidebar } from './components/layout/Sidebar';
import LoginPage from './modules/auth/LoginPage';
import InviteAcceptPage from './modules/auth/InviteAcceptPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import AnalyticsPage from './modules/analytics/AnalyticsPage';
import SuggestionsPage from './modules/suggestions/SuggestionsPage';
import SchedulerPage from './modules/scheduler/SchedulerPage';
import SettingsPage from './modules/settings/SettingsPage';
import GrowthRadarPage from './modules/growth-radar/GrowthRadarPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7FF' }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>Carregando…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <TenantProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: '#F8F7FF' }}>
          <Outlet />
        </main>
      </div>
    </TenantProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/accept" element={<InviteAcceptPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/growth-radar" element={<GrowthRadarPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
