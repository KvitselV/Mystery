import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { tournamentsApi, liveStateApi, seatingApi, type Tournament, type LiveState, type TournamentTable } from '../api';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';
import { AdminTournamentPanel } from './TournamentsPage';

export default function TournamentManagePage() {
  const navigate = useNavigate();
  const { selectedClub, loading: clubLoading } = useClub();
  const { user, isAdmin, isController } = useAuth();
  const isControllerOrAdmin = isAdmin || (isController && selectedClub?.id === user?.managedClubId);

  const [live, setLive] = useState<Tournament | null>(null);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [tables, setTables] = useState<TournamentTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  /** Обновить tables и liveState (ожидаемый вызов после eliminate и т.д.) */
  const refreshTablesAndState = useCallback(async () => {
    if (!live?.id) return;
    try {
      const [lsRes, tsRes] = await Promise.all([
        liveStateApi.get(live.id),
        seatingApi.getTables(live.id),
      ]);
      setLiveState(lsRes.data.liveState);
      setTables(tsRes.data.tables || []);
    } catch {
      setLiveState(null);
      setTables([]);
    }
  }, [live?.id]);

  useEffect(() => {
    if (!clubLoading && !isControllerOrAdmin) {
      navigate('/tournaments', { replace: true });
      return;
    }
    (async () => {
      const isInitialLoad = refreshKey === 0;
      if (isInitialLoad) setLoading(true);
      try {
        const clubId = selectedClub?.id;
        const { data } = await tournamentsApi.list({ clubId, limit: 50 });
        const list = data.tournaments || [];
        const running = list.find((t) => t.status === 'RUNNING' || t.status === 'LATE_REG');
        if (running) {
          try {
            const full = await tournamentsApi.getById(running.id);
            setLive(full.data);
          } catch {
            setLive(running);
          }
          try {
            const [lsRes, tsRes] = await Promise.all([
              liveStateApi.get(running.id),
              seatingApi.getTables(running.id),
            ]);
            setLiveState(lsRes.data.liveState);
            setTables(tsRes.data.tables || []);
          } catch {
            setLiveState(null);
            setTables([]);
          }
        } else {
          setLive(null);
          setLiveState(null);
          setTables([]);
        }
      } catch {
        setLive(null);
        setLiveState(null);
        setTables([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClub?.id, refreshKey, isControllerOrAdmin, clubLoading, navigate]);

  const [socketConnected, setSocketConnected] = useState(false);

  // WebSocket: при смене рассадки в другой вкладке — сразу обновить
  useEffect(() => {
    if (!live?.id || !user) {
      setSocketConnected(false);
      return;
    }
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(socketUrl, { withCredentials: true });
    setSocketConnected(socket.connected);
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));
    socket.emit('join_tournament', live.id);
    socket.on('seating_change', () => setRefreshKey((k) => k + 1));
    return () => {
      setSocketConnected(false);
      socket.emit('leave_tournament', live.id);
      socket.disconnect();
    };
  }, [live?.id, user]);

  // Фоновое обновление: 15s при подключённом сокете, 4s при отключении (fallback)
  useEffect(() => {
    if (!live?.id) return;
    const refreshLive = async () => {
      try {
        const [lsRes, tsRes] = await Promise.all([
          liveStateApi.get(live.id),
          seatingApi.getTables(live.id),
        ]);
        setLiveState(lsRes.data.liveState);
        setTables(tsRes.data.tables || []);
      } catch {
        // игнорируем
      }
    };
    const intervalMs = socketConnected ? 15000 : 4000;
    const id = setInterval(refreshLive, intervalMs);
    return () => clearInterval(id);
  }, [live?.id, socketConnected]);

  if (!clubLoading && !isControllerOrAdmin) return null;
  if (loading) return <div className="text-amber-400 animate-pulse">Загрузка...</div>;
  if (!live) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Управление турниром</h2>
        <p className="text-zinc-400">Нет активного турнира для управления.</p>
        <button onClick={() => navigate('/tournaments')} className="glass-btn px-4 py-2 rounded-xl mt-4">
          К турнирам
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/tournaments')}
        className="glass-btn px-4 py-2 rounded-xl text-sm text-zinc-300 hover:text-amber-200"
      >
        ← Турниры и расписание
      </button>
      <AdminTournamentPanel
        tournament={live}
        liveState={liveState}
        tables={tables}
        onRefresh={refresh}
        onRefreshTables={refreshTablesAndState}
        isAdmin={isAdmin}
      />
    </div>
  );
}
