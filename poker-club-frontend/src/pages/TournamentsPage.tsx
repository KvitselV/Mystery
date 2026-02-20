import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { tournamentsApi, liveStateApi, seatingApi, liveTournamentApi, blindStructuresApi, statisticsApi, achievementsApi, type Tournament, type LiveState, type TournamentTable, type TournamentPlayer, type TournamentPlayerBalance, type PlayerStatistics, type AchievementInstanceDto } from '../api';
import { AdminReportModal } from '../components/AdminReportModal';
import { PlayerResultsModal } from '../components/PlayerResultsModal';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, startOfMonth, startOfWeek, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TVTimerBlock } from '../components/TVTimerBlock';

interface TournamentsPageProps {
  waiter?: boolean;
}

export default function TournamentsPage({ waiter }: TournamentsPageProps) {
  const { selectedClub } = useClub();
  const { user, isAdmin, isController } = useAuth();
  const isControllerOrAdmin = isAdmin || (isController && selectedClub?.id === user?.managedClubId);
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [live, setLive] = useState<Tournament | null>(null);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [tables, setTables] = useState<TournamentTable[]>([]);
  const [scheduleMonth, setScheduleMonth] = useState(() => startOfMonth(new Date()));
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportTarget, setReportTarget] = useState<Tournament | null>(null);
  const [resultsTarget, setResultsTarget] = useState<Tournament | null>(null);

  useEffect(() => {
    (async () => {
      const isInitialLoad = refreshKey === 0;
      if (isInitialLoad) setLoading(true);
      try {
        const clubId = selectedClub?.id;
        const { data } = await tournamentsApi.list({ clubId, limit: 200 });
        const list = data.tournaments || [];

        const running = list.find((t) => t.status === 'RUNNING' || t.status === 'LATE_REG');
        if (running) {
          setLive(running);
          try {
            const ls = await liveStateApi.get(running.id);
            setLiveState(ls.data.liveState);
            const ts = await seatingApi.getTables(running.id);
            setTables(ts.data.tables || []);
          } catch {
            setLiveState(null);
            setTables([]);
          }
        } else {
          setLive(null);
          setLiveState(null);
          setTables([]);
        }

        const upcomingList = list
          .filter((t) => t.status === 'REG_OPEN' || t.status === 'ANNOUNCED')
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 3);
        setUpcoming(upcomingList);

        setAllTournaments(list);
      } catch {
        setUpcoming([]);
        setLive(null);
        setAllTournaments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClub?.id, waiter, refreshKey]);

  const [socketConnected, setSocketConnected] = useState(false);

  // WebSocket: при смене рассадки в другой вкладке — сразу обновить
  useEffect(() => {
    if (!live?.id || waiter || !user) {
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
    socket.on('timer_tick', (data: { levelRemainingTimeSeconds: number; currentLevelNumber: number; isPaused: boolean }) => {
      setLiveState((prev) => prev ? { ...prev, ...data } : null);
    });
    socket.on('level_change', () => setRefreshKey((k) => k + 1));
    socket.on('live_state_update', (data: Partial<LiveState>) => {
      setLiveState((prev) => {
        if (prev) return { ...prev, ...data };
        if (data?.tournamentId || data?.tournamentName) return data as LiveState;
        return null;
      });
    });
    return () => {
      setSocketConnected(false);
      socket.emit('leave_tournament', live.id);
      socket.disconnect();
    };
  }, [live?.id, waiter, user]);

  // Фоновое обновление каждые 15s/4s (начальные данные уже загружены в main useEffect)
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
        // игнорируем ошибки фонового обновления
      }
    };
    const intervalMs = waiter ? 15000 : socketConnected ? 15000 : 4000;
    const id = setInterval(refreshLive, intervalMs);
    return () => clearInterval(id);
  }, [live?.id, waiter, socketConnected]);

  if (loading) return <div className="text-amber-400 animate-pulse">Загрузка...</div>;

  if (waiter) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Игроки турнира — приём заказов</h2>
        {live ? (
          <WaiterPlayersList tournamentId={live.id} tournamentName={live.name} />
        ) : (
          <p className="text-zinc-400">Нет активного турнира</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        {live ? (
          <LiveTournamentBlock
            tournament={live}
            liveState={liveState}
            tables={tables}
            isAdmin={!!isControllerOrAdmin}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <UpcomingTournamentBlock tournaments={upcoming} isAdmin={!!isControllerOrAdmin} onRefresh={() => setRefreshKey((k) => k + 1)} />
        )}
      </section>

      <section>
        <ScheduleCalendar
          month={scheduleMonth}
          onMonthChange={setScheduleMonth}
          tournaments={allTournaments}
          isAdmin={!!isControllerOrAdmin}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          onReportClick={isControllerOrAdmin ? setReportTarget : undefined}
          onResultsClick={setResultsTarget}
        />
      </section>

      {reportTarget && (
        <AdminReportModal
          tournament={reportTarget}
          onClose={() => setReportTarget(null)}
          onSaved={() => { setReportTarget(null); setRefreshKey((k) => k + 1); }}
        />
      )}
      {resultsTarget && (
        <PlayerResultsModal tournament={resultsTarget} onClose={() => setResultsTarget(null)} />
      )}
    </div>
  );
}

