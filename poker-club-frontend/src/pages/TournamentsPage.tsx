import { useState, useEffect } from 'react';
import { tournamentsApi, liveStateApi, seatingApi, liveTournamentApi, type Tournament, type LiveState, type TournamentTable, type TournamentPlayer } from '../api';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  const [scheduleWeek, setScheduleWeek] = useState<{ date: Date; tournaments: Tournament[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const clubId = selectedClub?.id;
        const { data } = await tournamentsApi.list({ clubId, limit: 50 });
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

        const regOpen = list.filter((t) => t.status === 'REG_OPEN').slice(0, 3);
        setUpcoming(regOpen);

        const days: { date: Date; tournaments: Tournament[] }[] = [];
        for (let i = 0; i < 7; i++) {
          const d = addDays(startOfDay(new Date()), i);
          days.push({
            date: d,
            tournaments: list.filter((t) => {
              const st = new Date(t.startTime);
              return st.toDateString() === d.toDateString();
            }),
          });
        }
        setScheduleWeek(days);
      } catch {
        setUpcoming([]);
        setLive(null);
        setScheduleWeek([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClub?.id, waiter, refreshKey]);

  if (loading) return <div className="text-cyan-400 animate-pulse">Загрузка...</div>;

  if (waiter) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Игроки турнира — приём заказов</h2>
        {live ? (
          <WaiterPlayersList tournamentId={live.id} tournamentName={live.name} />
        ) : (
          <p className="text-slate-400">Нет активного турнира</p>
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
        <h2 className="text-xl font-bold text-white mb-4">Расписание на 7 дней</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {scheduleWeek.map((day) => (
            <div key={day.date.toISOString()} className="glass-card p-4">
              <div className="text-cyan-400 font-medium mb-2">
                {format(day.date, 'EEE, d MMM', { locale: ru })}
              </div>
              <div className="space-y-2">
                {day.tournaments.length === 0 && (
                  <p className="text-slate-500 text-sm">Нет турниров</p>
                )}
                {day.tournaments.map((t) => (
                  <TournamentScheduleItem key={t.id} tournament={t} isAdmin={!!isControllerOrAdmin} onRefresh={() => setRefreshKey((k) => k + 1)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UpcomingTournamentBlock({ tournaments, isAdmin, onRefresh }: { tournaments: Tournament[]; isAdmin?: boolean; onRefresh?: () => void }) {
  const t = tournaments[0];
  const [reg, setReg] = useState(false);
  const [fullTournament, setFullTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!t?.id) return;
    tournamentsApi.getById(t.id).then((r) => setFullTournament(r.data)).catch(() => setFullTournament(null));
  }, [t?.id]);

  const displayT = fullTournament || t;

  if (!t) return <div className="glass-card p-6"><p className="text-slate-400">Нет предстоящих турниров</p></div>;

  const start = new Date(displayT.startTime);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);

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
      await tournamentsApi.updateStatus(displayT.id, 'RUNNING');
      onRefresh?.();
      window.location.reload();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Предстоящий турнир</h2>
      <div className="text-cyan-400">{displayT.name}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><span className="text-slate-500">До начала:</span> {diffH}ч {diffM}м</div>
        <div><span className="text-slate-500">Зарегистрировано:</span> {displayT.registrations?.length ?? 0}</div>
        <div><span className="text-slate-500">Стартовый стек:</span> {displayT.startingStack}</div>
        <div><span className="text-slate-500">Блайнды:</span> см. структуру</div>
      </div>
      {displayT.blindStructure?.levels && (
        <div>
          <h3 className="text-white font-medium mb-2">Структура блайндов</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr><th className="text-left">Ур.</th><th className="text-left">SB</th><th className="text-left">BB</th><th className="text-left">Анте</th><th className="text-left">Мин</th></tr>
              </thead>
              <tbody>
                {displayT.blindStructure!.levels!.map((l) => (
                  <tr key={l.id}><td>{l.levelNumber}</td><td>{l.smallBlind}</td><td>{l.bigBlind}</td><td>{l.ante ?? 0}</td><td>{l.durationMinutes}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleRegister} disabled={reg} className="glass-btn px-6 py-2 rounded-xl">
          {reg ? 'Вы зарегистрированы' : 'Зарегистрироваться'}
        </button>
        {isAdmin && displayT.status === 'REG_OPEN' && (
          <button onClick={handleStart} disabled={starting} className="glass-btn px-6 py-2 rounded-xl text-cyan-400 border-cyan-500/50">
            {starting ? 'Запуск...' : 'Начать турнир'}
          </button>
        )}
      </div>
    </div>
  );
}

function TournamentScheduleItem({ tournament, isAdmin, onRefresh }: { tournament: Tournament; isAdmin?: boolean; onRefresh?: () => void }) {
  const [starting, setStarting] = useState(false);
  const handleStart = async () => {
    if (tournament.status !== 'REG_OPEN') return;
    setStarting(true);
    try {
      await tournamentsApi.updateStatus(tournament.id, 'RUNNING');
      onRefresh?.();
      window.location.reload();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setStarting(false);
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-slate-300 group">
      <span>{tournament.name} — {format(new Date(tournament.startTime), 'HH:mm')}</span>
      {isAdmin && tournament.status === 'REG_OPEN' && (
        <button onClick={handleStart} disabled={starting} className="shrink-0 glass-btn px-2 py-1 rounded-lg text-xs text-cyan-400">
          {starting ? '...' : 'Начать'}
        </button>
      )}
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
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">{tournament.name}</h2>
            <p className="text-slate-400">Live</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdminModal(true)} className="glass-btn px-4 py-2 rounded-xl text-sm">
              Управление турниром
            </button>
          )}
        </div>
        {liveState && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-slate-300">
            <div><span className="text-slate-500">Уровень:</span> {liveState.currentLevelNumber}</div>
            <div><span className="text-slate-500">Время уровня:</span> {Math.floor((liveState.levelRemainingTimeSeconds || 0) / 60)} мин</div>
            <div><span className="text-slate-500">Играет:</span> {liveState.playersCount}</div>
            <div><span className="text-slate-500">Ср. стек:</span> {liveState.averageStack ?? 0}</div>
            <div><span className="text-slate-500">Входов:</span> {liveState.entriesCount ?? liveState.playersCount}</div>
          </div>
        )}
      </div>

      {isAdmin && showAdminModal && (
        <AdminTournamentModal
          tournament={tournament}
          liveState={liveState}
          tables={tables}
          onClose={() => setShowAdminModal(false)}
          onRefresh={() => { onRefresh?.(); window.location.reload(); }}
        />
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Столы</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <Table2D key={table.id} table={table} showAdmin={false} tournamentId={tournament.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Table2D({
  table,
  showAdmin,
  tournamentId,
  onPlayerClick,
  onEmptySeatClick,
}: {
  table: TournamentTable;
  showAdmin: boolean;
  tournamentId: string;
  onPlayerClick?: (seat: { id: string; seatNumber: number; playerId?: string; playerName?: string; status?: string }) => void;
  onEmptySeatClick?: (tableId: string, seatNumber: number) => void;
}) {
  const seats = table.seats || [];
  const maxSeats = table.maxSeats || 9;
  const positions = generatePokerSeatPositions(maxSeats);
  const seatByNumber = Object.fromEntries(seats.map((s) => [s.seatNumber, s]));

  return (
    <div className="glass-card p-4 relative">
      <div className="absolute top-2 left-2 text-cyan-400 font-bold">Стол {table.tableNumber}</div>
      <div
        className="w-full max-w-[200px] mx-auto my-6 relative rounded-2xl border-2 border-cyan-500/30 bg-slate-800/50"
        style={{ aspectRatio: '2.44 / 1.2' }}
      >
        {Array.from({ length: maxSeats }, (_, i) => i + 1).map((seatNum) => {
          const seat = seatByNumber[seatNum];
          const pos = positions[seatNum - 1];
          const isOccupied = seat?.isOccupied && seat?.playerId;
          const isEliminated = seat?.status === 'ELIMINATED';
          const canClickOccupied = showAdmin && isOccupied && !isEliminated;
          const canClickEmpty = showAdmin && !isOccupied && !!onEmptySeatClick;
          const canClick = canClickOccupied || canClickEmpty;
          return (
            <div
              key={seat?.id ?? `empty-${seatNum}`}
              onClick={() => {
                if (!canClick) return;
                if (isOccupied && seat) onPlayerClick?.(seat);
                else onEmptySeatClick?.(table.id, seatNum);
              }}
              className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded flex items-center justify-center text-xs ${canClick ? 'cursor-pointer hover:border-2 hover:border-cyan-400' : ''} ${isOccupied ? 'glass-card border border-cyan-500/40' : 'border border-dashed border-slate-500/50 bg-slate-800/30 hover:bg-slate-700/40'}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {isOccupied ? (
                <>
                  <span className="text-cyan-300 font-medium truncate max-w-full px-1 text-[10px] leading-tight">
                    {seat.playerName || 'Гость'}
                  </span>
                  {isEliminated && <span className="absolute -top-0.5 -right-0.5 text-red-400 text-[8px]">✕</span>}
                </>
              ) : (
                <span className={canClickEmpty ? 'text-cyan-500/70 text-lg' : 'text-slate-500 text-lg'}>+</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerActionsModal({
  seat,
  tournamentId,
  onClose,
  onDone,
}: {
  seat: { id: string; playerId?: string; playerName?: string };
  tournamentId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [finishPosition, setFinishPosition] = useState('');
  const [addonAmount, setAddonAmount] = useState('');
  const playerId = seat.playerId!;

  const rebuy = async () => {
    setLoading(true);
    try {
      await liveTournamentApi.rebuy(tournamentId, playerId);
      onDone();
    } catch {}
    setLoading(false);
  };
  const addon = async () => {
    const amt = parseInt(addonAmount, 10);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    try {
      await liveTournamentApi.addon(tournamentId, playerId, amt);
      onDone();
    } catch {}
    setLoading(false);
  };
  const eliminate = async () => {
    const pos = parseInt(finishPosition, 10);
    if (isNaN(pos) || pos < 1) return;
    setLoading(true);
    try {
      await liveTournamentApi.eliminate(tournamentId, playerId, pos);
      onDone();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{seat.playerName || 'Игрок'}</h3>
        <div className="space-y-3">
          <button onClick={rebuy} disabled={loading} className="w-full glass-btn py-2 rounded-xl">Ребай</button>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Сумма аддона"
              value={addonAmount}
              onChange={(e) => setAddonAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
            <button onClick={addon} disabled={loading} className="glass-btn px-4 py-2 rounded-xl">Аддон</button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Место вылета"
              value={finishPosition}
              onChange={(e) => setFinishPosition(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
            <button onClick={eliminate} disabled={loading} className="glass-btn px-4 py-2 rounded-xl">Вылетел</button>
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full text-slate-400 hover:text-white">Закрыть</button>
      </div>
    </div>
  );
}

function generatePokerSeatPositions(n: number): { x: number; y: number }[] {
  const r = 42;
  const cx = 50;
  const cy = 50;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
}

function AdminTournamentModal({
  tournament,
  liveState,
  tables,
  onClose,
  onRefresh,
}: {
  tournament: Tournament;
  liveState: LiveState | null;
  tables: TournamentTable[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ playerId: string; playerName: string } | null>(null);
  const [emptySeatTarget, setEmptySeatTarget] = useState<{ tableId: string; tableNumber: number; seatNumber: number } | null>(null);

  useEffect(() => {
    tournamentsApi.getPlayers(tournament.id).then((r) => setPlayers(r.data.players ?? [])).catch(() => setPlayers([]));
  }, [tournament.id]);

  const seatedPlayers = tables.flatMap((t) =>
    (t.seats ?? [])
      .filter((s) => s.isOccupied && s.playerId && s.status !== 'ELIMINATED')
      .map((s) => ({ playerId: s.playerId!, playerName: s.playerName || 'Игрок' }))
  );
  const uniqueSeated = Array.from(new Map(seatedPlayers.map((p) => [p.playerId, p])).values());

  const doAction = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
      onRefresh();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: { playerId?: string; playerName?: string }) => {
    if (seat.playerId && seat.playerName) setSelectedPlayer({ playerId: seat.playerId, playerName: seat.playerName });
  };

  const handleEmptySeatClick = (tableId: string, seatNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    setEmptySeatTarget(table ? { tableId, tableNumber: table.tableNumber, seatNumber } : null);
  };

  const handleMovePlayer = async (playerId: string) => {
    if (!emptySeatTarget) return;
    await doAction(() =>
      seatingApi.manualSeating(tournament.id, { playerId, newTableId: emptySeatTarget.tableId, newSeatNumber: emptySeatTarget.seatNumber })
    );
    setEmptySeatTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-screen p-4 flex items-start justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="glass-card p-6 max-w-6xl w-full space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">Управление турниром</h2>
              <p className="text-slate-400">{tournament.name}</p>
              {liveState && (
                <div className="flex gap-4 mt-2 text-sm text-slate-300">
                  <span>Уровень: {liveState.currentLevelNumber}</span>
                  <span>Играет: {liveState.playersCount}</span>
                  <span>Ср. стек: {liveState.averageStack ?? 0}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="glass-btn px-4 py-2 rounded-xl text-sm">Закрыть</button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => doAction(() => seatingApi.initFromClub(tournament.id))} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-sm">Создать столы</button>
            <button onClick={() => doAction(() => seatingApi.autoSeating(tournament.id))} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-sm">Авторассадка</button>
            <button onClick={() => doAction(() => liveStateApi.pause(tournament.id))} disabled={loading || liveState?.isPaused} className="glass-btn px-4 py-2 rounded-xl text-sm">Пауза</button>
            <button onClick={() => doAction(() => liveStateApi.resume(tournament.id))} disabled={loading || !liveState?.isPaused} className="glass-btn px-4 py-2 rounded-xl text-sm">Возобновить</button>
            <button onClick={() => doAction(() => liveTournamentApi.nextLevel(tournament.id))} disabled={loading} className="glass-btn px-4 py-2 rounded-xl text-sm">Следующий уровень</button>
            <button className="glass-btn px-4 py-2 rounded-xl text-sm text-slate-400" title="Требуется API">+ Гость</button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Столы</h3>
            {tables.length === 0 ? (
              <p className="text-slate-400 text-sm">Нет столов. Нажмите «Создать столы» (турнир в клубе) или «Авторассадка».</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map((table) => (
                  <Table2D
                    key={table.id}
                    table={table}
                    showAdmin={true}
                    tournamentId={tournament.id}
                    onPlayerClick={handleSeatClick}
                    onEmptySeatClick={handleEmptySeatClick}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Игроки</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {players.filter((p) => p.isActive).map((p) => (
                <div key={p.id} className="glass-card p-3 flex flex-col gap-2">
                  <span className="text-cyan-300 text-sm truncate">{p.playerName}</span>
                  <div className="flex flex-wrap gap-1">
                    {p.playerId && (
                      <>
                        <button onClick={() => doAction(() => liveTournamentApi.rebuy(tournament.id, p.playerId!))} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs">Ребай</button>
                        <button onClick={() => p.playerId && setSelectedPlayer({ playerId: p.playerId, playerName: p.playerName })} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs">Аддон</button>
                        <button onClick={() => p.playerId && setSelectedPlayer({ playerId: p.playerId, playerName: p.playerName })} disabled={loading} className="glass-btn px-2 py-1 rounded text-xs text-red-400">Вылет</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPlayer && (
            <PlayerActionsModal
              seat={{ id: '', playerId: selectedPlayer.playerId, playerName: selectedPlayer.playerName }}
              tournamentId={tournament.id}
              onClose={() => setSelectedPlayer(null)}
              onDone={() => { setSelectedPlayer(null); onRefresh(); }}
            />
          )}

          {emptySeatTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setEmptySeatTarget(null)}>
              <div className="glass-card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white">
                  Пересадить на стол {emptySeatTarget.tableNumber}, место {emptySeatTarget.seatNumber}
                </h3>
                {uniqueSeated.length === 0 ? (
                  <p className="text-slate-400 text-sm">Нет игроков за столами для пересадки</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {uniqueSeated.map((p) => (
                      <button
                        key={p.playerId}
                        onClick={() => handleMovePlayer(p.playerId)}
                        disabled={loading}
                        className="w-full glass-btn py-2 rounded-xl text-left px-4 text-cyan-300"
                      >
                        {p.playerName}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setEmptySeatTarget(null)} className="w-full text-slate-400 hover:text-white">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
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
      <button onClick={() => setOpen(!open)} className="w-full text-left text-cyan-300 font-medium">
        {playerName}
      </button>
      {open && <OrderForm playerId={playerId} tournamentId={tournamentId} onClose={() => setOpen(false)} onOrder={onOrder} />}
    </div>
  );
}

function OrderForm({ onClose, onOrder }: { playerId: string; tournamentId: string; onClose: () => void; onOrder: () => void }) {
  return (
    <div className="mt-2 text-sm text-slate-400">
      <p>Принять заказ — выбор из меню (интеграция с menu/orders API)</p>
      <button onClick={() => { onOrder(); onClose(); }} className="text-cyan-400 mt-2 mr-2">Оформить</button>
      <button onClick={onClose} className="text-cyan-400 mt-2">Закрыть</button>
    </div>
  );
}
