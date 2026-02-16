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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-950 to-black">
      <header className="sticky top-0 z-50 glass-card m-4 mx-6 rounded-2xl border border-amber-900/30 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-amber-400 tracking-tight">Mystery</h1>
            <nav className="flex gap-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname.startsWith(tab.path)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-amber-200 hover:bg-amber-500/5'
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
                className="glass-card border border-amber-900/30 px-4 py-2 rounded-xl text-sm bg-transparent text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <span className="text-zinc-400 text-sm">{user?.name}</span>
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
