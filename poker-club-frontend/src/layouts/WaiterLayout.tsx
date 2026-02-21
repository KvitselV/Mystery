import { Outlet } from 'react-router-dom';

export default function WaiterLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-950 to-black">
      <header className="glass-card m-2 sm:m-4 mx-2 sm:mx-6 rounded-xl sm:rounded-2xl border border-amber-900/30 px-4 sm:px-6 py-3 sm:py-4">
        <h1 className="text-base sm:text-xl font-bold text-amber-400">Режим официанта — Турниры и заказы</h1>
      </header>
      <main className="flex-1 p-3 sm:p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
