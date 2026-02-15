import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { liveStateApi, tournamentsApi, type LiveState } from '../api';
import { format } from 'date-fns';

export default function TVDisplayPage() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const clubId = searchParams.get('clubId');
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (tournamentId) {
        try {
          const r = await liveStateApi.get(tournamentId);
          setLiveState(r.data.liveState);
        } catch {
          setLiveState(null);
        }
      } else if (clubId) {
        try {
          const { data } = await tournamentsApi.list({ clubId, status: 'RUNNING', limit: 1 });
          const t = data.tournaments?.[0];
          if (t) {
            const r = await liveStateApi.get(t.id);
            setLiveState(r.data.liveState);
          } else setLiveState(null);
        } catch {
          setLiveState(null);
        }
      } else {
        try {
          const { data } = await tournamentsApi.list({ status: 'RUNNING', limit: 1 });
          const t = data.tournaments?.[0];
          if (t) {
            const r = await liveStateApi.get(t.id);
            setLiveState(r.data.liveState);
          } else setLiveState(null);
        } catch {
          setLiveState(null);
        }
      }
      setLoading(false);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [tournamentId, clubId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-4xl text-cyan-400 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (!liveState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-4xl text-slate-500">Нет активного турнира</div>
      </div>
    );
  }

  const mins = Math.floor((liveState.levelRemainingTimeSeconds || 0) / 60);
  const secs = (liveState.levelRemainingTimeSeconds || 0) % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-12">
      <div className="w-full max-w-4xl glass-card p-12 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">{liveState.tournamentName}</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-2xl">
          <div>
            <div className="text-slate-500 text-sm uppercase mb-1">Уровень</div>
            <div className="text-white font-bold">{liveState.currentLevelNumber}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm uppercase mb-1">Время уровня</div>
            <div className="text-white font-bold font-mono">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-sm uppercase mb-1">Ср. стек</div>
            <div className="text-white font-bold">{liveState.averageStack ?? 0}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm uppercase mb-1">Играет / Всего</div>
            <div className="text-white font-bold">
              {liveState.playersCount} / {liveState.entriesCount ?? liveState.playersCount}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-sm uppercase mb-1">Входов</div>
            <div className="text-white font-bold">{liveState.entriesCount ?? liveState.playersCount}</div>
          </div>
        </div>
        {liveState.isPaused && (
          <div className="mt-6 text-amber-400 text-xl font-bold">ПАУЗА</div>
        )}
        <div className="mt-8 text-slate-500 text-sm">
          Обновлено: {format(new Date(), 'HH:mm:ss')} · Управление с админ-панели
        </div>
      </div>
    </div>
  );
}
