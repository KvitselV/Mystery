import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';

const TABS = [
  { path: '/tournaments', label: 'Турниры и расписание', roles: ['ADMIN', 'CONTROLLER', 'PLAYER'] },
  { path: '/ratings', label: 'Рейтинги', roles: ['ADMIN', 'CONTROLLER', 'PLAYER'] },
  { path: '/profile', label: 'Профиль', roles: ['ADMIN', 'CONTROLLER', 'PLAYER'] },
  { path: '/settings', label: 'Настройки', roles: ['CONTROLLER'] },
  { path: '/admin', label: 'Админ панель', roles: ['ADMIN'] },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isController, isPlayer } = useAuth();
  const { clubs, selectedClub, setSelectedClub } = useClub();

  const isControllerForSelectedClub = isController && selectedClub?.id === user?.managedClubId;
  const visibleTabs = TABS.filter((t) => {
    if (t.roles.includes('ADMIN') && isAdmin) return true;
    if (t.path === '/settings' && isControllerForSelectedClub) return true;
    if (t.roles.includes('CONTROLLER') && t.path !== '/settings' && isController) return true;
    if (t.roles.includes('PLAYER') && isPlayer) return true;
    return false;
  });

  const isWaiter = user?.role === 'WAITER';
  const isTv = user?.role === 'TV';

  if (isWaiter) {
    navigate('/waiter', { replace: true });
    return null;
  }
  if (isTv) {
    navigate('/tv', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-50 glass-card m-4 mx-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-cyan-300 tracking-tight">Poker Club</h1>
            <nav className="flex gap-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname.startsWith(tab.path)
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {clubs.length > 0 && (
              <select
                value={selectedClub?.id ?? ''}
                onChange={(e) => {
                  const c = clubs.find((x) => x.id === e.target.value);
                  setSelectedClub(c ?? null);
                }}
                className="glass-card border border-white/10 px-4 py-2 rounded-xl text-sm bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <span className="text-slate-400 text-sm">{user?.firstName} {user?.lastName}</span>
            <button onClick={logout} className="glass-btn px-4 py-2 rounded-xl text-sm">
              Выход
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
