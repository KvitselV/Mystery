import { useState, useEffect } from 'react';
import { tournamentsApi } from '../api';
import type { Tournament, TournamentPlayerResult } from '../api';

export function PlayerResultsModal({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [results, setResults] = useState<TournamentPlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    tournamentsApi.getPlayerResults(tournament.id)
      .then((r) => setResults(r.data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [tournament.id]);

  const medalClass = (pos: number) => {
    if (pos === 1) return 'text-amber-400';
    if (pos === 2) return 'text-zinc-300';
    if (pos === 3) return 'text-amber-700';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Результаты: {tournament.name}</h3>
        {loading ? (
          <p className="text-zinc-400">Загрузка...</p>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.playerId} className={`flex justify-between items-center py-2 border-b border-white/5 ${medalClass(r.finishPosition)}`}>
                <span>{r.finishPosition}. {r.playerName}{r.clubCardNumber ? ` (${r.clubCardNumber})` : ''}</span>
                <span>{r.points} очк.</span>
              </div>
            ))}
            {results.length === 0 && <p className="text-zinc-500">Нет результатов</p>}
            <button onClick={onClose} className="mt-4 text-zinc-400 hover:text-white">Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
}
