import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  blindStructuresApi,
  clubsApi,
  menuApi,
  leaderboardsApi,
  tournamentSeriesApi,
  tournamentsApi,
  type BlindStructure,
  type Club,
  type MenuCategory,
  type MenuItem,
  type CreateLevelDto,
  type BreakType,
  type TournamentSeries,
  type Tournament,
  type UpdateTournamentDto,
} from '../../api';
import { useClub } from '../../contexts/ClubContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isController } = useAuth();
  const { selectedClub } = useClub();
  const isControllerForSelectedClub = isController && selectedClub?.id === user?.managedClubId;
  if (isController && !isAdmin && !isControllerForSelectedClub) {
    navigate('/tournaments', { replace: true });
    return null;
  }
  return (
    <div className="flex gap-6">
      <nav className="w-48 shrink-0 space-y-1">
        <NavLink to="/settings/series" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Турнирные серии
        </NavLink>
        <NavLink to="/settings/tournaments" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Турниры
        </NavLink>
        <NavLink to="/settings/seasons" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Сезоны
        </NavLink>
        <NavLink to="/settings/blinds" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Структуры блайндов
        </NavLink>
        {isAdmin && (
          <>
            <NavLink to="/settings/clubs" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
              Клубы
            </NavLink>
            <NavLink to="/settings/menu" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
              Меню
            </NavLink>
            <NavLink to="/settings/tv" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
              Настройки TV
            </NavLink>
          </>
        )}
      </nav>
      <div className="flex-1 glass-card p-6">
        <Routes>
          <Route path="/" element={<SettingsHome />} />
          <Route path="/series" element={<SettingsSeries />} />
          <Route path="/tournaments" element={<SettingsTournaments />} />
          <Route path="/seasons" element={<SettingsSeasons />} />
          <Route path="/blinds" element={<SettingsBlinds />} />
          <Route path="/clubs" element={<SettingsClubs />} />
          <Route path="/menu" element={<SettingsMenu />} />
          <Route path="/tv" element={<SettingsTV />} />
        </Routes>
      </div>
    </div>
  );
}

