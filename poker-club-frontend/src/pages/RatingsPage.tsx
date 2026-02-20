import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardsApi, tournamentSeriesApi, tournamentsApi, type Leaderboard, type LeaderboardEntry, type SeriesRatingRow, type Tournament } from '../api';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';
import { PlayerResultsModal } from '../components/PlayerResultsModal';

type Tab = 'series' | 'seasonal' | 'mmr';

/** Конвертация MMR в ранг (E–SS) — дублирует логику бэкенда */
function mmrToRank(mmr: number): string {
  if (mmr >= 3001) return 'SS';
  if (mmr >= 2501) return 'S';
  if (mmr >= 2001) return 'A';
  if (mmr >= 1501) return 'B';
  if (mmr >= 1001) return 'C';
  if (mmr >= 501) return 'D';
  return 'E';
}

/** Стили строки по рангу: E=дерево, C=бронза, B=серебро, A=золото, S=чернозолотой */
function rankRowClass(rank: string): string {
  switch (rank) {
    case 'E': return 'bg-emerald-950/60 border-l-4 border-emerald-600/80';
    case 'D': return 'bg-emerald-900/40 border-l-4 border-emerald-500/60';
    case 'C': return 'bg-amber-900/50 border-l-4 border-amber-700';
    case 'B': return 'bg-zinc-600/30 border-l-4 border-zinc-400';
    case 'A': return 'bg-amber-600/30 border-l-4 border-amber-400';
    case 'S': return 'bg-zinc-900/80 border-l-4 border-amber-500 shadow-[inset_0_0_20px_rgba(251,191,36,0.1)]';
    case 'SS': return 'bg-zinc-950 border-l-4 border-amber-300 shadow-[inset_0_0_24px_rgba(251,191,36,0.15)]';
    default: return 'border-l-4 border-transparent';
  }
}

/** Цвет текста ранга для читаемости */
function rankTextClass(rank: string): string {
  switch (rank) {
    case 'E': return 'text-emerald-400';
    case 'D': return 'text-emerald-300';
    case 'C': return 'text-amber-200';
    case 'B': return 'text-zinc-200';
    case 'A': return 'text-amber-300';
    case 'S':
    case 'SS': return 'text-amber-400';
    default: return 'text-zinc-300';
  }
}

