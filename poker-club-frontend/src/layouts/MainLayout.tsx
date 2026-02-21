import { useState, useEffect } from 'react';
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Закрыть мобильное меню при смене роута
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-950 to-black">
      <header className="sticky top-0 z-50 glass-card m-2 sm:m-4 mx-2 sm:mx-6 rounded-xl sm:rounded-2xl border border-amber-900/30 shadow-xl">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-amber-400 tracking-tight shrink-0">Mystery</h1>
            <nav className="hidden md:flex gap-1 shrink-0">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
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
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              {clubs.length > 0 && (
                <select
                  value={selectedClub?.id ?? ''}
                  onChange={(e) => {
                    const c = clubs.find((x) => x.id === e.target.value);
                    setSelectedClub(c ?? null);
                  }}
                  className="glass-select px-3 sm:px-4 py-2 text-sm max-w-[140px] lg:max-w-[180px]"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <span className="text-zinc-400 text-sm hidden lg:inline truncate max-w-[120px]">{user?.name}</span>
            </div>
            <button onClick={logout} className="glass-btn px-3 sm:px-4 py-2 rounded-xl text-sm">
              Выход
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl glass-card hover:bg-white/5 text-amber-400"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-amber-900/30 px-3 sm:px-6 py-4 space-y-3">
            <nav className="flex flex-col gap-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname.startsWith(tab.path)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-amber-200 hover:bg-amber-500/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {clubs.length > 0 && (
              <div>
                <label className="text-zinc-500 text-xs block mb-1">Клуб</label>
                <select
                  value={selectedClub?.id ?? ''}
                  onChange={(e) => {
                    const c = clubs.find((x) => x.id === e.target.value);
                    setSelectedClub(c ?? null);
                  }}
                  className="glass-select w-full px-4 py-2 text-sm"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-zinc-500 text-sm truncate pt-2">Пользователь: {user?.name}</p>
          </div>
        )}
      </header>

      <main className="flex-1 p-3 sm:p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