function SettingsHome() {
  return <p className="text-zinc-400">Выберите раздел в меню</p>;
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function SettingsSeries() {
  const { selectedClub } = useClub();
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [structures, setStructures] = useState<BlindStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [defaultStartTime, setDefaultStartTime] = useState('19:00');
  const [defaultBuyIn, setDefaultBuyIn] = useState(3000);
  const [defaultStartingStack, setDefaultStartingStack] = useState(10000);
  const [defaultBlindStructureId, setDefaultBlindStructureId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        tournamentSeriesApi.list({ clubId: selectedClub?.id }),
        blindStructuresApi.list({ clubId: selectedClub?.id }),
      ]);
      setSeries(sRes.data?.series ?? []);
      setStructures(bRes.data?.structures ?? []);
    } catch {
      setSeries([]);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedClub?.id]);

  const toggleDay = (d: number) => setDaysOfWeek((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort((a, b) => a - b)));

  const create = async () => {
    if (!name.trim() || !periodStart || !periodEnd) return;
    try {
      await tournamentSeriesApi.create({
        name: name.trim(),
        periodStart,
        periodEnd,
        daysOfWeek,
        clubId: selectedClub?.id,
        defaultStartTime,
        defaultBuyIn,
        defaultStartingStack,
        defaultBlindStructureId: defaultBlindStructureId || undefined,
      });
      setShowForm(false);
      setName('');
      setPeriodStart('');
      setPeriodEnd('');
      setDaysOfWeek([1, 2, 3, 4, 5, 6]);
      load();
    } catch {}
  };

  const update = async () => {
    if (!editId || !name.trim() || !periodStart || !periodEnd) return;
    try {
      await tournamentSeriesApi.update(editId, { name: name.trim(), periodStart, periodEnd, daysOfWeek });
      setEditId(null);
      load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить серию?')) return;
    try {
      await tournamentSeriesApi.delete(id);
      load();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    }
  };

  const startEdit = (s: TournamentSeries) => {
    setEditId(s.id);
    setName(s.name);
    setPeriodStart(s.periodStart?.slice(0, 10) ?? '');
    setPeriodEnd(s.periodEnd?.slice(0, 10) ?? '');
    const days = s.daysOfWeek ? s.daysOfWeek.split(',').map(Number) : [1, 2, 3, 4, 5, 6];
    setDaysOfWeek(days);
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Турнирные серии</h2>
      <p className="text-zinc-400 mb-4">У каждой серии свой рейтинг. Турниры создаются автоматически по дням недели. Серия привязана к выбранному клубу.</p>
      <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новая серия'}
      </button>

      {(showForm || editId) && (
        <div className="glass-card p-4 mb-6 space-y-4">
          <input placeholder="Название серии *" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <div className="flex gap-4">
            <div>
              <label className="text-zinc-400 text-sm">Дата начала</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Дата финального стола</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Дни недели</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-1 rounded-lg text-sm ${daysOfWeek.includes(d) ? 'glass-btn' : 'bg-white/5 text-zinc-500'}`}>{DAY_NAMES[d]}</button>
              ))}
            </div>
          </div>
          {!editId && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 text-sm">Время старта</label>
                <input type="time" value={defaultStartTime} onChange={(e) => setDefaultStartTime(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Бай-ин (₽)</label>
                <input type="number" value={defaultBuyIn || ''} onChange={(e) => setDefaultBuyIn(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Стартовый стек</label>
                <input type="number" value={defaultStartingStack || ''} onChange={(e) => setDefaultStartingStack(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Структура блайндов</label>
                <select value={defaultBlindStructureId} onChange={(e) => setDefaultBlindStructureId(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
                  <option value="">—</option>
                  {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {editId ? <button onClick={update} className="glass-btn px-4 py-2 rounded-xl">Сохранить</button> : <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>}
        </div>
      )}

      <div className="space-y-2">
        {series.map((s) => (
          <div key={s.id} className="flex justify-between items-center glass-card p-3">
            <div>
              <span className="text-white">{s.name}</span>
              <span className="text-zinc-500 text-sm ml-2">{s.periodStart?.slice(0, 10)} — {s.periodEnd?.slice(0, 10)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="text-amber-400 text-sm">Изменить</button>
              <button onClick={() => remove(s.id)} className="text-red-400 text-sm">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTournaments() {
  const { selectedClub } = useClub();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [structures, setStructures] = useState<BlindStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', seriesId: '', clubId: '', startTime: '', buyInCost: 3000, startingStack: 10000, addonChips: 0, addonCost: 0, rebuyChips: 0, rebuyCost: 0, maxRebuys: 0, maxAddons: 0, blindStructureId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, cRes, bRes] = await Promise.all([
        tournamentsApi.list({ clubId: selectedClub?.id, limit: 100 }),
        tournamentSeriesApi.list(),
        clubsApi.list(),
        blindStructuresApi.list(),
      ]);
      setTournaments(tRes.data?.tournaments ?? []);
      setSeries(sRes.data?.series ?? []);
      setClubs(cRes.data?.clubs ?? []);
      const structs = bRes.data?.structures ?? [];
      setStructures(structs);
    } catch {
      setTournaments([]);
      setSeries([]);
      setClubs([]);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedClub?.id]);

  const create = async () => {
    if (!form.name.trim() || !form.startTime || form.buyInCost < 0 || !form.startingStack) return;
    try {
      await tournamentsApi.create({
        name: form.name.trim(),
        startTime: form.startTime,
        buyInCost: form.buyInCost,
        startingStack: form.startingStack,
        seriesId: form.seriesId || undefined,
        clubId: form.clubId || selectedClub?.id || undefined,
        addonChips: form.addonChips,
        addonCost: form.addonCost,
        rebuyChips: form.rebuyChips,
        rebuyCost: form.rebuyCost,
        maxRebuys: form.maxRebuys,
        maxAddons: form.maxAddons,
        blindStructureId: form.blindStructureId || undefined,
      });
      setShowForm(false);
      setForm({ name: '', seriesId: '', clubId: '', startTime: '', buyInCost: 3000, startingStack: 10000, addonChips: 0, addonCost: 0, rebuyChips: 0, rebuyCost: 0, maxRebuys: 0, maxAddons: 0, blindStructureId: '' });
      load();
    } catch {}
  };

  const update = async () => {
    if (!editId) return;
    try {
      const data: UpdateTournamentDto = {
        name: form.name.trim(),
        startTime: form.startTime,
        buyInCost: form.buyInCost,
        startingStack: form.startingStack,
        seriesId: form.seriesId ? form.seriesId : null,
        clubId: form.clubId ? form.clubId : null,
        addonChips: form.addonChips,
        addonCost: form.addonCost,
        rebuyChips: form.rebuyChips,
        rebuyCost: form.rebuyCost,
        maxRebuys: form.maxRebuys,
        maxAddons: form.maxAddons,
        blindStructureId: form.blindStructureId || undefined,
      };
      await tournamentsApi.update(editId, data);
      setEditId(null);
      load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить турнир?')) return;
    try {
      await tournamentsApi.delete(id);
      load();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    }
  };

  const startEdit = (t: Tournament) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      seriesId: t.seriesId ?? '',
      clubId: t.clubId ?? '',
      startTime: t.startTime?.slice(0, 16) ?? '',
      buyInCost: t.buyInCost ?? 0,
      startingStack: t.startingStack ?? 0,
      addonChips: t.addonChips ?? 0,
      addonCost: t.addonCost ?? 0,
      rebuyChips: t.rebuyChips ?? 0,
      rebuyCost: t.rebuyCost ?? 0,
      maxRebuys: t.maxRebuys ?? 0,
      maxAddons: t.maxAddons ?? 0,
      blindStructureId: t.blindStructureId ?? '',
    });
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Турниры</h2>
      <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новый турнир'}
      </button>

      {(showForm || editId) && (
        <div className="glass-card p-4 mb-6 space-y-4 max-w-xl">
          <input placeholder="Название *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <div>
            <label className="text-zinc-400 text-sm">Серия</label>
            <select value={form.seriesId} onChange={(e) => setForm((p) => ({ ...p, seriesId: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">—</option>
              {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Клуб</label>
            <select value={form.clubId} onChange={(e) => setForm((p) => ({ ...p, clubId: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">—</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Начало</label>
            <input type="datetime-local" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div className="flex gap-4">
            <input type="number" placeholder="Бай-ин (₽)" min={0} value={form.buyInCost ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, buyInCost: isNaN(v) ? 0 : Math.max(0, v) })); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <input type="number" placeholder="Стартовый стек" value={form.startingStack || ''} onChange={(e) => setForm((p) => ({ ...p, startingStack: parseInt(e.target.value) || 0 }))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Стоимость ребая (₽)</label>
              <input type="number" min={0} value={form.rebuyCost ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, rebuyCost: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Фишки за ребай</label>
              <input type="number" min={0} value={form.rebuyChips ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, rebuyChips: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Макс. ребаев на игрока</label>
              <input type="number" min={0} value={form.maxRebuys ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, maxRebuys: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" title="0 = без лимита" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Стоимость аддона (₽)</label>
              <input type="number" min={0} value={form.addonCost ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, addonCost: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Фишки за аддон</label>
              <input type="number" min={0} value={form.addonChips ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, addonChips: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Макс. аддонов на игрока</label>
              <input type="number" min={0} value={form.maxAddons ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, maxAddons: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" title="0 = без лимита" />
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Структура блайндов</label>
            <select value={form.blindStructureId} onChange={(e) => setForm((p) => ({ ...p, blindStructureId: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">—</option>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {editId ? <button onClick={update} className="glass-btn px-4 py-2 rounded-xl">Сохранить</button> : <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>}
        </div>
      )}

      <div className="space-y-2">
        {tournaments.map((t) => (
          <div key={t.id} className="flex justify-between items-center glass-card p-3">
            <div>
              <span className="text-white">{t.name}</span>
              <span className="text-zinc-500 text-sm ml-2">{t.startTime?.slice(0, 16)} · {t.status}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(t)} className="text-amber-400 text-sm">Изменить</button>
              <button onClick={() => remove(t.id)} className="text-red-400 text-sm">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSeasons() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const createSeasonal = async () => {
    setLoading(true);
    setMsg('');
    try {
      await leaderboardsApi.createSeasonal();
      setMsg('Сезонный рейтинг создан');
    } catch (e: unknown) {
      setMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };
  const updateMmr = async () => {
    setLoading(true);
    setMsg('');
    try {
      await leaderboardsApi.updateRankMmr();
      setMsg('Рейтинг MMR обновлён');
    } catch (e: unknown) {
      setMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Сезонные рейтинги</h2>
      <p className="text-zinc-400 mb-4">Создание сезонного рейтинга для текущего месяца и обновление рейтинга MMR.</p>
      <div className="flex gap-4">
        <button onClick={createSeasonal} disabled={loading} className="glass-btn px-4 py-2 rounded-xl">
          Создать сезонный рейтинг
        </button>
        <button onClick={updateMmr} disabled={loading} className="glass-btn px-4 py-2 rounded-xl">
          Обновить рейтинг MMR
        </button>
      </div>
      {msg && <p className="mt-4 text-amber-400">{msg}</p>}
    </div>
  );
}

const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  REGULAR: 'Обычный перерыв',
  END_LATE_REG: 'Конец поздней регистрации',
  ADDON: 'Аддонный перерыв',
  END_LATE_REG_AND_ADDON: 'Конец поздней регистрации + аддон',
};

function SettingsBlinds() {
  const [structures, setStructures] = useState<(BlindStructure & { levelsCount?: number })[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [clubId, setClubId] = useState<string>('');
  const [levels, setLevels] = useState<CreateLevelDto[]>([
    { levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 50, durationMinutes: 15, isBreak: false },
  ]);
  const [coefficient, setCoefficient] = useState(2);

  const load = () => {
    Promise.all([
      blindStructuresApi.list(),
      clubsApi.list().then((r) => r.data?.clubs ?? []),
    ])
      .then(([r, c]) => {
        setStructures(r.data?.structures ?? []);
        setClubs(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const lastGameLevel = levels.filter((l) => !l.isBreak).pop();
  const addLevel = () => {
    if (!lastGameLevel) return;
    const sb = lastGameLevel.smallBlind * coefficient;
    const bb = lastGameLevel.bigBlind * coefficient;
    const ante = (lastGameLevel.ante ?? lastGameLevel.bigBlind) * coefficient;
    setLevels((p) => [
      ...p,
      { levelNumber: p.length + 1, smallBlind: sb, bigBlind: bb, ante, durationMinutes: 15, isBreak: false },
    ]);
  };

  const addBreak = (breakType: BreakType) => {
    setLevels((p) => [
      ...p,
      {
        levelNumber: p.length + 1,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        durationMinutes: 5,
        isBreak: true,
        breakName: BREAK_TYPE_LABELS[breakType],
        breakType,
      },
    ]);
  };

  const removeLevel = (i: number) =>
    setLevels((p) => p.filter((_, j) => j !== i).map((l, j) => ({ ...l, levelNumber: j + 1 })));

  const create = async () => {
    if (!name.trim() || levels.length === 0) return;
    const levelsToSend = levels.map((l, i) => ({
      ...l,
      levelNumber: i + 1,
      ante: l.isBreak ? 0 : (l.ante ?? l.bigBlind),
    }));
    try {
      await blindStructuresApi.create({
        name: name.trim(),
        description: desc || undefined,
        clubId: clubId || undefined,
        levels: levelsToSend,
      });
      setShowForm(false);
      setName('');
      setDesc('');
      setClubId('');
      setLevels([{ levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 50, durationMinutes: 15, isBreak: false }]);
      load();
    } catch {}
  };

  const deactivate = async (id: string) => {
    try {
      await blindStructuresApi.deactivate(id);
      load();
    } catch {}
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Структуры блайндов</h2>
      <button onClick={() => setShowForm(!showForm)} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новая структура'}
      </button>

      {showForm && (
        <div className="glass-card p-6 mb-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Название</label>
            <input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Описание</label>
            <input placeholder="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Клуб</label>
            <select value={clubId} onChange={(e) => setClubId(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">Глобальная (все клубы)</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-zinc-400">Уровни</span>
              <button onClick={addLevel} disabled={!lastGameLevel} className="text-amber-400 text-sm glass-btn px-2 py-1 rounded">
                + Уровень (коэф. {coefficient})
              </button>
              <input type="number" min={0.5} max={10} step={0.5} value={coefficient} onChange={(e) => setCoefficient(parseFloat(e.target.value) || 2)} className="w-16 px-2 py-1 rounded bg-white/5 text-white text-sm" title="Коэффициент повышения" />
              <span className="text-zinc-500 text-xs">Коэффициент</span>
              <span className="text-zinc-400 mx-2">|</span>
              <span className="text-zinc-500 text-sm">+ Перерыв:</span>
              {(['REGULAR', 'END_LATE_REG', 'ADDON', 'END_LATE_REG_AND_ADDON'] as BreakType[]).map((bt) => (
                <button key={bt} onClick={() => addBreak(bt)} className="text-emerald-400 text-xs glass-btn px-2 py-1 rounded">
                  {BREAK_TYPE_LABELS[bt]}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {levels.map((l, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center p-2 rounded bg-white/5">
                  {l.isBreak ? (
                    <>
                      <span className="text-zinc-500 text-sm w-8">{i + 1}.</span>
                      <span className="text-amber-300">{l.breakName || BREAK_TYPE_LABELS[(l.breakType || 'REGULAR') as BreakType]}</span>
                      <input type="number" placeholder="Мин" value={l.durationMinutes} onChange={(e) => setLevels((p) => { const n = [...p]; n[i] = { ...n[i], durationMinutes: parseInt(e.target.value) || 5 }; return n; })} className="w-16 px-2 py-1 rounded bg-white/5 text-white text-sm" />
                      <span className="text-zinc-500 text-xs">мин</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500 text-sm w-8">{i + 1}.</span>
                      <input type="number" placeholder="SB" value={l.smallBlind} onChange={(e) => setLevels((p) => { const n = [...p]; n[i] = { ...n[i], smallBlind: parseInt(e.target.value) || 0 }; return n; })} className="w-16 px-2 py-1 rounded bg-white/5 text-white text-sm" title="Малый блайнд" />
                      <input type="number" placeholder="BB" value={l.bigBlind} onChange={(e) => setLevels((p) => { const n = [...p]; n[i] = { ...n[i], bigBlind: parseInt(e.target.value) || 0 }; return n; })} className="w-16 px-2 py-1 rounded bg-white/5 text-white text-sm" title="Большой блайнд" />
                      <input type="number" placeholder="Анте" value={l.ante ?? l.bigBlind} onChange={(e) => setLevels((p) => { const n = [...p]; const v = parseInt(e.target.value, 10); n[i] = { ...n[i], ante: isNaN(v) ? (n[i].bigBlind ?? 0) : v }; return n; })} className="w-16 px-2 py-1 rounded bg-white/5 text-white text-sm" title="Анте" />
                      <input type="number" placeholder="Мин" value={l.durationMinutes} onChange={(e) => setLevels((p) => { const n = [...p]; n[i] = { ...n[i], durationMinutes: parseInt(e.target.value) || 15 }; return n; })} className="w-14 px-2 py-1 rounded bg-white/5 text-white text-sm" title="Время уровня" />
                      <span className="text-zinc-500 text-xs">мин</span>
                    </>
                  )}
                  <button onClick={() => removeLevel(i)} className="text-red-400 text-sm ml-auto">✕</button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>
        </div>
      )}

      <div className="space-y-2">
        {structures.map((s) => (
          <div key={s.id} className="flex justify-between items-center glass-card p-3">
            <span className="text-white">{s.name}</span>
            <button onClick={() => deactivate(s.id)} className="text-red-400 text-sm">Деактивировать</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsClubs() {
  const { refreshClubs } = useClub();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [tableCount, setTableCount] = useState(5);

  const load = () => clubsApi.list().then((r) => setClubs(r.data?.clubs ?? [])).catch(() => setClubs([])).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim() || tableCount < 1) return;
    try {
      await clubsApi.create({ name: name.trim(), description: desc || undefined, address: address || undefined, phone: phone || undefined, tableCount });
      setShowForm(false);
      setName('');
      setDesc('');
      setAddress('');
      setPhone('');
      setTableCount(5);
      load();
      refreshClubs();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить клуб?')) return;
    try {
      await clubsApi.delete(id);
      load();
      refreshClubs();
    } catch {}
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Клубы</h2>
      <button onClick={() => setShowForm(!showForm)} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новый клуб'}
      </button>

      {showForm && (
        <div className="glass-card p-4 mb-6 space-y-4">
          <input placeholder="Название *" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input type="number" placeholder="Кол-во столов *" value={tableCount} onChange={(e) => setTableCount(parseInt(e.target.value) || 1)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>
        </div>
      )}

      <div className="space-y-2">
        {clubs.map((c) => (
          <div key={c.id} className="flex justify-between items-center glass-card p-3">
            <div>
              <span className="text-white">{c.name}</span>
              <span className="text-zinc-500 text-sm ml-2">({c.tableCount} столов)</span>
            </div>
            <button onClick={() => remove(c.id)} className="text-red-400 text-sm">Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState(false);
  const [itemForm, setItemForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(100);
  const [itemCategoryId, setItemCategoryId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([menuApi.getCategories(), menuApi.getItems()]);
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      setCategories(cats);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      if (cats.length && !itemCategoryId) setItemCategoryId(cats[0].id);
    } catch {
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createCat = async () => {
    if (!catName.trim()) return;
    try {
      await menuApi.createCategory({ name: catName.trim() });
      setCatForm(false);
      setCatName('');
      load();
    } catch {}
  };

  const createItem = async () => {
    if (!itemName.trim() || !itemCategoryId) return;
    try {
      await menuApi.createItem({ name: itemName.trim(), price: itemPrice * 100, categoryId: itemCategoryId });
      setItemForm(false);
      setItemName('');
      setItemPrice(100);
      load();
    } catch {}
  };

  const delCat = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await menuApi.deleteCategory(id);
      load();
    } catch {}
  };

  const delItem = async (id: string) => {
    if (!confirm('Удалить позицию?')) return;
    try {
      await menuApi.deleteItem(id);
      load();
    } catch {}
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Меню</h2>

      <div className="mb-6">
        <h3 className="text-white font-medium mb-2">Категории</h3>
        <button onClick={() => setCatForm(!catForm)} className="glass-btn px-4 py-2 rounded-xl mb-2">
          {catForm ? 'Отмена' : '+ Категория'}
        </button>
        {catForm && (
          <div className="flex gap-2 mt-2">
            <input placeholder="Название" value={catName} onChange={(e) => setCatName(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <button onClick={createCat} className="glass-btn px-4 py-2 rounded-xl">Создать</button>
          </div>
        )}
        <div className="space-y-1 mt-2">
          {categories.map((c) => (
            <div key={c.id} className="flex justify-between items-center glass-card p-2">
              <span className="text-zinc-300">{c.name}</span>
              <button onClick={() => delCat(c.id)} className="text-red-400 text-sm">Удалить</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-medium mb-2">Позиции</h3>
        <button onClick={() => setItemForm(!itemForm)} className="glass-btn px-4 py-2 rounded-xl mb-2">
          {itemForm ? 'Отмена' : '+ Позиция'}
        </button>
        {itemForm && (
          <div className="flex flex-wrap gap-2 mt-2">
            <input placeholder="Название" value={itemName} onChange={(e) => setItemName(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <input type="number" placeholder="Цена (руб)" value={itemPrice} onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)} className="w-24 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <select value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={createItem} className="glass-btn px-4 py-2 rounded-xl">Создать</button>
          </div>
        )}
        <div className="space-y-1 mt-2">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between items-center glass-card p-2">
              <span className="text-zinc-300">{i.name} — {(i.price / 100).toFixed(0)} ₽</span>
              <button onClick={() => delItem(i.id)} className="text-red-400 text-sm">Удалить</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTV() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Настройки версии для TV</h2>
      <p className="text-zinc-400 mb-4">Настройка внешнего вида отображения на TV: фоны рейтингов, цветовая схема. API для сохранения настроек планируется.</p>
      <p className="text-zinc-500 text-sm">Страница TV: <a href="/tv" className="text-amber-400">/tv</a></p>
    </div>
  );
}
