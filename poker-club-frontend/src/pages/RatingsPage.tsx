import { useState, useEffect } from 'react';
import { leaderboardsApi, tournamentSeriesApi, type Leaderboard, type LeaderboardEntry } from '../api';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'series' | 'seasonal' | 'mmr';

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
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'series' ? 'glass-btn' : 'text-slate-400 hover:text-white'}`}
        >
          Рейтинги серий турниров
        </button>
        <button
          onClick={() => setTab('seasonal')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'seasonal' ? 'glass-btn' : 'text-slate-400 hover:text-white'}`}
        >
          Сезонный рейтинг
        </button>
        <button
          onClick={() => setTab('mmr')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'mmr' ? 'glass-btn' : 'text-slate-400 hover:text-white'}`}
        >
          Рейтинг по рангу (MMR)
        </button>
      </div>

      {loading ? (
        <div className="text-cyan-400 animate-pulse">Загрузка...</div>
      ) : (
        <>
          {tab === 'mmr' && (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-slate-400 font-medium">#</th>
                    <th className="px-6 py-4 text-slate-400 font-medium">Игрок</th>
                    <th className="px-6 py-4 text-slate-400 font-medium">MMR</th>
                  </tr>
                </thead>
                <tbody>
                  {mmrEntries.map((e, i) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 text-cyan-400">{i + 1}</td>
                      <td className="px-6 py-4 text-white">{e.playerName ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-300">{e.mmr ?? e.ratingPoints ?? e.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'series' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {seriesLbs.map((lb) => (
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
                        <th className="px-6 py-4 text-slate-400 font-medium">#</th>
                        <th className="px-6 py-4 text-slate-400 font-medium">Игрок</th>
                        <th className="px-6 py-4 text-slate-400 font-medium">Очки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 text-cyan-400">{e.rankPosition ?? i + 1}</td>
                          <td className="px-6 py-4 text-white">{e.playerName ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-300">{e.ratingPoints ?? e.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                        <th className="px-6 py-4 text-slate-400 font-medium">#</th>
                        <th className="px-6 py-4 text-slate-400 font-medium">Игрок</th>
                        <th className="px-6 py-4 text-slate-400 font-medium">Очки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 text-cyan-400">{e.rankPosition ?? i + 1}</td>
                          <td className="px-6 py-4 text-white">{e.playerName ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-300">{e.ratingPoints ?? e.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <p className="text-slate-500 text-sm">В настройках можно настроить отображение турнирных рейтингов.</p>
          )}
        </>
      )}
    </div>
  );
}
