import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';
import { achievementsApi, statisticsApi, tournamentsApi, type PlayerStatistics, type Tournament, type AchievementTypeDto, type AchievementInstanceDto } from '../api';
import { PlayerResultsModal } from '../components/PlayerResultsModal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/** Иконка достижения (изображение или эмодзи) */
function AchievementIcon({ type }: { type: AchievementTypeDto }) {
  const iconUrl = type.iconUrl;
  const icon = type.icon;
  if (iconUrl && (iconUrl.startsWith('data:') || iconUrl.startsWith('http') || iconUrl.startsWith('/'))) {
    return <img src={iconUrl} alt="" className="w-10 h-10 object-contain" />;
  }
  return <span className="text-3xl">{icon ?? '🏅'}</span>;
}

/** Блок достижений: 4 закреплённых + развёрнутый список всех */
function AchievementsBlock({
  progress,
  userId,
  onPinsChange,
}: {
  progress: { unlocked: AchievementInstanceDto[]; locked: AchievementTypeDto[]; pinnedTypeIds: string[]; total: number; unlockedCount: number } | null;
  userId?: string;
  onPinsChange?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pinning, setPinning] = useState(false);

  if (!progress) return <p className="text-zinc-500">Загрузка...</p>;

  const allTypes = [
    ...progress.unlocked.map((u) => ({ type: u.achievementType, unlocked: true, instance: u })),
    ...progress.locked.map((t) => ({ type: t, unlocked: false, instance: null })),
  ].sort((a, b) => (a.type.sortOrder ?? 0) - (b.type.sortOrder ?? 0));

  const typeById = Object.fromEntries(allTypes.map((a) => [a.type.id, a]));

  const pinnedIds = progress.pinnedTypeIds ?? [];
  const pinnedTypes = pinnedIds
    .map((id) => typeById[id])
    .filter(Boolean)
    .slice(0, 4);
  const displayPins = pinnedTypes.length >= 4
    ? pinnedTypes
    : [...pinnedTypes, ...allTypes.filter((a) => !pinnedIds.includes(a.type.id)).slice(0, 4 - pinnedTypes.length)];

  const handleTogglePin = async (typeId: string) => {
    if (!userId || !onPinsChange || pinning) return;
    const current = progress.pinnedTypeIds ?? [];
    const has = current.includes(typeId);
    const next = has ? current.filter((id) => id !== typeId) : [...current, typeId].slice(0, 4);
    setPinning(true);
    try {
      await achievementsApi.setPins(userId, next);
      onPinsChange();
    } catch {
      // ignore
    } finally {
      setPinning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {displayPins.slice(0, 4).map((a) => (
          <div
            key={a.type.id}
            className={`glass-card p-3 flex flex-col items-center justify-center min-h-[80px] transition-opacity ${a.unlocked ? '' : 'opacity-50'}`}
            title={a.type.conditionDescription ?? a.type.description}
          >
            <AchievementIcon type={a.type} />
            <span className="text-amber-400 font-medium text-sm mt-1 truncate w-full text-center">{a.type.name}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-amber-400 text-sm hover:underline"
      >
        {expanded ? 'Свернуть' : 'Все достижения'}
      </button>

      {expanded && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2">
          {allTypes.map((a) => (
            <div
              key={a.type.id}
              className={`glass-card p-2 flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${
                a.unlocked ? '' : 'opacity-50 grayscale'
              } ${(progress.pinnedTypeIds ?? []).includes(a.type.id) ? 'ring-2 ring-amber-500' : ''}`}
              title={a.type.conditionDescription ?? a.type.description}
              onClick={() => userId && handleTogglePin(a.type.id)}
            >
              <AchievementIcon type={a.type} />
              <span className="text-xs text-zinc-400 truncate w-full text-center mt-1">{a.type.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRegistrationDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : format(d, 'd MMMM yyyy', { locale: ru });
}

function formatStat(value: number | null | undefined): string {
  if (value == null || (typeof value === 'number' && isNaN(value))) return '—';
  return String(value);
}

/** Процент стола: 1-е место = 100%, последнее = 0%. Формула: (totalPlayers - place + 1) / totalPlayers * 100 */
function placeToPercent(place: number, totalPlayers: number): number {
  if (totalPlayers <= 0 || place < 1) return 100;
  return Math.round(((totalPlayers - place + 1) / totalPlayers) * 100);
}

type PerfItem = { date: string; place: number; totalPlayers: number; tournamentId?: string };

/** Линейный график последних 7 выступлений (дата по X, % стола по Y, 100% сверху) */
function PerformanceChart({ data }: { data: PerfItem[] }) {
  if (data.length === 0) return <p className="text-zinc-500 text-sm">Нет данных для графика</p>;

  const width = 320;
  const height = 140;
  const pad = { left: 40, right: 8, top: 8, bottom: 24 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const percents = data.map((d) => placeToPercent(d.place, d.totalPlayers));
  const minP = Math.min(...percents, 0);
  const maxP = Math.max(...percents, 100);
  const rangeP = maxP - minP || 1;

  const scaleY = (pct: number) => pad.top + chartH - ((pct - minP) / rangeP) * chartH;
  const scaleX = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * chartW;

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(placeToPercent(d.place, d.totalPlayers))}`)
    .join(' ');

  const yLabels = [100, 50, 0].filter((p) => p >= minP && p <= maxP);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-0">
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1={pad.left} y1={pad.top + chartH} x2={pad.left + chartW} y2={pad.top + chartH} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d={pathD} fill="none" stroke="rgb(251,191,36)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={scaleX(i)} cy={scaleY(placeToPercent(d.place, d.totalPlayers))} r="4" fill="rgb(251,191,36)" />
        ))}
        {yLabels.map((pct) => (
          <text key={pct} x={pad.left - 6} y={scaleY(pct)} textAnchor="end" fill="rgb(163,163,163)" fontSize="11" dominantBaseline="middle">
            {pct}%
          </text>
        ))}
        {data.map((d, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={height - 4}
            textAnchor="middle"
            fill="rgb(163,163,163)"
            fontSize="10"
          >
            {format(new Date(d.date), 'dd.MM')}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function ProfilePage() {
  const { userId: urlUserId } = useParams<{ userId?: string }>();
  const { user, promoteToAdmin, isAdmin, refreshUser } = useAuth();
  const [viewingUser, setViewingUser] = useState<{ id: string; name?: string; clubCardNumber?: string; avatarUrl?: string | null; createdAt?: string } | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [achievementProgress, setAchievementProgress] = useState<{
    unlocked: AchievementInstanceDto[];
    locked: AchievementTypeDto[];
    pinnedTypeIds: string[];
    total: number;
    unlockedCount: number;
  } | null>(null);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [resultsTournament, setResultsTournament] = useState<Tournament | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Определяем, чей профиль показывать: из URL или текущего пользователя
  const targetUserId = urlUserId || user?.id;
  const isOwnProfile = !urlUserId || urlUserId === user?.id;

  useEffect(() => {
    if (!targetUserId) return;
    
    // Если просматриваем чужой профиль, загружаем данные пользователя
    if (urlUserId && urlUserId !== user?.id) {
      // Для чужого профиля используем публичный endpoint
      statisticsApi.getPublicByUserId(targetUserId).then((r) => {
        const data = r.data as PlayerStatistics & { user?: { id: string; name: string; clubCardNumber: string; avatarUrl?: string | null; createdAt: string } };
        if (data.user) {
          setViewingUser(data.user);
        }
        setStats(data);
      }).catch(() => {
        setStats(null);
        setViewingUser(null);
      });
      achievementsApi.getUserProgress(targetUserId).then((r) => setAchievementProgress(r.data)).catch(() => setAchievementProgress(null));
    } else {
      // Свой профиль
      setViewingUser(null);
      achievementsApi.getUserProgress(targetUserId).then((r) => setAchievementProgress(r.data)).catch(() => setAchievementProgress(null));
      statisticsApi.getFull(targetUserId).then((r) => setStats(r.data as PlayerStatistics)).catch(() => setStats(null));
    }
  }, [targetUserId, urlUserId, user?.id]);

  useEffect(() => {
    if (isOwnProfile) {
      setEditName(user?.name ?? '');
      setEditPhone(user?.phone ?? '');
    }
  }, [user?.name, user?.phone, isOwnProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ name: editName.trim(), phone: editPhone.trim() });
      await refreshUser();
      setEditMode(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка сохранения';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 200 * 1024) {
      alert('Размер изображения не более 200 КБ');
      return;
    }
    setAvatarLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(file);
      });
      await authApi.updateProfile({ avatarUrl: dataUrl });
      await refreshUser();
    } catch {
      alert('Ошибка загрузки аватарки');
    } finally {
      setAvatarLoading(false);
    }
    e.target.value = '';
  };

  const displayUser = viewingUser || user;
  const displayName = viewingUser?.name || user?.name || 'Игрок';
  const displayCardNumber = viewingUser?.clubCardNumber || user?.clubCardNumber || '';
  // Для чужого профиля используем только avatarUrl просматриваемого пользователя (даже если null)
  // Для своего профиля используем avatarUrl текущего пользователя
  const displayAvatarUrl = isOwnProfile ? user?.avatarUrl : (viewingUser?.avatarUrl ?? null);
  const displayCreatedAt = viewingUser?.createdAt || user?.createdAt;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">{isOwnProfile ? 'Информация о себе' : `Профиль: ${displayName}`}</h2>
        {isOwnProfile && !isAdmin && import.meta.env.DEV && (
          <button
            onClick={async () => { setPromoting(true); try { await promoteToAdmin(); } catch {} setPromoting(false); }}
            disabled={promoting}
            className="glass-btn px-4 py-2 rounded-xl mb-4 text-sm"
          >
            {promoting ? '...' : 'Стать администратором (dev)'}
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="w-24 h-24 rounded-full overflow-hidden glass-card border-2 border-amber-500/30 hover:border-amber-500/60 transition-colors flex items-center justify-center shrink-0"
                >
                  {displayAvatarUrl ? (
                    <img src={displayAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-zinc-500">👤</span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <span className="text-zinc-500 text-xs mt-2">Нажмите для смены</span>
              </>
            ) : (
              <div className="w-24 h-24 rounded-full overflow-hidden glass-card border-2 border-amber-500/30 flex items-center justify-center shrink-0">
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-zinc-500">👤</span>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            {isOwnProfile && editMode ? (
              <>
                <div>
                  <label className="text-zinc-500 text-sm">Имя</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Телефон</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} disabled={saving} className="glass-btn px-4 py-2 rounded-xl text-sm">
                    {saving ? '...' : 'Сохранить'}
                  </button>
                  <button onClick={() => { setEditMode(false); setEditName(user?.name ?? ''); setEditPhone(user?.phone ?? ''); }} className="glass-card px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white">
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-zinc-300"><span className="text-zinc-500">Имя:</span> {displayName}</p>
                {isOwnProfile && <p className="text-zinc-300"><span className="text-zinc-500">Телефон:</span> {user?.phone}</p>}
                {isOwnProfile && <button onClick={() => setEditMode(true)} className="text-amber-400 text-sm hover:underline">Изменить имя и телефон</button>}
              </>
            )}
            {displayCardNumber && <p className="text-zinc-500 text-sm">Номер клубной карты: {displayCardNumber}</p>}
            <p className="text-zinc-500 text-sm">Дата регистрации: {formatRegistrationDate(displayCreatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Статистика</h2>
        {stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-zinc-300">
              <div className="glass-card p-3 rounded-xl">
                <div className="text-zinc-500 text-xs mb-0.5">Турниров сыграно</div>
                <div className="text-white font-bold text-lg">{formatStat(stats.tournamentsPlayed)}</div>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="text-zinc-500 text-xs mb-0.5">Процент побед</div>
                <div className="text-amber-400 font-bold text-lg">{stats.tournamentsPlayed > 0 ? `${stats.winPercentage}%` : '—'}</div>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="text-zinc-500 text-xs mb-0.5">Лучший результат</div>
                <div className="text-white font-bold text-lg">{formatStat(stats.bestFinish) === '—' ? '—' : `#${formatStat(stats.bestFinish)}`}</div>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="text-zinc-500 text-xs mb-0.5">Среднее место</div>
                <div className="text-white font-bold text-lg">{stats.tournamentsPlayed > 0 ? formatStat(stats.averageFinish) : '—'}</div>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="text-zinc-500 text-xs mb-0.5">Финальный стол</div>
                <div className="text-emerald-400 font-bold text-lg">{stats.tournamentsPlayed > 0 ? `${formatStat(stats.itmRate)}%` : '—'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-amber-400 font-medium mb-2">Пьедестал</h3>
              <div className="flex gap-4 text-zinc-300">
                <span>🥇 1-е: <strong className="text-amber-400">{stats.finishes?.first ?? 0}</strong></span>
                <span>🥈 2-е: <strong className="text-zinc-300">{stats.finishes?.second ?? 0}</strong></span>
                <span>🥉 3-е: <strong className="text-amber-700">{stats.finishes?.third ?? 0}</strong></span>
              </div>
            </div>

            {stats.bestStreak > 0 && (
              <div className="text-zinc-400 text-sm">
                Лучшая серия финишей в призах: <span className="text-amber-400 font-medium">{stats.bestStreak}</span>
              </div>
            )}

            <div>
              {stats.last7Performances && stats.last7Performances.length > 0 ? (
                <>
                  <h3 className="text-amber-400 font-medium mb-2">Последние 7 выступлений</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {stats.last7Performances.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (p.tournamentId) {
                            tournamentsApi.getById(p.tournamentId)
                              .then((r) => setResultsTournament(r.data))
                              .catch(() => {});
                          }
                        }}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg glass-card border border-transparent hover:border-amber-500/50 hover:bg-white/5 transition-colors text-sm font-bold ${
                          p.place <= 3 ? 'text-amber-400' : 'text-zinc-300'
                        }`}
                        title={format(new Date(p.date), 'd MMM yyyy', { locale: ru })}
                      >
                        {p.place}
                      </button>
                    ))}
                  </div>
                  <PerformanceChart data={stats.last7Performances} />
                  <div className="mt-4 space-y-1">
                    {stats.last7Performances.map((p, i) => (
                      <div key={i} className="flex justify-between text-zinc-400 text-sm">
                        <span>{format(new Date(p.date), 'd MMM yyyy', { locale: ru })}</span>
                        <span className={p.place <= 3 ? 'text-amber-400 font-medium' : ''}>
                          #{p.place} из {p.totalPlayers} ({placeToPercent(p.place, p.totalPlayers)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-zinc-500 text-sm">Пока нет выступлений</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">Загрузка статистики...</p>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Достижения</h2>
        <AchievementsBlock
          progress={achievementProgress}
          userId={isOwnProfile ? user?.id : targetUserId}
          onPinsChange={() => {
            if (targetUserId) achievementsApi.getUserProgress(targetUserId).then((r) => setAchievementProgress(r.data)).catch(() => {});
          }}
        />
      </div>

      {resultsTournament && (
        <PlayerResultsModal
          tournament={resultsTournament}
          onClose={() => setResultsTournament(null)}
        />
      )}
    </div>
  );
}