function ScheduleCalendar({
  month,
  onMonthChange,
  tournaments,
  isAdmin,
  onRefresh,
  onReportClick,
  onResultsClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  tournaments: Tournament[];
  isAdmin: boolean;
  onRefresh: () => void;
  onReportClick?: (t: Tournament) => void;
  onResultsClick?: (t: Tournament) => void;
}) {
  const monthStart = startOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const cells: { date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push({ date: addDays(calendarStart, i) });
  }

  const getTournamentsForDate = (d: Date) =>
    tournaments.filter((t) => new Date(t.startTime).toDateString() === d.toDateString());

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {format(month, 'LLLL yyyy', { locale: ru })}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10"
            title="Предыдущий месяц"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10"
            title="Следующий месяц"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-zinc-400 text-sm font-medium">
            {d}
          </div>
        ))}
        {cells.map(({ date }) => {
          const isCurrentMonth = isSameMonth(date, month);
          const isTodayDate = isToday(date);
          const dayTournaments = getTournamentsForDate(date);
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[100px] p-2 border border-transparent rounded-lg ${
                isTodayDate ? 'border-blue-500/60 bg-blue-500/10' : ''
              } ${!isCurrentMonth ? 'opacity-50' : ''}`}
            >
              <div className={`text-sm mb-2 ${isCurrentMonth ? 'text-white' : 'text-zinc-500'}`}>
                {format(date, 'd')}
              </div>
              <div className="space-y-1">
                {dayTournaments.map((t) => (
                  <TournamentScheduleItem
                    key={t.id}
                    tournament={t}
                    isAdmin={isAdmin}
                    onRefresh={onRefresh}
                    onReportClick={onReportClick}
                    onResultsClick={onResultsClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type BlindLevel = { id: string; levelNumber?: number; smallBlind?: number; bigBlind?: number; ante?: number; durationMinutes?: number; isBreak?: boolean; breakName?: string | null };

function UpcomingTournamentBlock({ tournaments, isAdmin, onRefresh }: { tournaments: Tournament[]; isAdmin?: boolean; onRefresh?: () => void }) {
  const t = tournaments[0];
  const [reg, setReg] = useState(false);
  const [fullTournament, setFullTournament] = useState<Tournament | null>(null);
  const [blindStructureModalOpen, setBlindStructureModalOpen] = useState(false);
  const [blindLevelsForModal, setBlindLevelsForModal] = useState<BlindLevel[] | null>(null);
  const [blindStructureLoading, setBlindStructureLoading] = useState(false);

  useEffect(() => {
    if (!t?.id) return;
    tournamentsApi.getById(t.id).then((r) => setFullTournament(r.data)).catch(() => setFullTournament(null));
  }, [t?.id]);

  const displayT = fullTournament || t;

  const handleShowBlindStructure = () => {
    const levels = displayT?.blindStructure?.levels;
    if (levels?.length) {
      setBlindLevelsForModal(levels as BlindLevel[]);
      setBlindStructureModalOpen(true);
      return;
    }
    if (displayT?.blindStructureId) {
      setBlindStructureLoading(true);
      blindStructuresApi.getById(displayT.blindStructureId)
        .then((r) => {
          const loaded = r.data?.structure?.levels ?? [];
          setBlindLevelsForModal(loaded as BlindLevel[]);
          setBlindStructureModalOpen(true);
        })
        .catch(() => setBlindLevelsForModal([]))
        .finally(() => setBlindStructureLoading(false));
      return;
    }
    setBlindLevelsForModal([]);
    setBlindStructureModalOpen(true);
  };

  if (!t) return <div className="glass-card p-6"><p className="text-zinc-400">Нет предстоящих турниров</p></div>;

  const start = new Date(displayT.startTime);
  const now = new Date();
  const diffMs = Math.max(0, start.getTime() - now.getTime());
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  const diffDays = Math.floor(diffMs / 86400000);

  const { timeValue, timeUnit } = (() => {
    if (diffMs >= 86400000) {
      const n = diffDays;
      const word = n === 1 ? 'день' : n >= 2 && n <= 4 ? 'дня' : 'дней';
      return { timeValue: n, timeUnit: word };
    }
    if (diffMs >= 3600000) return { timeValue: diffH, timeUnit: 'ч' };
    if (diffMs >= 60000) return { timeValue: diffM, timeUnit: 'мин' };
    return { timeValue: 0, timeUnit: 'мин' };
  })();

  const statusConfig = displayT.status === 'REG_OPEN'
    ? { text: 'Регистрация открыта', colorClass: 'text-emerald-400', borderClass: 'border-emerald-400' }
    : displayT.status === 'LATE_REG'
      ? { text: 'Поздняя регистрация', colorClass: 'text-red-400', borderClass: 'border-red-400' }
      : { text: 'Регистрация не открыта', colorClass: 'text-zinc-400', borderClass: 'border-zinc-500' };

  const estimatedDurationMinutes = (() => {
    const levels = displayT.blindStructure?.levels;
    if (!levels?.length) return null;
    return levels
      .filter((l) => !l.isBreak)
      .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  })();
  const estimatedDurationStr = estimatedDurationMinutes != null
    ? `${Math.floor(estimatedDurationMinutes / 60)}ч ${estimatedDurationMinutes % 60}м`
    : '—';

  const [starting, setStarting] = useState(false);
  const handleRegister = async () => {
    try {
      await tournamentsApi.register(displayT.id);
      setReg(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка регистрации';
      alert(msg);
    }
  };
  const handleStart = async () => {
    if (!displayT.id || displayT.status !== 'REG_OPEN') return;
    setStarting(true);
    try {
      await tournamentsApi.updateStatus(displayT.id, 'LATE_REG');
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setStarting(false);
    }
  };
  const handleOpenReg = async () => {
    if (!displayT.id || displayT.status !== 'ANNOUNCED') return;
    setStarting(true);
    try {
      await tournamentsApi.updateStatus(displayT.id, 'REG_OPEN');
      onRefresh?.();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Предстоящий турнир</h2>
      <div className="text-amber-400">{displayT.name}</div>

      {/* Блок статуса и обратного отсчёта */}
      <div className="flex items-stretch gap-4">
        <div className={`flex shrink-0 w-20 h-20 rounded-full border-4 ${statusConfig.borderClass} bg-black/40 flex flex-col items-center justify-center`} aria-hidden>
          <span className={`font-bold text-xl leading-tight ${statusConfig.colorClass}`}>{timeValue}</span>
          <span className={`text-xs leading-tight ${statusConfig.colorClass}`}>{timeUnit}</span>
        </div>
        <div className="flex flex-col justify-center gap-0.5 min-w-0">
          <div className={`font-medium ${statusConfig.colorClass}`}>{statusConfig.text}</div>
          <div className="text-zinc-500 text-sm">Время начала: {format(start, 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
          <div className="text-zinc-500 text-sm">Расчётная длительность: {estimatedDurationStr}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><span className="text-zinc-500">Зарегистрировано:</span> {displayT.registrations?.length ?? 0}</div>
        <div><span className="text-zinc-500">Стартовый стек:</span> {displayT.startingStack}</div>
        <div>
          <span className="text-zinc-500">Блайнды:</span>{' '}
          <button
            type="button"
            onClick={handleShowBlindStructure}
            disabled={blindStructureLoading}
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2 focus:outline-none focus:ring-0 disabled:opacity-50"
          >
            {blindStructureLoading ? 'Загрузка…' : 'см. структуру'}
          </button>
        </div>
      </div>
      {blindStructureModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setBlindStructureModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="blind-structure-title">
            <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 id="blind-structure-title" className="text-xl font-bold text-amber-400">Структура блайндов</h3>
                <button type="button" onClick={() => setBlindStructureModalOpen(false)} className="text-zinc-400 hover:text-white text-2xl leading-none" aria-label="Закрыть">×</button>
              </div>
              {blindLevelsForModal?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-zinc-300">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400">
                        <th className="text-left py-2 px-2">Ур.</th>
                        <th className="text-left py-2 px-2">SB</th>
                        <th className="text-left py-2 px-2">BB</th>
                        <th className="text-left py-2 px-2">Анте</th>
                        <th className="text-left py-2 px-2">Мин</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blindLevelsForModal.map((l) => (
                        <tr key={l.id} className="border-b border-white/5">
                          <td className="py-2 px-2">{l.levelNumber}</td>
                          <td className="py-2 px-2">{l.smallBlind}</td>
                          <td className="py-2 px-2">{l.bigBlind}</td>
                          <td className="py-2 px-2">{l.ante ?? 0}</td>
                          <td className="py-2 px-2">{l.isBreak ? (l.breakName || '—') : l.durationMinutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-zinc-400">Структура блайндов не указана.</p>
              )}
              <button type="button" onClick={() => setBlindStructureModalOpen(false)} className="mt-4 glass-btn px-4 py-2 rounded-xl text-zinc-400 hover:text-white">
                Закрыть
              </button>
            </div>
          </div>,
          document.body
        )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRegister}
          disabled={reg || displayT.status === 'ANNOUNCED'}
          className="glass-btn px-6 py-2 rounded-xl"
          title={displayT.status === 'ANNOUNCED' ? 'Регистрация откроется позже' : undefined}
        >
          {reg ? 'Вы зарегистрированы' : displayT.status === 'ANNOUNCED' ? 'Регистрация ещё не открыта' : 'Зарегистрироваться'}
        </button>
        {isAdmin && displayT.status === 'REG_OPEN' && (
          <button onClick={handleStart} disabled={starting} className="glass-btn px-6 py-2 rounded-xl text-amber-400 border-amber-500/50">
            {starting ? 'Запуск...' : 'Начать турнир'}
          </button>
        )}
        {isAdmin && displayT.status === 'ANNOUNCED' && (
          <button onClick={handleOpenReg} disabled={starting} className="glass-btn px-6 py-2 rounded-xl text-emerald-400 border-emerald-500/50">
            {starting ? '...' : 'Открыть регистрацию'}
          </button>
        )}
      </div>
    </div>
  );
}

function isLateRegEndBreak(level: { isBreak?: boolean; breakType?: string | null; breakName?: string | null }): boolean {
  if (!level?.isBreak) return false;
  const bt = (level.breakType ?? '').toUpperCase();
  if (bt === 'END_LATE_REG' || bt === 'END_LATE_REG_AND_ADDON') return true;
  const name = (level.breakName ?? '').toLowerCase();
  return name.includes('поздн') || name.includes('late') || name.includes('late reg');
}

function getLateRegEndTime(tournament: Tournament): Date | null {
  const levels = tournament.blindStructure?.levels;
  if (!levels?.length) return null;
  const sorted = [...levels].sort((a, b) => (a.levelNumber ?? 0) - (b.levelNumber ?? 0));
  let totalMinutes = 0;
  for (const l of sorted) {
    if (isLateRegEndBreak(l)) {
      const start = new Date(tournament.startTime);
      start.setMinutes(start.getMinutes() + totalMinutes);
      return start;
    }
    totalMinutes += l.durationMinutes ?? 0;
  }
  return null;
}

/** Убирает суффикс с датой из названия турнира (например "Mystery Test - 21.02" → "Mystery Test") */
function tournamentNameOnly(name: string): string {
  return name.replace(/\s*-\s*\d{1,2}\.\d{1,2}(\.\d{4})?$/, '').trim();
}

function TournamentScheduleItem({
  tournament,
  isAdmin,
  onRefresh,
  onReportClick,
  onResultsClick,
}: {
  tournament: Tournament;
  isAdmin?: boolean;
  onRefresh?: () => void;
  onReportClick?: (t: Tournament) => void;
  onResultsClick?: (t: Tournament) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [blindStructureWithLevels, setBlindStructureWithLevels] = useState<{ levels?: { levelNumber?: number; isBreak?: boolean; breakType?: string; breakName?: string; durationMinutes?: number }[] } | null>(null);

  // Список турниров может не включать blindStructure.levels — догружаем при необходимости
  useEffect(() => {
    if (!tournament.blindStructureId) return;
    const levels = tournament.blindStructure?.levels;
    if (levels?.length) return; // уже есть
    blindStructuresApi.getById(tournament.blindStructureId).then(
      (r) => setBlindStructureWithLevels(r.data?.structure ?? null),
      () => {}
    );
  }, [tournament.blindStructureId, tournament.blindStructure?.levels?.length]);

  const tWithStructure: Tournament = blindStructureWithLevels
    ? { ...tournament, blindStructure: { ...tournament.blindStructure, levels: blindStructureWithLevels.levels } as Tournament['blindStructure'] }
    : tournament;
  const lateRegEnd = getLateRegEndTime(tWithStructure);
  const startTime = format(new Date(tournament.startTime), 'HH:mm');
  const lateRegTime = lateRegEnd ? format(lateRegEnd, 'HH:mm') : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="w-full text-left glass-card p-3 rounded-xl hover:border-amber-500/30 hover:bg-white/5 transition-colors border border-transparent"
      >
        <div className="text-white font-medium mb-1">{tournamentNameOnly(tournament.name)}</div>
        <div className="text-zinc-400 text-xs space-y-0.5">
          <div className="whitespace-nowrap truncate">Начало: {startTime}</div>
          <div className="whitespace-nowrap truncate">Позд. рег.: {lateRegTime ?? '—'}</div>
        </div>
      </button>
      {detailOpen &&
        createPortal(
          <TournamentDetailModal
          tournament={tournament}
          isAdmin={!!isAdmin}
          onClose={() => setDetailOpen(false)}
          onRefresh={() => { setDetailOpen(false); onRefresh?.(); }}
          onReportClick={onReportClick}
          onResultsClick={onResultsClick}
        />,
        document.body
        )}
    </>
  );
}

function TournamentDetailModal({
  tournament: initialTournament,
  isAdmin,
  onClose,
  onRefresh,
  onReportClick,
  onResultsClick,
}: {
  tournament: Tournament;
  isAdmin: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onReportClick?: (t: Tournament) => void;
  onResultsClick?: (t: Tournament) => void;
}) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState(initialTournament);
  const [reg, setReg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    tournamentsApi.getById(initialTournament.id).then((r) => setTournament(r.data)).catch(() => {});
  }, [initialTournament.id]);

  const amIRegistered = (t: Tournament) => {
    const regs = t.registrations as { player?: { user?: { id?: string } } }[] | undefined;
    if (!regs?.length || !user?.id) return false;
    return regs.some((r) => r.player?.user?.id === user.id);
  };

  const lateRegEnd = getLateRegEndTime(tournament);
  const startTimeStr = format(new Date(tournament.startTime), 'dd.MM.yyyy HH:mm');
  const lateRegStr = lateRegEnd ? format(lateRegEnd, 'HH:mm') : null;

  const handleRegister = async () => {
    if (tournament.status === 'ANNOUNCED') return;
    setLoading(true);
    try {
      await tournamentsApi.register(tournament.id);
      setReg(true);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async () => {
    setLoading(true);
    try {
      await tournamentsApi.unregister(tournament.id);
      setReg(false);
      onRefresh();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (tournament.status !== 'REG_OPEN') return;
    setStarting(true);
    try {
      await tournamentsApi.updateStatus(tournament.id, 'LATE_REG');
      onRefresh();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setStarting(false);
    }
  };

  const handleOpenReg = async () => {
    if (tournament.status !== 'ANNOUNCED') return;
    setStarting(true);
    try {
      await tournamentsApi.updateStatus(tournament.id, 'REG_OPEN');
      onRefresh();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setStarting(false);
    }
  };

  const isRegistered = reg || amIRegistered(tournament);
  const isArchived = tournament.status === 'ARCHIVED' || tournament.status === 'FINISHED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-amber-400">{tournament.name}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4 text-zinc-300">
          <div>
            <span className="text-zinc-500">Начало: </span>
            <span>{startTimeStr}</span>
          </div>
          {lateRegStr && (
            <div>
              <span className="text-zinc-500">Поздняя регистрация до: </span>
              <span>{lateRegStr}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-zinc-500">Бай-ин:</span> {tournament.buyInCost} ₽</div>
            <div><span className="text-zinc-500">Стартовый стек:</span> {tournament.startingStack}</div>
            <div><span className="text-zinc-500">Зарегистрировано:</span> {tournament.registrations?.length ?? 0}</div>
          </div>
          {tournament.blindStructure?.levels && tournament.blindStructure.levels.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Структура блайндов</h4>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400">
                      <th className="text-left py-2 px-2">Ур.</th>
                      <th className="text-left py-2 px-2">SB</th>
                      <th className="text-left py-2 px-2">BB</th>
                      <th className="text-left py-2 px-2">Анте</th>
                      <th className="text-left py-2 px-2">Мин</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.blindStructure.levels.map((l) => (
                      <tr key={l.id} className="border-b border-white/5">
                        <td className="py-2 px-2">{l.levelNumber}</td>
                        <td className="py-2 px-2">{l.smallBlind}</td>
                        <td className="py-2 px-2">{l.bigBlind}</td>
                        <td className="py-2 px-2">{l.ante ?? 0}</td>
                        <td className="py-2 px-2">{l.isBreak ? (l.breakName || '—') : l.durationMinutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          {!isArchived && tournament.status !== 'ANNOUNCED' && (
            isRegistered ? (
              <button onClick={handleUnregister} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-red-400">
                {loading ? '...' : 'Отменить регистрацию'}
              </button>
            ) : (
              <button onClick={handleRegister} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-emerald-400">
                {loading ? '...' : 'Зарегистрироваться'}
              </button>
            )
          )}
          {isAdmin && tournament.status === 'ANNOUNCED' && (
            <button onClick={handleOpenReg} disabled={starting} className="glass-btn px-4 py-2 rounded-xl text-emerald-400">
              {starting ? '...' : 'Открыть регистрацию'}
            </button>
          )}
          {isAdmin && tournament.status === 'REG_OPEN' && (
            <button onClick={handleStart} disabled={starting} className="glass-btn px-4 py-2 rounded-xl text-amber-400">
              {starting ? '...' : 'Начать турнир'}
            </button>
          )}
          {isArchived && (
            <>
              {onReportClick && (
                <button onClick={() => { onReportClick(tournament); onClose(); }} className="glass-btn px-4 py-2 rounded-xl text-zinc-400 hover:text-white">
                  Отчёт
                </button>
              )}
              {onResultsClick && (
                <button onClick={() => { onResultsClick(tournament); onClose(); }} className="glass-btn px-4 py-2 rounded-xl text-zinc-400 hover:text-white">
                  Результаты
                </button>
              )}
            </>
          )}
          <button onClick={onClose} className="glass-btn px-4 py-2 rounded-xl text-zinc-400">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveTournamentBlock({
  tournament,
  liveState,
  tables,
  isAdmin,
  onRefresh,
}: {
  tournament: Tournament;
  liveState: LiveState | null;
  tables: TournamentTable[];
  isAdmin: boolean;
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const [guestProfileModal, setGuestProfileModal] = useState<{ playerProfileId: string; playerName?: string; clubCardNumber?: string } | null>(null);
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-400">{tournament.name}</h2>
            <p className="text-zinc-400">Live</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/tournaments/manage')}
              className="glass-btn px-4 py-2 rounded-xl text-sm"
            >
              Управление турниром
            </button>
          )}
        </div>
        {liveState && (
          <TVTimerBlock liveState={liveState} onRefresh={onRefresh} embedded />
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Столы</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Table2D
              key={table.id}
              table={table}
              showAdmin={false}
              tournamentId={tournament.id}
              onGuestClick={(seat) => {
                if (seat.playerId) {
                  setGuestProfileModal({
                    playerProfileId: seat.playerId,
                    playerName: seat.playerName,
                    clubCardNumber: seat.clubCardNumber,
                  });
                }
              }}
            />
          ))}
        </div>
      </div>
      {guestProfileModal && (
        <GuestProfileModal
          playerProfileId={guestProfileModal.playerProfileId}
          playerName={guestProfileModal.playerName}
          clubCardNumber={guestProfileModal.clubCardNumber}
          onClose={() => setGuestProfileModal(null)}
          onViewProfile={(userId) => navigate(`/profile/${userId}`)}
        />
      )}
    </div>
  );
}

const DRAG_PLAYER_KEY = 'tournament/playerId';
const TOUCH_DRAG_THRESHOLD = 10;

function Table2D({
  table,
  showAdmin,
  tournamentId: _tournamentId,
  onPlayerClick,
  onGuestClick,
  onEmptySeatClick,
  onEmptySeatDrop,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
}: {
  table: TournamentTable;
  showAdmin: boolean;
  tournamentId: string;
  onPlayerClick?: (seat: { id: string; seatNumber: number; playerId?: string; playerName?: string; status?: string }) => void;
  onGuestClick?: (seat: { id: string; seatNumber: number; playerId?: string; playerName?: string; clubCardNumber?: string }) => void;
  onEmptySeatClick?: (tableId: string, seatNumber: number) => void;
  onEmptySeatDrop?: (tableId: string, seatNumber: number, playerId: string) => void;
  onTouchDragStart?: (playerId: string, playerName: string) => (e: React.TouchEvent) => void;
  onTouchDragMove?: (e: React.TouchEvent) => void;
  onTouchDragEnd?: (e: React.TouchEvent) => void;
}) {
  const seats = table.seats || [];
  const maxSeats = table.maxSeats || 9;
  const positions = generatePokerSeatPositions(maxSeats);
  const seatByNumber = Object.fromEntries(seats.map((s) => [s.seatNumber, s]));

  return (
    <div className="glass-card p-5 relative min-w-0">
      <div
        className="w-full max-w-[min(320px,100%)] mx-auto my-8 relative rounded-full border-2 border-amber-500/30 bg-zinc-800/50"
        style={{ aspectRatio: '2.44 / 1.2', minHeight: 120 }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-lg pointer-events-none">Стол {table.tableNumber}</div>

        {Array.from({ length: maxSeats }, (_, i) => i + 1).map((seatNum) => {
          const seat = seatByNumber[seatNum];
          const pos = positions[seatNum - 1];
          const isOccupied = !!(seat?.isOccupied && seat?.playerId);
          const isEliminated = seat?.status === 'ELIMINATED';
          const canClickOccupied = showAdmin && isOccupied && !isEliminated;
          const canClickEmpty = showAdmin && !isOccupied && !!onEmptySeatClick;
          const canDrop = showAdmin && !isOccupied && !!onEmptySeatDrop;
          const canClick = canClickOccupied || canClickEmpty;
          const canClickGuest = !showAdmin && isOccupied && !isEliminated && !!onGuestClick;
          const canDragOccupied = showAdmin && isOccupied && !isEliminated && !!onEmptySeatDrop;
          // Для гостей показываем только занятые места; пустые боксы скрыты
          if (!showAdmin && !isOccupied) return null;
          return (
            <React.Fragment key={seat?.id ?? `empty-${seatNum}`}>
              <div
                onClick={() => {
                  if (canClickGuest && isOccupied && seat) {
                    onGuestClick?.({ id: seat.id, seatNumber: seatNum, playerId: seat.playerId, playerName: seat.playerName, clubCardNumber: seat.clubCardNumber });
                    return;
                  }
                  if (!canClick) return;
                  if (isOccupied && seat) onPlayerClick?.(seat);
                  else onEmptySeatClick?.(table.id, seatNum);
                }}
                draggable={canDragOccupied}
                onDragStart={canDragOccupied && seat?.playerId ? (e) => {
                  e.dataTransfer.setData(DRAG_PLAYER_KEY, seat.playerId!);
                  e.dataTransfer.effectAllowed = 'move';
                } : undefined}
                onDragOver={canDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } : undefined}
                onDrop={canDrop ? (e) => {
                  e.preventDefault();
                  const playerId = e.dataTransfer.getData(DRAG_PLAYER_KEY);
                  if (playerId) onEmptySeatDrop?.(table.id, seatNum, playerId);
                } : undefined}
                {...(canDrop && { 'data-droptarget': true, 'data-table-id': table.id, 'data-seat-number': seatNum })}
                {...(canDragOccupied && seat?.playerId && onTouchDragStart && onTouchDragMove && onTouchDragEnd && {
                  onTouchStart: onTouchDragStart(seat.playerId, seat.playerName || 'Игрок'),
                  onTouchMove: onTouchDragMove,
                  onTouchEnd: onTouchDragEnd,
                })}
                className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden flex flex-col items-center justify-center text-xs shrink-0 p-0 box-border ${canClick || canDrop || canClickGuest ? 'cursor-pointer hover:border-2 hover:border-amber-400' : ''} ${canDragOccupied ? 'cursor-grab active:cursor-grabbing' : ''} ${(canDragOccupied || canDrop) ? 'touch-none' : ''} ${isOccupied ? 'glass-card border-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'border border-dashed border-zinc-500/50 bg-zinc-800/30 hover:bg-zinc-700/40'}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, padding: 0, borderRadius: '50%' }}
              >
                {isOccupied ? (
                  <>
                    {seat.avatarUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={seat.avatarUrl} alt="" className="w-full h-full rounded-full object-cover shrink-0" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ borderRadius: '50%' }}>
                        <span className="text-amber-300 font-medium truncate max-w-full px-1 text-[11px] leading-none">
                          {showAdmin ? `(${seatNum})` : ''}{seat.clubCardNumber || seat.playerName || 'Гость'}
                        </span>
                      </div>
                    )}
                    {isEliminated && <span className="absolute -top-0.5 -right-0.5 text-red-400 text-[9px]">✕</span>}
                  </>
                ) : (
                  <span className={`flex flex-col items-center leading-tight ${canClickEmpty ? 'text-amber-500/70' : 'text-zinc-500'}`}>
                    <span className="text-base">+</span>
                    <span className="text-[11px] opacity-80">{seatNum}</span>
                  </span>
                )}
              </div>
              {isOccupied && seat.avatarUrl && (
                <span
                  className="absolute -translate-x-1/2 text-center text-amber-300 font-semibold truncate max-w-full text-[11px] leading-none rounded-full px-1 py-0.5 glass-card border border-amber-400/40 shadow-[0_0_6px_rgba(251,191,36,0.25)]"
                  style={{
                    left: `${pos.x}%`,
                    top: `calc(${pos.y}% + 8px + 2px)`,
                    textShadow:
                      '0 0 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1)',
                  }}
                >
                  {showAdmin ? `(${seatNum}) ` : ''}{seat.clubCardNumber || seat.playerName || 'Гость'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function PlayerActionsModal({
  seat,
  tournamentId,
  tournament,
  liveState,
  rebuyCount: rebuyCountProp = 0,
  onClose,
  onDone,
}: {
  seat: { id: string; playerId?: string; playerName?: string };
  tournamentId: string;
  tournament?: { buyInCost?: number; addonChips?: number; addonCost?: number; rebuyChips?: number; rebuyCost?: number; maxRebuys?: number; status?: string };
  liveState?: { currentLevel?: { isBreak?: boolean; breakType?: string | null } | null } | null;
  rebuyCount?: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rebuyCountFetched, setRebuyCountFetched] = useState<number | null>(null);
  useEffect(() => {
    if (!seat.playerId) return;
    liveTournamentApi.getPlayerBalances(tournamentId)
      .then((r) => {
        const b = r.data.balances?.find((x) => x.playerId === seat.playerId);
        setRebuyCountFetched(b?.rebuyCount ?? 0);
      })
      .catch(() => setRebuyCountFetched(0));
  }, [tournamentId, seat.playerId]);

  const rebuyCost = tournament?.rebuyCost ?? tournament?.buyInCost ?? 0;
  const rebuyChips = tournament?.rebuyChips ?? 0;
  const maxRebuys = tournament?.maxRebuys ?? 0;
  const rebuyCount = rebuyCountFetched !== null ? rebuyCountFetched : rebuyCountProp;
  const isLateReg = tournament?.status === 'LATE_REG';
  const canRebuy = isLateReg && (maxRebuys === 0 || rebuyCount < maxRebuys);
  const addonChips = tournament?.addonChips ?? 0;
  const addonCost = tournament?.addonCost ?? tournament?.buyInCost ?? 0;
  const isAddonBreak =
    liveState?.currentLevel?.isBreak &&
    (liveState?.currentLevel?.breakType === 'ADDON' || liveState?.currentLevel?.breakType === 'END_LATE_REG_AND_ADDON');

  const [loading, setLoading] = useState(false);
  const playerId = seat.playerId!;

  const rebuy = async () => {
    setLoading(true);
    try {
      await liveTournamentApi.rebuy(tournamentId, playerId, rebuyCost || undefined);
      onDone();
    } catch {}
    setLoading(false);
  };
  const addon = async () => {
    if (addonCost < 0) return;
    setLoading(true);
    try {
      await liveTournamentApi.addon(tournamentId, playerId, addonCost);
      onDone();
    } catch {}
    setLoading(false);
  };
  const eliminate = async () => {
    setLoading(true);
    try {
      await liveTournamentApi.eliminate(tournamentId, playerId);
      onDone();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{seat.playerName || 'Игрок'}</h3>
        <div className="space-y-3">
          {canRebuy && (
            <button onClick={rebuy} disabled={loading} className="w-full glass-btn py-2 rounded-xl">
              Ребай {(rebuyCost > 0 || rebuyChips > 0) && ` (${rebuyCost} ₽, +${rebuyChips} ф.)`}
            </button>
          )}
          {isAddonBreak && (
            <button onClick={addon} disabled={loading} className="w-full glass-btn py-2 rounded-xl">
              Аддон {(addonCost > 0 || addonChips > 0) && ` (${addonCost} ₽, +${addonChips} ф.)`}
            </button>
          )}
          <button onClick={eliminate} disabled={loading} className="w-full glass-btn py-2 rounded-xl text-red-400">
            Вылетел
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full text-zinc-400 hover:text-white">Закрыть</button>
      </div>
    </div>
  );
}

function PaymentModalFull({
  tournamentId,
  player,
  onClose,
  onDone,
}: {
  tournamentId: string;
  player: TournamentPlayerBalance;
  onClose: () => void;
  onDone: () => void;
}) {
  const amount = player.balance;
  const rubles = amount >= 100 ? amount / 100 : amount;
  const rublesStr = Number.isInteger(rubles) ? String(Math.round(rubles)) : rubles.toFixed(2);

  const [loading, setLoading] = useState(false);
  const [split, setSplit] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'noncash'>('cash');
  const [cashRubles, setCashRubles] = useState(rublesStr);
  const [nonCashRubles, setNonCashRubles] = useState('');

  useEffect(() => {
    const amt = player.balance;
    const r = amt >= 100 ? amt / 100 : amt;
    const str = Number.isInteger(r) ? String(Math.round(r)) : r.toFixed(2);
    setCashRubles(str);
    setNonCashRubles('');
  }, [player.playerId, player.balance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = split ? parseFloat(cashRubles) || 0 : (payMethod === 'cash' ? parseFloat(cashRubles) || parseFloat(nonCashRubles) || 0 : 0);
    const nonCash = split ? parseFloat(nonCashRubles) || 0 : (payMethod === 'noncash' ? parseFloat(nonCashRubles) || parseFloat(cashRubles) || 0 : 0);
    const total = cash + nonCash;
    if (total <= 0) {
      alert('Введите сумму оплаты');
      return;
    }
    setLoading(true);
    try {
      await liveTournamentApi.recordPayment(tournamentId, player.playerId, cash, nonCash);
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">Оплата</h3>
        <p className="text-zinc-400">{player.playerName}</p>
        <p className="text-amber-400 text-xl font-bold">К оплате: {rubles} ₽</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-center gap-3 text-zinc-300 cursor-pointer hover:text-amber-200/90 transition-colors">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} className="glass-checkbox shrink-0" />
            Разделить оплату (нал + безнал)
          </label>
          {split ? (
            <div className="space-y-2">
              <label className="block text-zinc-400 text-sm">Наличные (₽)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={cashRubles}
                onChange={(e) => setCashRubles(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-amber-900/30 text-white"
                placeholder="0"
              />
              <label className="block text-zinc-400 text-sm">Безнал (₽)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={nonCashRubles}
                onChange={(e) => setNonCashRubles(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-amber-900/30 text-white"
                placeholder="0"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-zinc-400 text-sm">Сумма (₽)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={payMethod === 'cash' ? cashRubles : nonCashRubles}
                onChange={(e) => {
                  const v = e.target.value;
                  if (payMethod === 'cash') {
                    setCashRubles(v);
                    setNonCashRubles('');
                  } else {
                    setNonCashRubles(v);
                    setCashRubles('');
                  }
                }}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-amber-900/30 text-white"
                placeholder={String(rubles)}
              />
              <div className="flex gap-6">
                <label className="flex items-center gap-3 text-zinc-400 text-sm cursor-pointer hover:text-amber-200/90 transition-colors">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={payMethod === 'cash'}
                    onChange={() => { setPayMethod('cash'); setCashRubles(nonCashRubles || String(rubles)); setNonCashRubles(''); }}
                    className="glass-radio shrink-0"
                  />
                  Наличные
                </label>
                <label className="flex items-center gap-3 text-zinc-400 text-sm cursor-pointer hover:text-amber-200/90 transition-colors">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={payMethod === 'noncash'}
                    onChange={() => { setPayMethod('noncash'); setNonCashRubles(cashRubles || String(rubles)); setCashRubles(''); }}
                    className="glass-radio shrink-0"
                  />
                  Безнал
                </label>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 glass-btn py-2 rounded-xl">
              {loading ? '...' : 'Оплатить'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type NeedInputMove = { tableId: string; tableNumber: number; countToMove: number; players: { playerId: string; playerName: string; seatNumber: number }[] };

function AutoSeatModal({
  needInput,
  onConfirm,
  onCancel,
}: {
  needInput: { moves: NeedInputMove[] };
  onConfirm: (moves: { tableId: string; utgSeatNumber?: number; playerIds?: string[] }[]) => void;
  onCancel: () => void;
}) {
  const [modeByTable, setModeByTable] = useState<Record<string, 'utg' | 'volunteer'>>({});
  const [utgByTable, setUtgByTable] = useState<Record<string, number>>({});
  const [selectedByTable, setSelectedByTable] = useState<Record<string, Set<string>>>({});

  const buildMoves = () => {
    return needInput.moves.map((m) => {
      if (modeByTable[m.tableId] === 'volunteer') {
        const sel = selectedByTable[m.tableId];
        const ids = (sel ? Array.from(sel) : []).slice(0, m.countToMove);
        return { tableId: m.tableId, playerIds: ids };
      }
      const utg = utgByTable[m.tableId];
      return { tableId: m.tableId, utgSeatNumber: utg };
    });
  };

  const canSubmit = needInput.moves.every((m) => {
    if (modeByTable[m.tableId] === 'volunteer') {
      const sel = selectedByTable[m.tableId];
      return sel && sel.size >= m.countToMove;
    }
    const utg = utgByTable[m.tableId];
    return utg != null && utg >= 1 && m.players.some((p) => p.seatNumber === utg);
  });

  const toggleVolunteer = (tableId: string, playerId: string, countToMove: number) => {
    setSelectedByTable((prev) => {
      const next = { ...prev };
      const set = new Set(next[tableId] ?? []);
      if (set.has(playerId)) {
        set.delete(playerId);
      } else if (set.size < countToMove) {
        set.add(playerId);
      }
      next[tableId] = set;
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="glass-card max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-400">Авторассадка: выбрать игроков для пересадки</h3>
        <p className="text-zinc-400 text-sm">Нужно пересадить игроков для равномерного распределения. Укажите UTG-бокс или отметьте добровольцев.</p>
        {needInput.moves.map((m) => (
          <div key={m.tableId} className="border border-zinc-600 rounded-xl p-4 space-y-3">
            <div className="font-medium text-white">Стол {m.tableNumber} — пересадить {m.countToMove} чел.</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={(modeByTable[m.tableId] ?? 'utg') === 'utg'}
                  onChange={() => setModeByTable((p) => ({ ...p, [m.tableId]: 'utg' }))}
                />
                <span className="text-zinc-300">UTG-бокс:</span>
              </label>
              <input
                type="number"
                min={1}
                max={9}
                placeholder="№"
                className="w-16 bg-zinc-800 rounded px-2 py-1 text-white"
                value={utgByTable[m.tableId] ?? ''}
                onChange={(e) => setUtgByTable((p) => ({ ...p, [m.tableId]: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`vol-${m.tableId}`}
                checked={modeByTable[m.tableId] === 'volunteer'}
                onChange={() => setModeByTable((p) => ({ ...p, [m.tableId]: 'volunteer' }))}
              />
              <label htmlFor={`vol-${m.tableId}`} className="text-zinc-300 cursor-pointer">Добровольцы (отметьте {m.countToMove}):</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {m.players.map((p) => (
                <label key={p.playerId} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={(selectedByTable[m.tableId] ?? new Set()).has(p.playerId)}
                    onChange={() => toggleVolunteer(m.tableId, p.playerId, m.countToMove)}
                    disabled={modeByTable[m.tableId] !== 'volunteer'}
                  />
                  <span className="text-zinc-200">{p.playerName} ({p.seatNumber})</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="glass-btn px-4 py-2 rounded-xl text-sm text-zinc-400">Отмена</button>
          <button
            onClick={() => canSubmit && onConfirm(buildMoves())}
            disabled={!canSubmit}
            className="glass-btn px-4 py-2 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
          >
            Выполнить
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestProfileModal({
  playerProfileId,
  playerName,
  clubCardNumber,
  onClose,
  onViewProfile,
}: {
  playerProfileId: string;
  playerName?: string;
  clubCardNumber?: string;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStatistics & { user?: { id: string; name: string; clubCardNumber: string; avatarUrl?: string | null; createdAt: string } } | null>(null);
  const [achievements, setAchievements] = useState<AchievementInstanceDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, achievementsRes] = await Promise.all([
          statisticsApi.getByPlayerProfileId(playerProfileId),
          achievementsApi.getByPlayerProfileId(playerProfileId),
        ]);
        setStats(statsRes.data);
        setAchievements(achievementsRes.data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err.response?.data?.error ?? 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [playerProfileId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div className="glass-card p-8 rounded-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div className="glass-card p-8 rounded-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-red-400 text-center">{error}</div>
          <button onClick={onClose} className="mt-4 glass-btn px-4 py-2 rounded-xl text-sm w-full">Закрыть</button>
        </div>
      </div>
    );
  }

  const displayName = playerName || stats?.user?.name || 'Игрок';
  const displayCardNumber = clubCardNumber || stats?.user?.clubCardNumber || '';
  const registrationDate = stats?.user?.createdAt ? format(new Date(stats.user.createdAt), 'dd.MM.yyyy', { locale: ru }) : '—';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {stats?.user?.avatarUrl && (
              <img src={stats.user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-amber-400">{displayName}</h2>
              {displayCardNumber && <p className="text-zinc-400 text-sm">Карта: {displayCardNumber}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <div className="text-zinc-400 text-sm mb-1">Всего турниров</div>
              <div className="text-2xl font-bold text-amber-400">{stats?.tournamentsPlayed ?? 0}</div>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <div className="text-zinc-400 text-sm mb-1">Дата регистрации</div>
              <div className="text-lg font-semibold text-white">{registrationDate}</div>
            </div>
          </div>

          {/* Статистика */}
          {stats && stats.tournamentsPlayed > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Статистика</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass-card p-3 rounded-xl">
                  <div className="text-zinc-400 text-xs mb-1">Побед</div>
                  <div className="text-xl font-bold text-amber-400">{stats.finishes.first}</div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <div className="text-zinc-400 text-xs mb-1">2-е место</div>
                  <div className="text-xl font-bold text-amber-400">{stats.finishes.second}</div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <div className="text-zinc-400 text-xs mb-1">3-е место</div>
                  <div className="text-xl font-bold text-amber-400">{stats.finishes.third}</div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <div className="text-zinc-400 text-xs mb-1">Среднее место</div>
                  <div className="text-xl font-bold text-amber-400">{stats.averageFinish.toFixed(1)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Последние 7 турниров */}
          {stats && stats.last7Performances && stats.last7Performances.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Последние 7 турниров</h3>
              <div className="space-y-2">
                {stats.last7Performances.map((perf, idx) => (
                  <div key={idx} className="glass-card p-3 rounded-xl flex items-center justify-between">
                    <div className="text-sm text-zinc-300">{format(new Date(perf.date), 'dd.MM.yyyy', { locale: ru })}</div>
                    <div className="text-sm font-semibold text-amber-400">
                      {perf.place} из {perf.totalPlayers}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Достижения */}
          {achievements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Достижения ({achievements.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {achievements.map((ach) => (
                  <div key={ach.id} className="glass-card p-3 rounded-xl flex items-center gap-2">
                    {ach.achievementType.iconUrl && (
                      <img src={ach.achievementType.iconUrl} alt="" className="w-8 h-8 rounded" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-amber-400 truncate">{ach.achievementType.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{ach.achievementType.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка перейти в профиль */}
          {stats?.user?.id && (
            <div className="pt-4 border-t border-zinc-700">
              <button
                onClick={() => {
                  onViewProfile(stats.user!.id);
                  onClose();
                }}
                className="glass-btn px-6 py-3 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 w-full font-semibold"
              >
                Перейти в профиль
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Позиции по окружности: 1-й бокс на 60°, последний на -240°, остальные равномерно между ними.
 * (0° = справа, углы по часовой стрелке; зазор сверху — место дилера)
 */
function generatePokerSeatPositions(n: number): { x: number; y: number }[] {
  const cx = 50;
  const cy = 50;
  const r = 54;
  const startDeg = 60;
  const endDeg = -240;
  const arcDeg = startDeg - endDeg; // 300°
  const step = n > 1 ? arcDeg / (n - 1) : 0;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    let deg = startDeg - i * step;
    // Для 9-местного стола чуть раздвигаем пары 2–3 и 7–8,
    // чтобы между ними было больше расстояние.
    if (n === 9) {
      if (i === 1) deg += 4; // seat 2 ближе к 1
      if (i === 2) deg -= 4; // seat 3 ближе к 4
      if (i === 6) deg += 4; // seat 7 ближе к 6
      if (i === 7) deg -= 4; // seat 8 ближе к 9
    }
    const a = (deg * Math.PI) / 180;
    out.push({
      x: cx + r * Math.cos(a),
      y: cy - r * Math.sin(a), // минус: Y вниз, переворот по вертикали
    });
  }
  return out;
}

export function AdminTournamentPanel({
  tournament,
  liveState,
  tables,
  onRefresh,
  onRefreshTables,
  onOptimisticPauseChange,
  isAdmin = false,
}: {
  tournament: Tournament;
  liveState: LiveState | null;
  tables: TournamentTable[];
  onRefresh: () => void;
  onRefreshTables?: () => Promise<void>;
  onOptimisticPauseChange?: (isPaused: boolean) => void;
  isAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [balances, setBalances] = useState<TournamentPlayerBalance[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ playerId: string; playerName: string } | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<TournamentPlayerBalance | null>(null);
  const [emptySeatTarget, setEmptySeatTarget] = useState<{ tableId: string; tableNumber: number; seatNumber: number } | null>(null);
  const [rebuyReturnTarget, setRebuyReturnTarget] = useState<{ playerId: string; playerName: string } | null>(null);
  const [orderTarget, setOrderTarget] = useState<{ playerId: string; playerName: string } | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [byCardModalOpen, setByCardModalOpen] = useState(false);
  const [autoSeatNeedInput, setAutoSeatNeedInput] = useState<{
    moves: { tableId: string; tableNumber: number; countToMove: number; players: { playerId: string; playerName: string; seatNumber: number }[] }[];
  } | null>(null);

  const refreshPlayers = () =>
    tournamentsApi.getPlayers(tournament.id)
      .then((r) => setPlayers(r.data.players ?? []))
      .catch(() => setPlayers([]));
  useEffect(() => {
    refreshPlayers();
  }, [tournament.id]);

  const refreshBalances = () =>
    liveTournamentApi.getPlayerBalances(tournament.id)
      .then((r) => setBalances(r.data.balances ?? []))
      .catch(() => setBalances([]));
  useEffect(() => {
    refreshBalances();
  }, [tournament.id]);

  const seatedPlayers = tables.flatMap((t) =>
    (t.seats ?? [])
      .filter((s) => s.isOccupied && s.playerId && s.status !== 'ELIMINATED')
      .map((s) => ({ playerId: s.playerId!, playerName: s.playerName || 'Игрок', clubCardNumber: s.clubCardNumber }))
  );
  const uniqueSeated = Array.from(new Map(seatedPlayers.map((p) => [p.playerId, p])).values());
  const seatedPlayerIds = new Set(uniqueSeated.map((p) => p.playerId));
  const playersNotSeated = players.filter((p) => !seatedPlayerIds.has(p.playerId ?? ''));
  const activeUnseated = playersNotSeated.filter((p) => p.isActive !== false);
  const eliminatedPlayers = playersNotSeated.filter((p) => p.isActive === false);
  const seatableUnseated = activeUnseated.filter(
    (p) => p.playerId && p.isArrived !== false
  );
  const isAddonBreak =
    liveState?.currentLevel?.isBreak &&
    (liveState?.currentLevel?.breakType === 'ADDON' || liveState?.currentLevel?.breakType === 'END_LATE_REG_AND_ADDON');

  const doAction = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
      onRefresh();
      await Promise.all([
        refreshBalances(),
        refreshPlayers(),
        onRefreshTables?.(),
      ]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSeating = async (moves?: { tableId: string; utgSeatNumber?: number; playerIds?: string[] }[]) => {
    setLoading(true);
    setAutoSeatNeedInput(null);
    try {
      await seatingApi.autoSeating(tournament.id, moves ? { moves } : undefined);
      onRefresh();
      refreshBalances();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { needInput?: { moves: { tableId: string; tableNumber: number; countToMove: number; players: { playerId: string; playerName: string; seatNumber: number }[] }[] }; error?: string } } };
      if (err.response?.status === 409 && err.response?.data?.needInput) {
        setAutoSeatNeedInput(err.response.data.needInput);
        return;
      }
      const msg = err.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setLoading(false);
    }
    refreshPlayers();
  };

  const handleSeatClick = (seat: { playerId?: string; playerName?: string }) => {
    if (seat.playerId && seat.playerName) setSelectedPlayer({ playerId: seat.playerId, playerName: seat.playerName });
  };

  const handleEmptySeatClick = (tableId: string, seatNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    setEmptySeatTarget(table ? { tableId, tableNumber: table.tableNumber, seatNumber } : null);
  };

  const handleSeatOrMovePlayer = async (playerId: string, target: { tableId: string; seatNumber: number }) => {
    await doAction(() =>
      seatingApi.manualSeating(tournament.id, { playerId, newTableId: target.tableId, newSeatNumber: target.seatNumber })
    );
    setEmptySeatTarget(null);
  };

  const handleReturnEliminated = async (playerId: string, tableId: string, seatNumber: number) => {
    await doAction(() =>
      liveTournamentApi.returnEliminated(tournament.id, playerId, tableId, seatNumber)
    );
    setRebuyReturnTarget(null);
  };

  const handleMovePlayer = (playerId: string) => {
    if (!emptySeatTarget) return;
    handleSeatOrMovePlayer(playerId, { tableId: emptySeatTarget.tableId, seatNumber: emptySeatTarget.seatNumber });
  };

  const touchDragRef = useRef<{ playerId: string; playerName: string; startX: number; startY: number; isDragging: boolean } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; playerName: string } | null>(null);
  const setPreviewRef = useRef(setDragPreview);
  setPreviewRef.current = setDragPreview;

  const touchDragStart = useCallback((playerId: string, playerName: string) => (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const t = e.touches[0];
    touchDragRef.current = { playerId, playerName, startX: t.clientX, startY: t.clientY, isDragging: false };

    const onMove = (ev: TouchEvent) => {
      if (!touchDragRef.current || ev.touches.length === 0) return;
      const dx = ev.touches[0].clientX - touchDragRef.current.startX;
      const dy = ev.touches[0].clientY - touchDragRef.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > TOUCH_DRAG_THRESHOLD) {
        touchDragRef.current.isDragging = true;
        setPreviewRef.current({ x: ev.touches[0].clientX, y: ev.touches[0].clientY, playerName: touchDragRef.current.playerName });
      }
      if (touchDragRef.current.isDragging) {
        setPreviewRef.current({ x: ev.touches[0].clientX, y: ev.touches[0].clientY, playerName: touchDragRef.current.playerName });
        ev.preventDefault();
      }
    };
    const cleanup = () => {
      document.removeEventListener('touchmove', onMove as any, { passive: false } as any);
      document.removeEventListener('touchend', onEnd as any, { passive: false } as any);
      document.removeEventListener('touchcancel', onEnd as any, { passive: false } as any);
      setPreviewRef.current(null);
    };
    const onEnd = (ev: TouchEvent) => {
      cleanup();
      const state = touchDragRef.current;
      touchDragRef.current = null;
      if (!state || !state.isDragging) return;
      ev.preventDefault();
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = el?.closest('[data-droptarget]');
      if (dropZone) {
        const tableId = dropZone.getAttribute('data-table-id');
        const seatNum = dropZone.getAttribute('data-seat-number');
        if (tableId && seatNum) handleSeatOrMovePlayer(state.playerId, { tableId, seatNumber: parseInt(seatNum, 10) });
      }
    };
    document.addEventListener('touchmove', onMove as any, { passive: false } as any);
    document.addEventListener('touchend', onEnd as any, { passive: false } as any);
    document.addEventListener('touchcancel', onEnd as any, { passive: false } as any);
  }, [handleSeatOrMovePlayer]);

  const touchDragMove = useCallback(() => {}, []); // не используется — preventDefault через document
  const touchDragEnd = useCallback(() => {}, []); // обработка в document touchend

  return (
    <div className="glass-card p-6 space-y-6 relative">
      {dragPreview && (
        <div
          className="fixed z-[9999] pointer-events-none -translate-x-1/2"
          style={{ left: dragPreview.x, top: dragPreview.y  }}
        >
          <div className="glass-card px-4 py-2 flex items-center gap-2 border-2 border-amber-500/60 shadow-lg shadow-amber-900/30">
            <svg className="w-6 h-6 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-amber-300 font-medium text-sm whitespace-nowrap max-w-[120px] truncate">{dragPreview.playerName}</span>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-amber-400">Управление турниром</h2>
        <p className="text-zinc-400 mb-4">{tournament.name}</p>
        {liveState && (
          <>
            <TVTimerBlock liveState={liveState} onRefresh={onRefresh} embedded />
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                onClick={() => doAction(() => liveTournamentApi.prevLevel(tournament.id))}
                disabled={loading || (liveState?.currentLevelNumber ?? 1) <= 1}
                className="glass-btn p-2 rounded-xl text-sm"
                title="Предыдущий уровень"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                onClick={() => {
                  const willBePaused = !liveState?.isPaused;
                  onOptimisticPauseChange?.(willBePaused);
                  doAction(() => (liveState?.isPaused ? liveStateApi.resume(tournament.id) : liveStateApi.pause(tournament.id)));
                }}
                disabled={loading}
                className="glass-btn p-2 rounded-xl text-sm"
                title={liveState?.isPaused ? 'Возобновить' : 'Пауза'}
              >
                {liveState.isPaused ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                )}
              </button>
              <button
                onClick={() => doAction(() => liveTournamentApi.nextLevel(tournament.id))}
                disabled={loading}
                className="glass-btn p-2 rounded-xl text-sm"
                title="Следующий уровень"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleAutoSeating()} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-sm">Авторассадка</button>
        {autoSeatNeedInput && (
          <AutoSeatModal
            needInput={autoSeatNeedInput}
            onConfirm={(moves) => { setAutoSeatNeedInput(null); handleAutoSeating(moves); }}
            onCancel={() => setAutoSeatNeedInput(null)}
          />
        )}
        <button
          onClick={() => doAction(() => liveTournamentApi.finish(tournament.id))}
          disabled={loading || (!isAdmin && (liveState?.playersCount ?? 0) !== 1)}
          title={!isAdmin && (liveState?.playersCount ?? 0) !== 1 ? 'Контроллер может завершить турнир только когда остался один игрок' : undefined}
          className="glass-btn px-4 py-2 rounded-xl text-sm text-amber-500 hover:text-amber-400"
        >
          Завершить турнир
        </button>
        <button onClick={() => setGuestModalOpen(true)} className="glass-btn px-4 py-2 rounded-xl text-sm text-emerald-400 hover:text-emerald-300" title="Зарегистрировать гостя и записать на турнир">
          + Гость
        </button>
        <button onClick={() => setByCardModalOpen(true)} className="glass-btn px-4 py-2 rounded-xl text-sm text-emerald-400 hover:text-emerald-300" title="Записать по номеру клубной карты">
          + По карте
        </button>
      </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Столы</h3>
            {tables.length === 0 ? (
              <p className="text-zinc-400 text-sm">Нет столов. Нажмите «Авторассадка» для рассадки игроков.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <Table2D
                    key={table.id}
                    table={table}
                    showAdmin={true}
                    tournamentId={tournament.id}
                    onPlayerClick={handleSeatClick}
                    onEmptySeatClick={handleEmptySeatClick}
                    onEmptySeatDrop={(tableId, seatNumber, playerId) => handleSeatOrMovePlayer(playerId, { tableId, seatNumber })}
                    onTouchDragStart={touchDragStart}
                    onTouchDragMove={touchDragMove}
                    onTouchDragEnd={touchDragEnd}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Игроки (без стола)</h3>
            <p className="text-zinc-500 text-sm mb-2">Только те, кто ещё не рассажен. Серые — ожидают прихода в клуб.</p>
            <p className="text-zinc-500 text-xs mb-1">Перетащите карточку на плюс стола, чтобы посадить.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {activeUnseated.map((p) => {
                const bal = balances.find((b) => b.playerId === (p.playerId ?? p.id));
                const amount = bal?.balance ?? 0;
                const rubles = amount >= 100 ? (amount / 100).toFixed(0) : String(amount);
                const arrived = p.isArrived !== false;
                const canDrag = !!(p.playerId && p.isActive !== false && arrived);
                return (
                  <div
                    key={p.id}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => {
                      e.dataTransfer.setData(DRAG_PLAYER_KEY, p.playerId!);
                      e.dataTransfer.effectAllowed = 'move';
                    } : undefined}
                    onTouchStart={canDrag ? touchDragStart(p.playerId!, p.playerName) : undefined}
                    onTouchMove={canDrag ? touchDragMove : undefined}
                    onTouchEnd={canDrag ? touchDragEnd : undefined}
                    className={`glass-card p-3 flex flex-col gap-2 ${!arrived ? 'opacity-70 bg-zinc-800/50' : ''} ${canDrag ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${arrived ? 'text-amber-300' : 'text-zinc-400'}`}>
                          {p.playerName ? `${p.playerName}${p.clubCardNumber ? ` (${p.clubCardNumber})` : ''}` : (p.clubCardNumber || 'Игрок')}
                        </span>
                        {((bal?.rebuyCount ?? 0) > 0 || (bal?.addonCount ?? 0) > 0) && (
                          <span className="text-zinc-500 text-xs">
                            {(bal?.rebuyCount ?? 0) > 0 && `${bal!.rebuyCount} реб.`}
                            {(bal?.rebuyCount ?? 0) > 0 && (bal?.addonCount ?? 0) > 0 && ', '}
                            {(bal?.addonCount ?? 0) > 0 && `${bal!.addonCount} адд.`}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400 text-xs shrink-0">{rubles} ₽</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {!arrived && (
                        <button
                          onClick={() => doAction(() => tournamentsApi.markPlayerArrived(tournament.id, p.id))}
                          disabled={loading}
                          className="glass-btn px-2 py-1 rounded text-xs text-emerald-400 hover:text-emerald-300"
                          title="Игрок прибыл в клуб"
                        >
                          Прибыл
                        </button>
                      )}
                      {p.playerId && arrived && (
                        <>
                          {p.isActive && (
                            <>
                              {tournament.status === 'LATE_REG' && ((tournament.maxRebuys ?? 0) === 0 || (bal?.rebuyCount ?? 0) < (tournament.maxRebuys ?? 0)) ? (
                                <button onClick={() => doAction(() => liveTournamentApi.rebuy(tournament.id, p.playerId!))} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs">Ребай</button>
                              ) : null}
                              {isAddonBreak && (
                                <button onClick={() => p.playerId && setSelectedPlayer({ playerId: p.playerId, playerName: p.playerName })} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs">Аддон</button>
                              )}
                              <button onClick={() => p.playerId && setSelectedPlayer({ playerId: p.playerId, playerName: p.playerName })} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs text-red-400">Вылет</button>
                            </>
                          )}
                          {amount > 0 && bal && (
                            <button
                              onClick={() => setPaymentTarget(bal)}
                              disabled={loading}
                              className="glass-btn px-2 py-1 rounded text-xs text-amber-400"
                            >
                              Оплата
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {activeUnseated.length === 0 && eliminatedPlayers.length === 0 && (
              <p className="text-zinc-400 text-sm">Все игроки рассажены или нет зарегистрированных.</p>
            )}
          </div>

          {eliminatedPlayers.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-red-400/90 mb-4">Вылетевшие игроки</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {eliminatedPlayers.map((p) => {
                  const bal = balances.find((b) => b.playerId === (p.playerId ?? p.id));
                  const amount = bal?.balance ?? 0;
                  const rubles = amount >= 100 ? (amount / 100).toFixed(0) : String(amount);
                  const maxRebuys = tournament.maxRebuys ?? 0;
                  const rebuyCount = bal?.rebuyCount ?? 0;
                  const canReturn = tournament.status === 'LATE_REG' && (maxRebuys === 0 || rebuyCount < maxRebuys);
                  return (
                    <div
                      key={p.id}
                      className="glass-card p-3 flex flex-col gap-2 border border-red-500/20 bg-zinc-800/60"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-zinc-400">
                            {p.playerName ? `${p.playerName}${p.clubCardNumber ? ` (${p.clubCardNumber})` : ''}` : (p.clubCardNumber || 'Игрок')}
                          </span>
                          {((bal?.rebuyCount ?? 0) > 0 || (bal?.addonCount ?? 0) > 0) && (
                            <span className="text-zinc-500 text-xs">
                              {(bal?.rebuyCount ?? 0) > 0 && `${bal!.rebuyCount} реб.`}
                              {(bal?.rebuyCount ?? 0) > 0 && (bal?.addonCount ?? 0) > 0 && ', '}
                              {(bal?.addonCount ?? 0) > 0 && `${bal!.addonCount} адд.`}
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-400 text-xs shrink-0">{rubles} ₽</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {canReturn && p.playerId && (
                          <button
                            onClick={() => setRebuyReturnTarget({ playerId: p.playerId!, playerName: p.playerName || 'Игрок' })}
                            disabled={loading}
                            className="glass-btn px-2 py-1 rounded text-xs text-emerald-400 hover:text-emerald-300"
                            title="Вернуть в турнир (ребай + выбор стола)"
                          >
                            Ребай
                          </button>
                        )}
                        {amount > 0 && bal && (
                          <button
                            onClick={() => setPaymentTarget(bal)}
                            disabled={loading}
                            className="glass-btn px-2 py-1 rounded text-xs text-amber-400"
                          >
                            Оплата
                          </button>
                        )}
                        {p.playerId && (
                          <button
                            onClick={() => setOrderTarget({ playerId: p.playerId!, playerName: p.playerName || 'Игрок' })}
                            disabled={loading}
                            className="glass-btn px-2 py-1 rounded text-xs text-zinc-300"
                            title="Принять заказ"
                          >
                            Заказ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Игроки за столами</h3>
            {uniqueSeated.length === 0 ? (
              <p className="text-zinc-400 text-sm">Нет рассаженных игроков. Нажмите «Авторассадка» для рассадки.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {uniqueSeated.map((p) => {
                  const bal = balances.find((b) => b.playerId === p.playerId);
                  return (
                    <div key={p.playerId} className="glass-card p-3">
                      <span className="text-amber-300 text-sm font-medium block">
                        {p.playerName ? `${p.playerName}${p.clubCardNumber ? ` (${p.clubCardNumber})` : ''}` : (p.clubCardNumber || 'Игрок')}
                      </span>
                      {((bal?.rebuyCount ?? 0) > 0 || (bal?.addonCount ?? 0) > 0) && (
                        <span className="text-zinc-500 text-xs block">
                          {(bal?.rebuyCount ?? 0) > 0 && `${bal!.rebuyCount} реб.`}
                          {(bal?.rebuyCount ?? 0) > 0 && (bal?.addonCount ?? 0) > 0 && ', '}
                          {(bal?.addonCount ?? 0) > 0 && `${bal!.addonCount} адд.`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlayer && (
            <PlayerActionsModal
              seat={{ id: '', playerId: selectedPlayer.playerId, playerName: selectedPlayer.playerName }}
              tournamentId={tournament.id}
              tournament={{ buyInCost: tournament.buyInCost, addonChips: tournament.addonChips, addonCost: tournament.addonCost, rebuyChips: tournament.rebuyChips, rebuyCost: tournament.rebuyCost, maxRebuys: tournament.maxRebuys, status: tournament.status }}
              liveState={liveState}
              rebuyCount={balances.find((b) => b.playerId === selectedPlayer.playerId)?.rebuyCount ?? 0}
              onClose={() => setSelectedPlayer(null)}
              onDone={async () => {
                setSelectedPlayer(null);
                onRefresh();
                await Promise.all([refreshBalances(), refreshPlayers(), onRefreshTables?.()]);
              }}
            />
          )}

          {rebuyReturnTarget && (() => {
            const emptySlots = tables.flatMap((t) => {
              const seatByNum = Object.fromEntries((t.seats ?? []).map((s) => [s.seatNumber, s]));
              const maxSeats = t.maxSeats ?? 9;
              return Array.from({ length: maxSeats }, (_, i) => i + 1)
                .filter((sn) => !(seatByNum[sn]?.isOccupied))
                .map((sn) => ({ tableId: t.id, tableNumber: t.tableNumber, seatNumber: sn }));
            });
            return (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setRebuyReturnTarget(null)} role="dialog" aria-modal="true">
                <div className="glass-card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white">
                    Ребай — посадить {rebuyReturnTarget.playerName}
                  </h3>
                  <p className="text-zinc-400 text-sm">Выберите стол и место:</p>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {emptySlots.map(({ tableId, tableNumber, seatNumber }) => (
                      <button
                        key={`${tableId}-${seatNumber}`}
                        onClick={() => handleReturnEliminated(rebuyReturnTarget.playerId, tableId, seatNumber)}
                        disabled={loading}
                        className="w-full glass-btn py-2 rounded-xl text-left px-4 text-emerald-300/90"
                      >
                        Стол {tableNumber}, место {seatNumber}
                      </button>
                    ))}
                  </div>
                  {emptySlots.length === 0 && tables.length > 0 && (
                    <p className="text-zinc-500 text-sm">Нет свободных мест. Создайте стол или освободите место.</p>
                  )}
                  <button type="button" onClick={() => setRebuyReturnTarget(null)} className="w-full text-zinc-400 hover:text-white">
                    Отмена
                  </button>
                </div>
              </div>
            );
          })()}

          {emptySeatTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setEmptySeatTarget(null)} role="dialog" aria-modal="true">
              <div className="glass-card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white">
                  Посадить / пересадить на стол {emptySeatTarget.tableNumber}, место {emptySeatTarget.seatNumber}
                </h3>
                {(uniqueSeated.length === 0 && seatableUnseated.length === 0) ? (
                  <p className="text-zinc-400 text-sm">Нет игроков для рассадки</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-3">
                    {uniqueSeated.length > 0 && (
                      <>
                        <p className="text-zinc-500 text-xs font-medium">Пересадить с другого стола</p>
                        {uniqueSeated.map((p) => (
                          <button
                            key={p.playerId}
                            onClick={() => handleMovePlayer(p.playerId!)}
                            disabled={loading}
                            className="w-full glass-btn py-2 rounded-xl text-left px-4 text-amber-300"
                          >
                            {p.playerName}
                          </button>
                        ))}
                      </>
                    )}
                    {seatableUnseated.length > 0 && (
                      <>
                        <p className="text-zinc-500 text-xs font-medium mt-2">Посадить (не за столом)</p>
                        {seatableUnseated.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleMovePlayer(p.playerId!)}
                            disabled={loading}
                            className="w-full glass-btn py-2 rounded-xl text-left px-4 text-emerald-300/90"
                          >
                            {p.playerName}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
                <button type="button" onClick={() => setEmptySeatTarget(null)} className="w-full text-zinc-400 hover:text-white">
                  Отмена
                </button>
              </div>
            </div>
          )}

          {paymentTarget && (
            <PaymentModalFull
              tournamentId={tournament.id}
              player={paymentTarget}
              onClose={() => setPaymentTarget(null)}
              onDone={() => {
                setPaymentTarget(null);
                refreshBalances();
                onRefresh();
              }}
            />
          )}

          {orderTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setOrderTarget(null)} role="dialog" aria-modal="true">
              <div className="glass-card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Заказ — {orderTarget.playerName}</h3>
                <OrderForm
                  playerId={orderTarget.playerId}
                  tournamentId={tournament.id}
                  onClose={() => setOrderTarget(null)}
                  onOrder={() => { setOrderTarget(null); }}
                />
              </div>
            </div>
          )}

          {guestModalOpen && (
            <GuestRegistrationModal
              tournamentId={tournament.id}
              onClose={() => setGuestModalOpen(false)}
              onSuccess={() => {
                setGuestModalOpen(false);
                onRefresh();
                refreshPlayers();
                refreshBalances();
              }}
              disabled={loading}
            />
          )}

          {byCardModalOpen && (
            <RegisterByCardModal
              tournamentId={tournament.id}
              onClose={() => setByCardModalOpen(false)}
              onSuccess={() => {
                setByCardModalOpen(false);
                onRefresh();
                refreshPlayers();
                refreshBalances();
              }}
              disabled={loading}
            />
          )}
    </div>
  );
}

function GuestRegistrationModal({
  tournamentId,
  onClose,
  onSuccess,
  disabled,
}: {
  tournamentId: string;
  onClose: () => void;
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState('');
  const [clubCardNumber, setClubCardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await tournamentsApi.registerGuest(tournamentId, { name, clubCardNumber, phone, password });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка регистрации';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-400 mb-4">+ Гость — регистрация и запись на турнир</h3>
        <p className="text-zinc-400 text-sm mb-4">Создать аккаунт и сразу записать на турнир. Для новых посетителей клуба.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          <input
            type="text"
            placeholder="Номер клубной карты"
            value={clubCardNumber}
            onChange={(e) => setClubCardNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={disabled || submitting}
              className="flex-1 glass-btn py-3 rounded-xl font-medium text-emerald-400 hover:text-emerald-300"
            >
              {submitting ? 'Регистрация…' : 'Зарегистрировать и записать'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 text-zinc-400 hover:text-white">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterByCardModal({
  tournamentId,
  onClose,
  onSuccess,
  disabled,
}: {
  tournamentId: string;
  onClose: () => void;
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [clubCardNumber, setClubCardNumber] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await tournamentsApi.registerByCard(tournamentId, clubCardNumber.trim());
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-400 mb-4">+ По карте — записать на турнир</h3>
        <p className="text-zinc-400 text-sm mb-4">Введите номер клубной карты игрока, который уже есть в системе.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Номер клубной карты"
            value={clubCardNumber}
            onChange={(e) => setClubCardNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={disabled || submitting}
              className="flex-1 glass-btn py-3 rounded-xl font-medium text-emerald-400 hover:text-emerald-300"
            >
              {submitting ? 'Запись…' : 'Записать'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 text-zinc-400 hover:text-white">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WaiterPlayersList({ tournamentId }: { tournamentId: string; tournamentName: string }) {
  const [players, setPlayers] = useState<{ id: string; playerName: string }[]>([]);
  useEffect(() => {
    tournamentsApi.getPlayers(tournamentId).then((r) => {
      setPlayers(r.data.players?.map((p) => ({ id: p.id, playerName: p.playerName })) ?? []);
    });
  }, [tournamentId]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {players.map((p) => (
        <OrderCard key={p.id} playerName={p.playerName} playerId={p.id} tournamentId={tournamentId} onOrder={() => {}} />
      ))}
    </div>
  );
}

function OrderCard({ playerName, playerId, tournamentId, onOrder }: { playerName: string; playerId: string; tournamentId: string; onOrder: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card p-4">
      <button onClick={() => setOpen(!open)} className="w-full text-left text-amber-300 font-medium">
        {playerName}
      </button>
      {open && <OrderForm playerId={playerId} tournamentId={tournamentId} onClose={() => setOpen(false)} onOrder={onOrder} />}
    </div>
  );
}

function OrderForm({ onClose, onOrder }: { playerId: string; tournamentId: string; onClose: () => void; onOrder: () => void }) {
  return (
    <div className="mt-2 text-sm text-zinc-400">
      <p>Принять заказ — выбор из меню (интеграция с menu/orders API)</p>
      <button onClick={() => { onOrder(); onClose(); }} className="text-amber-400 mt-2 mr-2">Оформить</button>
      <button onClick={onClose} className="text-amber-400 mt-2">Закрыть</button>
    </div>
  );
}