/** Ячейка с именем игрока: аватар + имя, при клике — переход в профиль */
function PlayerCell({ avatarUrl, playerName, clubCardNumber, userId, center }: { avatarUrl?: string; playerName?: string; clubCardNumber?: string; userId?: string; center?: boolean }) {
  const navigate = useNavigate();
  const alignClass = center ? 'justify-center' : 'justify-start';
  const content = (
    <div className={`flex items-center gap-2 ${alignClass}`}>
      {avatarUrl && (
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <div className="text-white font-medium">{playerName ?? '—'}</div>
        {clubCardNumber && (
          <div className="text-xs text-zinc-500">#{clubCardNumber}</div>
        )}
      </div>
    </div>
  );
  if (userId) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/profile/${userId}`)}
        className={`w-full hover:bg-white/5 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors cursor-pointer flex ${alignClass}`}
      >
        {content}
      </button>
    );
  }
  return <div className={`flex ${alignClass}`}>{content}</div>;
}

function SeriesRatingTable({
  seriesLbs,
  clubSeriesIds,
  selectedClubId,
  defaultSeriesId,
}: {
  seriesLbs: Leaderboard[];
  clubSeriesIds: Set<string>;
  selectedClubId?: string;
  defaultSeriesId?: string | null;
}) {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(defaultSeriesId ?? null);
  const [table, setTable] = useState<{ seriesName: string; columns: { date: string; dateLabel: string; tournamentId: string }[]; rows: SeriesRatingRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportTournament, setReportTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (defaultSeriesId && !selectedSeriesId) {
      setSelectedSeriesId(defaultSeriesId);
    }
  }, [defaultSeriesId, selectedSeriesId]);

  useEffect(() => {
    if (!selectedSeriesId) {
      setTable(null);
      return;
    }
    setLoading(true);
    tournamentSeriesApi.getRatingTable(selectedSeriesId)
      .then((r) => setTable(r.data))
      .catch(() => setTable(null))
      .finally(() => setLoading(false));
  }, [selectedSeriesId]);

  // Вычисление мест с учётом ничьих (66 и 66 → оба 1, следующий 3)
  const ranks = (() => {
    if (!table?.rows.length) return [];
    const arr: number[] = [];
    let rank = 1;
    for (let i = 0; i < table.rows.length; i++) {
      if (i > 0 && table.rows[i].totalPoints < table.rows[i - 1].totalPoints) {
        rank = i + 1;
      }
      arr.push(rank);
    }
    return arr;
  })();

  const rankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    if (rank === 2) return 'bg-zinc-500/20 text-zinc-300 border-zinc-400/50';
    if (rank === 3) return 'bg-amber-800/30 text-amber-700 border-amber-700/50';
    return 'bg-white/5 text-zinc-300 border-white/10';
  };

  const positionDotClass = (pos: number) => {
    if (pos === 1) return 'bg-amber-400';
    if (pos === 2) return 'bg-zinc-300';
    if (pos === 3) return 'bg-amber-700';
    return 'bg-zinc-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {seriesLbs.map((lb) => (
          lb.seriesId && (
            <button
              key={lb.id}
              onClick={() => setSelectedSeriesId(selectedSeriesId === lb.seriesId! ? null : lb.seriesId!)}
              className={`px-4 py-2 rounded-xl text-sm ${selectedSeriesId === lb.seriesId ? 'glass-btn' : 'glass-card hover:bg-white/5'}`}
            >
              {lb.name}
            </button>
          )
        ))}
      </div>
      {selectedSeriesId && (
        loading ? (
          <div className="text-amber-400 animate-pulse">Загрузка...</div>
        ) : table ? (
          <div className="glass-card overflow-x-auto">
            <h3 className="text-lg font-bold text-white px-6 py-4">{table.seriesName}</h3>
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider text-center">Место</th>
                  <th className="px-6 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider text-center">Участник</th>
                  <th className="px-6 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider text-center">Итого</th>
                  {table.columns.map((c) => (
                    <th key={c.date} className="px-6 py-3 text-zinc-400 font-medium text-xs uppercase tracking-wider text-center">
                      <button
                        type="button"
                        onClick={() => {
                          tournamentsApi.getById(c.tournamentId)
                            .then((r) => setReportTournament(r.data))
                            .catch(() => {});
                        }}
                        className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                      >
                        {c.dateLabel}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, idx) => (
                  <tr key={row.playerId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded border text-sm font-medium ${rankBadgeClass(ranks[idx] ?? idx + 1)}`}>
                        {ranks[idx] ?? idx + 1}
                      </span>
                    </td>
                        <td className="px-6 py-3 text-center">
                      <PlayerCell
                        avatarUrl={row.avatarUrl}
                        playerName={row.playerName}
                        clubCardNumber={row.clubCardNumber}
                        userId={row.userId}
                        center
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-emerald-400 font-bold">{row.totalPoints}</span>
                    </td>
                    {table.columns.map((c) => {
                      const pts = row.pointsByDate?.[c.date];
                      const pos = row.positionByDate?.[c.date];
                      const hasParticipation = (pts !== undefined && pts !== null) || (pos !== undefined && pos !== null);
                      const displayPts = hasParticipation ? (pts ?? 0) : null;
                      const showDot = hasParticipation && pos && pos <= 3;
                      const cellHighlight = hasParticipation && pos
  ? pos === 1
    ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/12 to-amber-500/5'
    : pos === 2
      ? 'bg-gradient-to-r from-zinc-400/20 via-zinc-300/10 to-zinc-400/5'
      : pos === 3
        ? 'bg-gradient-to-r from-amber-800/30 via-amber-700/15 to-amber-800/8'
        : ''
  : '';
                      return (
                        <td key={c.date} className={`px-6 py-3 text-center ${cellHighlight}`}>
                          {displayPts !== null ? (
                            <span className="flex items-center justify-center gap-1.5">
                              {showDot && (
                                <span className={`shrink-0 w-2 h-2 rounded-full ${positionDotClass(pos ?? 99)}`} />
                              )}
                              <span className={pos && pos <= 3 ? 'text-amber-300 font-medium' : 'text-zinc-200'}>{displayPts}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500">Нет данных</p>
        )
      )}
      {reportTournament && (
        <PlayerResultsModal
          tournament={reportTournament}
          onClose={() => setReportTournament(null)}
        />
      )}
    </div>
  );
}

export default function RatingsPage() {
  const { selectedClub } = useClub();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('mmr');
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [clubSeriesIds, setClubSeriesIds] = useState<Set<string>>(new Set());
  const [selectedLb, setSelectedLb] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mmrEntries, setMmrEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const lbRes = await leaderboardsApi.list();
        setLeaderboards(lbRes.data?.leaderboards || []);
        const mmrRes = await leaderboardsApi.getRankMmr();
        setMmrEntries(mmrRes.data?.entries || []);
      } catch {
        setLeaderboards([]);
        setMmrEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClub?.id) {
      setClubSeriesIds(new Set());
      return;
    }
    tournamentSeriesApi.list({ clubId: selectedClub.id }).then((r) => {
      const ids = new Set((r.data?.series || []).map((s) => s.id));
      setClubSeriesIds(ids);
    }).catch(() => setClubSeriesIds(new Set()));
  }, [selectedClub?.id]);

  useEffect(() => {
    if (!selectedLb) return;
    leaderboardsApi.getEntries(selectedLb, 50).then((r) => setEntries(r.data?.entries || [])).catch(() => setEntries([]));
  }, [selectedLb]);

  const allSeriesLbs = leaderboards.filter((lb) => lb.type === 'TOURNAMENT_SERIES');
  const seriesLbs = selectedClub?.id
    ? allSeriesLbs.filter((lb) => lb.seriesId && clubSeriesIds.has(lb.seriesId))
    : allSeriesLbs;
  const seasonalLbs = leaderboards.filter((lb) => lb.type === 'SEASONAL');

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('series')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'series' ? 'glass-btn' : 'text-zinc-400 hover:text-amber-200'}`}
        >
          Рейтинги серий турниров
        </button>
        <button
          onClick={() => setTab('seasonal')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'seasonal' ? 'glass-btn' : 'text-zinc-400 hover:text-amber-200'}`}
        >
          Сезонный рейтинг
        </button>
        <button
          onClick={() => setTab('mmr')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'mmr' ? 'glass-btn' : 'text-zinc-400 hover:text-amber-200'}`}
        >
          Рейтинг игроков
        </button>
      </div>

      {loading ? (
        <div className="text-amber-400 animate-pulse">Загрузка...</div>
      ) : (
        <>
          {tab === 'mmr' && (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-zinc-400 font-medium">#</th>
                    <th className="px-6 py-4 text-zinc-400 font-medium">Игрок</th>
                    <th className="px-6 py-4 text-zinc-400 font-medium">Ранг</th>
                  </tr>
                </thead>
                <tbody>
                  {mmrEntries.map((e, i) => {
                    const mmr = e.mmr ?? e.ratingPoints ?? e.points ?? 0;
                    const rank = e.rankCode ?? mmrToRank(typeof mmr === 'number' ? mmr : 0);
                    return (
                      <tr key={e.id ?? i} className={`border-b border-white/5 hover:bg-white/5 ${rankRowClass(rank)}`}>
                        <td className="px-6 py-4 text-amber-400">{i + 1}</td>
                        <td className="px-6 py-4 text-white">
                          <PlayerCell avatarUrl={e.avatarUrl} playerName={e.playerName} userId={e.userId} />
                        </td>
                        <td className={`px-6 py-4 font-bold ${rankTextClass(rank)}`}>{rank}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'series' && (
            <SeriesRatingTable
              seriesLbs={seriesLbs}
              clubSeriesIds={clubSeriesIds}
              selectedClubId={selectedClub?.id}
              defaultSeriesId={seriesLbs[0]?.seriesId ?? null}
            />
          )}

          {tab === 'seasonal' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {seasonalLbs.map((lb) => (
                  <button
                    key={lb.id}
                    onClick={() => setSelectedLb(selectedLb === lb.id ? null : lb.id)}
                    className={`px-4 py-2 rounded-xl text-sm ${selectedLb === lb.id ? 'glass-btn' : 'glass-card hover:bg-white/5'}`}
                  >
                    {lb.name}
                  </button>
                ))}
              </div>
              {selectedLb && (
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-zinc-400 font-medium">#</th>
                        <th className="px-6 py-4 text-zinc-400 font-medium">Игрок</th>
                        <th className="px-6 py-4 text-zinc-400 font-medium">Очки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 text-amber-400">{e.rankPosition ?? i + 1}</td>
                          <td className="px-6 py-4 text-white">
                            <PlayerCell avatarUrl={e.avatarUrl} playerName={e.playerName} userId={e.userId} />
                          </td>
                          <td className="px-6 py-4 text-zinc-300">{e.ratingPoints ?? e.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <p className="text-zinc-500 text-sm">В настройках можно настроить отображение турнирных рейтингов.</p>
          )}
        </>
      )}
    </div>
  );
}
