import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './layouts/MainLayout';
import WaiterLayout from './layouts/WaiterLayout';
import TournamentsPage from './pages/TournamentsPage';
import TournamentManagePage from './pages/TournamentManagePage';
import RatingsPage from './pages/RatingsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminPanelPage from './pages/admin/AdminPanelPage';
import TVDisplayPage from './pages/TVDisplayPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-cyan-400 animate-pulse">Загрузка...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-cyan-400 animate-pulse">Загрузка...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/tournaments" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tv" element={<TVDisplayPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/tournaments" replace />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/manage" element={<TournamentManagePage />} />
        <Route path="ratings" element={<RatingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<ProfilePage />} />
        <Route path="settings/*" element={<SettingsPage />} />
        <Route path="admin/*" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
      </Route>
      <Route path="/waiter" element={<ProtectedRoute><WaiterLayout /></ProtectedRoute>}>
        <Route index element={<TournamentsPage waiter />} />
      </Route>
    </Routes>
  );
}

export default App;
