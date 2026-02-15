import { Outlet } from 'react-router-dom';

export default function WaiterLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="glass-card m-4 mx-6 rounded-2xl border border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold text-cyan-300">Режим официанта — Турниры и заказы</h1>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
