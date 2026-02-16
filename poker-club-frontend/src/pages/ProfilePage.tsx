import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { achievementsApi, statisticsApi } from '../api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function formatRegistrationDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : format(d, 'd MMMM yyyy', { locale: ru });
}

export default function ProfilePage() {
  const { user, promoteToAdmin, isAdmin } = useAuth();
  const [promoting, setPromoting] = useState(false);
  const [achievements, setAchievements] = useState<{ code?: string; name?: string; progress?: number }[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    achievementsApi.getUser(user.id).then((r) => setAchievements(r.data || [])).catch(() => setAchievements([]));
    statisticsApi.getFull(user.id).then((r) => setStats(r.data as Record<string, unknown>)).catch(() => setStats(null));
  }, [user?.id]);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Информация о себе</h2>
        {!isAdmin && import.meta.env.DEV && (
          <button
            onClick={async () => { setPromoting(true); try { await promoteToAdmin(); } catch {} setPromoting(false); }}
            disabled={promoting}
            className="glass-btn px-4 py-2 rounded-xl mb-4 text-sm"
          >
            {promoting ? '...' : 'Стать администратором (dev)'}
          </button>
        )}
        <div className="space-y-2 text-zinc-300">
          <p><span className="text-zinc-500">Имя:</span> {user?.name}</p>
          {user?.clubCardNumber && <p><span className="text-zinc-500">Номер клубной карты:</span> {user.clubCardNumber}</p>}
          <p><span className="text-zinc-500">Телефон:</span> {user?.phone}</p>
          <p><span className="text-zinc-500">Дата регистрации:</span> {formatRegistrationDate(user?.createdAt)}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Статистика</h2>
        {stats ? (
          <div className="grid grid-cols-2 gap-4 text-zinc-300">
            <div><span className="text-zinc-500">Турниров сыграно:</span> {(stats as { tournamentsPlayed?: number }).tournamentsPlayed ?? '—'}</div>
            <div><span className="text-zinc-500">Лучший результат:</span> {(stats as { bestFinish?: number }).bestFinish ?? '—'}</div>
            <div><span className="text-zinc-500">ИТМ:</span> {(stats as { itmRate?: number }).itmRate ?? '—'}</div>
          </div>
        ) : (
          <p className="text-zinc-500">Загрузка статистики...</p>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Достижения</h2>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((a, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="text-amber-400 font-medium">{a.name ?? a.code ?? '—'}</div>
                {a.progress != null && <div className="text-zinc-400 text-sm">{a.progress}%</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">Пока нет достижений</p>
        )}
      </div>
    </div>
  );
}
