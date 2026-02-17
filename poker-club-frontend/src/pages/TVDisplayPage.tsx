import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { liveStateApi, tournamentsApi, type LiveState } from '../api';
import { TVTimerBlock } from '../components/TVTimerBlock';

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
          let t = (await tournamentsApi.list({ clubId, status: 'RUNNING', limit: 1 })).data.tournaments?.[0];
          if (!t) t = (await tournamentsApi.list({ clubId, status: 'LATE_REG', limit: 1 })).data.tournaments?.[0];
          if (t) {
            const r = await liveStateApi.get(t.id);
            setLiveState(r.data.liveState);
          } else setLiveState(null);
        } catch {
          setLiveState(null);
        }
      } else {
        try {
          let t = (await tournamentsApi.list({ status: 'RUNNING', limit: 1 })).data.tournaments?.[0];
          if (!t) t = (await tournamentsApi.list({ status: 'LATE_REG', limit: 1 })).data.tournaments?.[0];
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
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, [tournamentId, clubId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-400 animate-pulse" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #000000 100%)' }}>
        <div className="tv-liquid-glass px-12 py-8" style={{ fontSize: 'clamp(24px, 6vmin, 96px)' }}>Загрузка...</div>
      </div>
    );
  }

  if (!liveState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #000000 100%)' }}>
        <div className="tv-liquid-glass px-12 py-8" style={{ fontSize: 'clamp(24px, 6vmin, 96px)' }}>Нет активного турнира</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen fixed inset-0 text-zinc-100 overflow-hidden p-4 md:p-6"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #000000 100%)' }}
    >
      <div className="h-full w-full">
        <TVTimerBlock liveState={liveState} onRefresh={() => {}} />
      </div>
    </div>
  );
}
