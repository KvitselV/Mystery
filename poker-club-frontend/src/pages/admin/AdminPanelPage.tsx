import { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfMonth, startOfWeek, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  blindStructuresApi,
  clubsApi,
  menuApi,
  leaderboardsApi,
  tournamentSeriesApi,
  tournamentsApi,
  authApi,
  achievementsApi,
  type BlindStructure,
  type Club,
  type ClubSchedule,
  type MenuCategory,
  type MenuItem,
  type CreateLevelDto,
  type BreakType,
  type TournamentSeries,
  type Tournament,
  type UpdateTournamentDto,
  type User,
  type AchievementTypeDto,
  type AchievementInstanceDto,
} from '../../api';
import { useClub } from '../../contexts/ClubContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminReportModal } from '../../components/AdminReportModal';
import { PlayerResultsModal } from '../../components/PlayerResultsModal';
import AdminDataPanel from './AdminDataPanel';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function AdminPanelPage() {
  const { refreshClubs } = useClub();
  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-1">
        <NavLink to="/admin" end className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Обзор
        </NavLink>
        <NavLink to="/admin/clubs" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Клубы
        </NavLink>
        <NavLink to="/admin/series" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Турнирные серии
        </NavLink>
        <NavLink to="/admin/tournaments" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Турниры
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Финансовые отчёты
        </NavLink>
        <NavLink to="/admin/blinds" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Структуры блайндов
        </NavLink>
        <NavLink to="/admin/menu" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Меню
        </NavLink>
        <NavLink to="/admin/seasons" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Рейтинги и сезоны
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Пользователи
        </NavLink>
        <NavLink to="/admin/tv" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          TV
        </NavLink>
        <NavLink to="/admin/achievements" className={({ isActive }) => `block px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`}>
          Достижения
        </NavLink>
        <div className="mt-6 pt-4 border-t border-white/10">
          <NavLink
            to="/admin/data"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl ${isActive ? 'glass-btn' : 'text-zinc-400 hover:text-white'}`
            }
            title="Управление данными"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Данные
          </NavLink>
        </div>
      </nav>
      <div className="flex-1 min-w-0 glass-card p-6 overflow-x-auto">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/clubs" element={<AdminClubs onRefresh={refreshClubs} />} />
          <Route path="/series" element={<AdminSeries />} />
          <Route path="/tournaments" element={<AdminTournaments />} />
          <Route path="/reports" element={<AdminFinancialReports />} />
          <Route path="/blinds" element={<AdminBlinds />} />
          <Route path="/menu" element={<AdminMenu />} />
          <Route path="/seasons" element={<AdminSeasons />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/tv" element={<AdminTV />} />
          <Route path="/achievements" element={<AdminAchievements />} />
          <Route path="/data" element={<AdminDataPanel />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminHome() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Админ панель</h2>
      <p className="text-zinc-400">Выберите раздел в меню для управления данными системы.</p>
    </div>
  );
}

function AdminClubs({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [schedulesClubId, setSchedulesClubId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', desc: '', address: '', phone: '', tableCount: 5 });

  const load = () => clubsApi.list().then((r) => setClubs(r.data?.clubs ?? [])).catch(() => setClubs([])).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || form.tableCount < 1) return;
    try {
      await clubsApi.create({ name: form.name.trim(), description: form.desc || undefined, address: form.address || undefined, phone: form.phone || undefined, tableCount: form.tableCount });
      setShowForm(false);
      setForm({ name: '', desc: '', address: '', phone: '', tableCount: 5 });
      load();
      onRefresh();
    } catch {}
  };

  const update = async () => {
    if (!editId) return;
    try {
      await clubsApi.update(editId, { name: form.name.trim(), description: form.desc || undefined, address: form.address || undefined, phone: form.phone || undefined });
      setEditId(null);
      load();
      onRefresh();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить клуб?')) return;
    try {
      await clubsApi.delete(id);
      load();
      onRefresh();
    } catch {}
  };

  const startEdit = (c: Club) => {
    setEditId(c.id);
    setForm({ name: c.name, desc: c.description ?? '', address: c.address ?? '', phone: c.phone ?? '', tableCount: c.tableCount ?? 5 });
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Клубы</h2>
      <button onClick={() => { setShowForm(!showForm); setEditId(null); setSchedulesClubId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новый клуб'}
      </button>

      {(showForm || editId) && (
        <div className="glass-card p-4 mb-6 space-y-4">
          <input placeholder="Название *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Описание" value={form.desc} onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Адрес" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          {!editId && (
            <input type="number" placeholder="Кол-во столов *" value={form.tableCount} onChange={(e) => setForm((p) => ({ ...p, tableCount: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          )}
          {editId ? <button onClick={update} className="glass-btn px-4 py-2 rounded-xl">Сохранить</button> : <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>}
        </div>
      )}

      {schedulesClubId && <AdminClubSchedules clubId={schedulesClubId} onClose={() => setSchedulesClubId(null)} clubName={clubs.find((c) => c.id === schedulesClubId)?.name ?? ''} />}

      <div className="space-y-2">
        {clubs.map((c) => (
          <div key={c.id} className="flex justify-between items-center glass-card p-3">
            <div>
              <span className="text-white">{c.name}</span>
              <span className="text-zinc-500 text-sm ml-2">({c.tableCount} столов)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSchedulesClubId(c.id)} className="text-zinc-300 text-sm">Расписание</button>
              <button onClick={() => startEdit(c)} className="text-amber-400 text-sm">Изменить</button>
              <button onClick={() => remove(c.id)} className="text-red-400 text-sm">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminClubSchedules({ clubId, onClose, clubName }: { clubId: string; onClose: () => void; clubName: string }) {
  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '18:00', endTime: '23:00', eventType: '', description: '' });

  const load = () => clubsApi.getSchedules(clubId).then((r) => setSchedules(r.data?.schedules ?? [])).catch(() => setSchedules([])).finally(() => setLoading(false));

  useEffect(() => { load(); }, [clubId]);

  const toTime = (t: string) => (t && t.length === 5 ? `${t}:00` : t || '18:00:00');

  const create = async () => {
    try {
      await clubsApi.addSchedule(clubId, { dayOfWeek: form.dayOfWeek, startTime: toTime(form.startTime), endTime: toTime(form.endTime), eventType: form.eventType || undefined, description: form.description || undefined });
      setShowForm(false);
      setForm({ dayOfWeek: 1, startTime: '18:00', endTime: '23:00', eventType: '', description: '' });
      load();
    } catch {}
  };

  const update = async () => {
    if (!editId) return;
    try {
      await clubsApi.updateSchedule(clubId, editId, { dayOfWeek: form.dayOfWeek, startTime: toTime(form.startTime), endTime: toTime(form.endTime), eventType: form.eventType || undefined, description: form.description || undefined });
      setEditId(null);
      load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить расписание?')) return;
    try {
      await clubsApi.deleteSchedule(clubId, id);
      load();
    } catch {}
  };

  const startEdit = (s: ClubSchedule) => {
    setEditId(s.id);
    const fmt = (t: string | undefined) => (t ? (t.length > 5 ? t.slice(0, 5) : t) : '18:00');
    setForm({ dayOfWeek: s.dayOfWeek, startTime: fmt(s.startTime), endTime: fmt(s.endTime), eventType: s.eventType ?? '', description: s.description ?? '' });
  };

  return (
    <div className="glass-card p-4 mb-6 border border-amber-500/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">Расписание: {clubName}</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕ Закрыть</button>
      </div>
      <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-4 text-sm">
        {showForm ? 'Отмена' : '+ Добавить'}
      </button>
      {(showForm || editId) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={form.dayOfWeek} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: parseInt(e.target.value) }))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
          </select>
          <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm" />
          <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm" />
          <input placeholder="Событие" value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm w-32" />
          {editId ? <button onClick={update} className="glass-btn px-3 py-2 rounded-xl text-sm">Сохранить</button> : <button onClick={create} className="glass-btn px-3 py-2 rounded-xl text-sm">Добавить</button>}
        </div>
      )}
      {loading ? <p className="text-zinc-500 text-sm">Загрузка...</p> : (
        <div className="space-y-1">
          {schedules.map((s) => (
            <div key={s.id} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-zinc-300 text-sm">{DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime} {s.eventType && `· ${s.eventType}`}</span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="text-amber-400 text-xs">Изменить</button>
                <button onClick={() => remove(s.id)} className="text-red-400 text-xs">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSeries() {
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [structures, setStructures] = useState<BlindStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [clubId, setClubId] = useState('');
  const [defaultStartTime, setDefaultStartTime] = useState('19:00');
  const [defaultBuyIn, setDefaultBuyIn] = useState(3000);
  const [defaultStartingStack, setDefaultStartingStack] = useState(10000);
  const [defaultBlindStructureId, setDefaultBlindStructureId] = useState('');
  const [defaultAddonChips, setDefaultAddonChips] = useState(0);
  const [defaultAddonCost, setDefaultAddonCost] = useState(0);
  const [defaultRebuyChips, setDefaultRebuyChips] = useState(0);
  const [defaultRebuyCost, setDefaultRebuyCost] = useState(0);
  const [defaultMaxRebuys, setDefaultMaxRebuys] = useState(0);
  const [defaultMaxAddons, setDefaultMaxAddons] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, bRes] = await Promise.all([tournamentSeriesApi.list(), clubsApi.list(), blindStructuresApi.list()]);
      setSeries(sRes.data?.series ?? []);
      setClubs(cRes.data?.clubs ?? []);
      setStructures(bRes.data?.structures ?? []);
    } catch {
      setSeries([]);
      setClubs([]);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleDay = (d: number) => setDaysOfWeek((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort((a, b) => a - b)));

  const create = async () => {
    if (!name.trim() || !periodStart || !periodEnd || !clubId) return;
    try {
      await tournamentSeriesApi.create({
        name: name.trim(),
        periodStart,
        periodEnd,
        daysOfWeek,
        clubId,
        defaultStartTime,
        defaultBuyIn,
        defaultStartingStack,
        defaultBlindStructureId: defaultBlindStructureId || undefined,
        defaultAddonChips,
        defaultAddonCost,
        defaultRebuyChips,
        defaultRebuyCost,
        defaultMaxRebuys,
        defaultMaxAddons,
      });
      setShowForm(false);
      setName('');
      setPeriodStart('');
      setPeriodEnd('');
      setDaysOfWeek([1, 2, 3, 4, 5, 6]);
      setClubId('');
      setDefaultStartTime('19:00');
      setDefaultBuyIn(3000);
      setDefaultStartingStack(10000);
      setDefaultBlindStructureId('');
      setDefaultAddonChips(0);
      setDefaultAddonCost(0);
      setDefaultRebuyChips(0);
      setDefaultRebuyCost(0);
      setDefaultMaxRebuys(0);
      setDefaultMaxAddons(0);
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
    const days = s.daysOfWeek ? (typeof s.daysOfWeek === 'string' ? s.daysOfWeek.split(',').map(Number) : s.daysOfWeek) : [1, 2, 3, 4, 5, 6];
    setDaysOfWeek(days);
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Турнирные серии</h2>
      <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Новая серия'}
      </button>

      {(showForm || editId) && (
        <div className="glass-card p-4 mb-6 space-y-4">
          <input placeholder="Название серии *" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          {!editId && (
            <>
              <div>
                <label className="text-zinc-400 text-sm">Клуб *</label>
                <select value={clubId} onChange={(e) => setClubId(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" required>
                  <option value="">— Выберите клуб —</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <p className="text-zinc-500 text-sm">Турниры создаются автоматически по дням недели от даты начала до даты финала.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <div>
                  <label className="text-zinc-400 text-sm">Ребай: фишки</label>
                  <input type="number" value={defaultRebuyChips || ''} onChange={(e) => setDefaultRebuyChips(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">Ребай: стоимость (₽)</label>
                  <input type="number" value={defaultRebuyCost || ''} onChange={(e) => setDefaultRebuyCost(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">Макс. ребаев на игрока</label>
                  <input type="number" value={defaultMaxRebuys || ''} onChange={(e) => setDefaultMaxRebuys(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0 = ∞" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">Аддон: фишки</label>
                  <input type="number" value={defaultAddonChips || ''} onChange={(e) => setDefaultAddonChips(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">Аддон: стоимость (₽)</label>
                  <input type="number" value={defaultAddonCost || ''} onChange={(e) => setDefaultAddonCost(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">Макс. аддонов на игрока</label>
                  <input type="number" value={defaultMaxAddons || ''} onChange={(e) => setDefaultMaxAddons(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="0 = ∞" />
                </div>
              </div>
            </>
          )}
          <div className="flex gap-4">
            <div><label className="text-zinc-400 text-sm">Дата начала</label><input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" /></div>
            <div><label className="text-zinc-400 text-sm">Дата финала</label><input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" /></div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Дни недели</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-1 rounded-lg text-sm ${daysOfWeek.includes(d) ? 'glass-btn' : 'bg-white/5 text-zinc-500'}`}>{DAY_NAMES[d]}</button>
              ))}
            </div>
          </div>
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

function AdminFinancialReports() {
  const { selectedClub } = useClub();
  const { user, isAdmin, isController } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<Tournament | null>(null);
  const [resultsTarget, setResultsTarget] = useState<Tournament | null>(null);

  const clubId = isController ? user?.managedClubId : selectedClub?.id;

  useEffect(() => {
    tournamentsApi.list({ clubId, limit: 200 })
      .then((r) => {
        const list = r.data?.tournaments ?? [];
        const archived = list.filter((t) => t.status === 'ARCHIVED' || t.status === 'FINISHED');
        setTournaments(archived.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      })
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, [clubId]);

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Финансовые отчёты</h2>
      <p className="text-zinc-400 text-sm mb-4">Отчёты по завершённым турнирам. Выберите турнир и заполните или отредактируйте данные.</p>
      {tournaments.length === 0 ? (
        <p className="text-zinc-500">Нет завершённых турниров</p>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex justify-between items-center glass-card p-4">
              <div>
                <span className="text-white font-medium">{t.name}</span>
                <span className="text-zinc-500 text-sm ml-2">
                  {new Date(t.startTime).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReportTarget(t)} className="glass-btn px-4 py-2 rounded-xl text-sm">
                  Открыть отчёт
                </button>
                <button onClick={() => setResultsTarget(t)} className="glass-btn px-4 py-2 rounded-xl text-sm">
                  Результаты
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {resultsTarget && (
        <PlayerResultsModal tournament={resultsTarget} onClose={() => setResultsTarget(null)} />
      )}
      {reportTarget && (
        <AdminReportModal
          tournament={reportTarget}
          onClose={() => setReportTarget(null)}
          onSaved={() => {
            setReportTarget(null);
            tournamentsApi.list({ clubId, limit: 200 })
              .then((r) => {
                const list = r.data?.tournaments ?? [];
                const archived = list.filter((t) => t.status === 'ARCHIVED' || t.status === 'FINISHED');
                setTournaments(archived.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
              });
          }}
        />
      )}
    </div>
  );
}

function tournamentNameOnly(name: string): string {
  return name.replace(/\s*-\s*\d{1,2}\.\d{1,2}(\.\d{4})?$/, '').trim();
}

function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [scheduleMonth, setScheduleMonth] = useState(() => startOfMonth(new Date()));
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
        tournamentsApi.list({ limit: 200 }),
        tournamentSeriesApi.list(),
        clubsApi.list(),
        blindStructuresApi.list(),
      ]);
      setTournaments(tRes.data?.tournaments ?? []);
      setSeries(sRes.data?.series ?? []);
      setClubs(cRes.data?.clubs ?? []);
      setStructures(bRes.data?.structures ?? []);
    } catch {
      setTournaments([]);
      setSeries([]);
      setClubs([]);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.startTime || form.buyInCost < 0 || !form.startingStack) {
      alert('Заполните обязательные поля: название, начало, стартовый стек. Бай-ин может быть 0.');
      return;
    }
    try {
      await tournamentsApi.create({
        name: form.name.trim(),
        startTime: form.startTime,
        buyInCost: form.buyInCost,
        startingStack: form.startingStack,
        seriesId: form.seriesId || undefined,
        clubId: form.clubId || undefined,
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
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка создания турнира';
      alert(msg);
    }
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
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка обновления турнира';
      alert(msg);
    }
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="text-zinc-400 text-sm">Начало</label>
            <input type="datetime-local" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div className="flex flex-wrap gap-4">
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
              <label className="text-zinc-400 text-sm block mb-1">Стоимость аддона (₽)</label>
              <input type="number" min={0} value={form.addonCost ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, addonCost: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Фишки за аддон</label>
              <input type="number" min={0} value={form.addonChips ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, addonChips: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Макс. ребаев на игрока</label>
              <input type="number" min={0} value={form.maxRebuys ?? ''} onChange={(e) => { const v = parseInt(e.target.value, 10); setForm((p) => ({ ...p, maxRebuys: isNaN(v) ? 0 : Math.max(0, v) })); }} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" title="0 = без лимита" />
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

      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {format(scheduleMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setScheduleMonth(subMonths(scheduleMonth, 1))}
              className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10"
              title="Предыдущий месяц"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={() => setScheduleMonth(addMonths(scheduleMonth, 1))}
              className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10"
              title="Следующий месяц"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div key={d} className="py-2 text-center text-zinc-400 text-sm font-medium">
              {d}
            </div>
          ))}
          {(() => {
            const monthStart = startOfMonth(scheduleMonth);
            const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
            const cells: { date: Date }[] = [];
            for (let i = 0; i < 42; i++) cells.push({ date: addDays(calendarStart, i) });
            const getTournamentsForDate = (d: Date) =>
              tournaments.filter((t) => new Date(t.startTime).toDateString() === d.toDateString());
            return cells.map(({ date }) => {
              const isCurrentMonth = isSameMonth(date, scheduleMonth);
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
                      <div key={t.id} className="glass-card p-2 rounded-lg text-left">
                        <div className="text-white font-medium text-sm">{tournamentNameOnly(t.name)}</div>
                        <div className="text-zinc-500 text-xs">{format(new Date(t.startTime), 'HH:mm')} · {t.status}</div>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => startEdit(t)} className="text-amber-400 text-xs hover:underline">Изменить</button>
                          <button onClick={() => remove(t.id)} className="text-red-400 text-xs hover:underline">Удалить</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  REGULAR: 'Обычный перерыв',
  END_LATE_REG: 'Конец поздней регистрации',
  ADDON: 'Аддонный перерыв',
  END_LATE_REG_AND_ADDON: 'Конец поздней регистрации + аддон',
};

function AdminBlinds() {
  const [structures, setStructures] = useState<(BlindStructure & { levelsCount?: number })[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [clubId, setClubId] = useState('');
  const [levels, setLevels] = useState<CreateLevelDto[]>([
    { levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 50, durationMinutes: 15, isBreak: false },
  ]);
  const [coefficient, setCoefficient] = useState(2);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([blindStructuresApi.list(), clubsApi.list()]);
      setStructures(bRes.data?.structures ?? []);
      setClubs((cRes.data?.clubs ?? []) as Club[]);
    } catch {
      setStructures([]);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      await blindStructuresApi.create({ name: name.trim(), description: desc || undefined, clubId: clubId || undefined, levels: levelsToSend });
      setShowForm(false);
      setName('');
      setDesc('');
      setClubId('');
      setLevels([{ levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 50, durationMinutes: 15, isBreak: false }]);
      load();
    } catch {}
  };

  const deactivate = async (id: string) => {
    if (!confirm('Деактивировать структуру?')) return;
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
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

function AdminMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState(false);
  const [itemForm, setItemForm] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [itemEditId, setItemEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(100);
  const [itemCategoryId, setItemCategoryId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([menuApi.getCategoriesList(), menuApi.getItems()]);
      const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data as { categories?: MenuCategory[] })?.categories ?? [];
      setCategories(cats);
      const rawItems = Array.isArray(itemRes.data) ? itemRes.data : (itemRes.data as { items?: MenuItem[] })?.items ?? [];
      setItems(rawItems);
      if (cats.length && !itemCategoryId) setItemCategoryId(cats[0].id);
    } catch {
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createCat = async () => {
    if (!catName.trim()) return;
    try {
      await menuApi.createCategory({ name: catName.trim() });
      setCatForm(false);
      setCatName('');
      load();
    } catch {}
  };

  const updateCat = async () => {
    if (!catEditId || !catName.trim()) return;
    try {
      await menuApi.updateCategory(catEditId, { name: catName.trim() });
      setCatEditId(null);
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

  const updateItem = async () => {
    if (!itemEditId || !itemName.trim() || !itemCategoryId) return;
    try {
      await menuApi.updateItem(itemEditId, { name: itemName.trim(), price: itemPrice * 100, categoryId: itemCategoryId });
      setItemEditId(null);
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

  const startEditCat = (c: MenuCategory) => {
    setCatEditId(c.id);
    setCatName(c.name);
    setCatForm(false);
  };

  const startEditItem = (i: MenuItem) => {
    setItemEditId(i.id);
    setItemName(i.name);
    setItemPrice(Math.round(i.price / 100));
    setItemCategoryId(i.categoryId ?? categories[0]?.id ?? '');
    setItemForm(false);
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Меню</h2>

      <div className="mb-6">
        <h3 className="text-white font-medium mb-2">Категории</h3>
        <button onClick={() => { setCatForm(!catForm); setCatEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-2">
          {catForm ? 'Отмена' : '+ Категория'}
        </button>
        {(catForm || catEditId) && (
          <div className="flex gap-2 mt-2">
            <input placeholder="Название" value={catName} onChange={(e) => setCatName(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            {catEditId ? <button onClick={updateCat} className="glass-btn px-4 py-2 rounded-xl">Сохранить</button> : <button onClick={createCat} className="glass-btn px-4 py-2 rounded-xl">Создать</button>}
          </div>
        )}
        <div className="space-y-1 mt-2">
          {categories.map((c) => (
            <div key={c.id} className="flex justify-between items-center glass-card p-2">
              <span className="text-zinc-300">{c.name}</span>
              <div className="flex gap-2">
                <button onClick={() => startEditCat(c)} className="text-amber-400 text-sm">Изменить</button>
                <button onClick={() => delCat(c.id)} className="text-red-400 text-sm">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-medium mb-2">Позиции</h3>
        <button onClick={() => { setItemForm(!itemForm); setItemEditId(null); }} className="glass-btn px-4 py-2 rounded-xl mb-2">
          {itemForm ? 'Отмена' : '+ Позиция'}
        </button>
        {(itemForm || itemEditId) && (
          <div className="flex flex-wrap gap-2 mt-2">
            <input placeholder="Название" value={itemName} onChange={(e) => setItemName(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <input type="number" placeholder="Цена (руб)" value={itemPrice} onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)} className="w-24 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <select value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {itemEditId ? <button onClick={updateItem} className="glass-btn px-4 py-2 rounded-xl">Сохранить</button> : <button onClick={createItem} className="glass-btn px-4 py-2 rounded-xl">Создать</button>}
          </div>
        )}
        <div className="space-y-1 mt-2">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between items-center glass-card p-2">
              <span className="text-zinc-300">{i.name} — {(i.price / 100).toFixed(0)} ₽</span>
              <div className="flex gap-2">
                <button onClick={() => startEditItem(i)} className="text-amber-400 text-sm">Изменить</button>
                <button onClick={() => delItem(i.id)} className="text-red-400 text-sm">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSeasons() {
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
      <h2 className="text-lg font-bold text-white mb-4">Рейтинги и сезоны</h2>
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

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [promoteClubId, setPromoteClubId] = useState('');

  const loadUsers = async () => {
    try {
      const res = await authApi.getUsers();
      setUsers(res.data?.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    clubsApi.list().then((r) => setClubs(r.data?.clubs ?? [])).catch(() => setClubs([]));
    loadUsers();
  }, []);

  const assignController = async (userId: string, clubId: string) => {
    if (!clubId) return;
    setAssigning(userId);
    try {
      await authApi.assignControllerToClub(userId, clubId);
      loadUsers();
    } catch {}
    setAssigning(null);
  };

  const promoteToController = async (userId: string, clubId: string) => {
    if (!clubId) return;
    setAssigning(userId);
    try {
      await authApi.promoteToController(userId, clubId);
      loadUsers();
    } catch {}
    setAssigning(null);
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Пользователи</h2>
      <p className="text-zinc-400 mb-4">Назначение контролёров клубам и повышение игроков до контролёров.</p>
      {users.length === 0 ? (
        <p className="text-zinc-500">Нет пользователей.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex justify-between items-center glass-card p-3">
              <div>
                <span className="text-white">{u.name}</span>
                <span className="text-zinc-500 text-sm ml-2">{u.phone}</span>
                <span className="text-amber-400 text-sm ml-2">{u.role}</span>
                {u.managedClub && <span className="text-zinc-400 text-sm ml-2">→ {u.managedClub.name}</span>}
              </div>
              {u.role === 'PLAYER' && (
                <div className="flex gap-2 items-center">
                  <select value={promoteClubId} onChange={(e) => setPromoteClubId(e.target.value)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    <option value="">Клуб</option>
                    {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => promoteToController(u.id, promoteClubId)} disabled={!promoteClubId || assigning === u.id} className="text-amber-400 text-sm">
                    Сделать контролёром
                  </button>
                </div>
              )}
              {u.role === 'CONTROLLER' && !u.managedClubId && (
                <div className="flex gap-2 items-center">
                  <select value={promoteClubId} onChange={(e) => setPromoteClubId(e.target.value)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    <option value="">Клуб</option>
                    {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => assignController(u.id, promoteClubId)} disabled={!promoteClubId || assigning === u.id} className="text-amber-400 text-sm">
                    Назначить клуб
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ACHIEVEMENT_STAT_TYPES = [
  { value: 'TOURNAMENTS_PLAYED', label: 'Турниров сыграно' },
  { value: 'WINS', label: 'Побед' },
  { value: 'CONSECUTIVE_WINS', label: 'Побед подряд' },
  { value: 'SERIES_WINS', label: 'Побед в серии' },
  { value: 'FINAL_TABLE', label: 'Финальных столов' },
  { value: 'ITM_STREAK', label: 'Финишей в призах подряд' },
];

function AdminAchievements() {
  const [types, setTypes] = useState<AchievementTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    conditionDescription: '',
    iconUrl: '' as string,
    statisticType: '',
    targetValue: 0,
  });

  const load = () => {
    setLoading(true);
    achievementsApi.getTypes()
      .then((r) => setTypes(r.data ?? []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.description.trim()) return;
    try {
      await achievementsApi.createType({
        name: form.name.trim(),
        description: form.description.trim(),
        conditionDescription: form.conditionDescription.trim() || form.description.trim(),
        iconUrl: form.iconUrl || undefined,
        statisticType: form.statisticType || undefined,
        targetValue: form.targetValue || undefined,
      });
      setShowForm(false);
      setForm({ name: '', description: '', conditionDescription: '', iconUrl: '', statisticType: '', targetValue: 0 });
      setIconPreview(null);
      load();
    } catch {}
  };

  const seed = async () => {
    try {
      await achievementsApi.seed();
      load();
    } catch {}
  };

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Создание достижений</h2>
      <p className="text-zinc-400 text-sm mb-4">Только администратор может создавать достижения. Выберите иконку, условие и статистику.</p>
      <button onClick={() => setShowForm(!showForm)} className="glass-btn px-4 py-2 rounded-xl mb-4">
        {showForm ? 'Отмена' : '+ Создать достижение'}
      </button>

      {showForm && (
        <div className="glass-card p-6 mb-6 space-y-4 max-w-xl">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Название *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Выиграть 2 раза подряд" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Описание *</label>
            <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Выиграть турнир 2 раза подряд" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Условие (подсказка при наведении)</label>
            <input value={form.conditionDescription} onChange={(e) => setForm((p) => ({ ...p, conditionDescription: e.target.value }))} placeholder="Выиграть 2 турнира подряд" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Иконка (изображение)</label>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || !file.type.startsWith('image/')) return;
                if (file.size > 200 * 1024) {
                  alert('Размер изображения не более 200 КБ');
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  setForm((p) => ({ ...p, iconUrl: dataUrl }));
                  setIconPreview(dataUrl);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 overflow-hidden shrink-0"
              >
                {iconPreview ? (
                  <img src={iconPreview} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-zinc-500 text-sm">+ Загрузить</span>
                )}
              </button>
              {iconPreview && (
                <button
                  type="button"
                  onClick={() => { setForm((p) => ({ ...p, iconUrl: '' })); setIconPreview(null); }}
                  className="text-zinc-400 text-sm hover:text-white"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Статистика</label>
              <select value={form.statisticType} onChange={(e) => setForm((p) => ({ ...p, statisticType: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
                <option value="">— Не задана —</option>
                {ACHIEVEMENT_STAT_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Целевое значение</label>
              <input type="number" min={0} value={form.targetValue || ''} onChange={(e) => setForm((p) => ({ ...p, targetValue: parseInt(e.target.value) || 0 }))} placeholder="2" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
          </div>
          <button onClick={create} className="glass-btn px-4 py-2 rounded-xl">Создать</button>
        </div>
      )}

      <button onClick={seed} className="glass-btn px-4 py-2 rounded-xl mb-4 text-sm">Инициализировать стандартные достижения</button>
      <h3 className="text-white font-medium mb-2">Типы достижений</h3>
      <div className="space-y-2">
        {types.map((t) => (
          <div key={t.id} className="flex items-center gap-4 glass-card p-3">
            {t.iconUrl ? (
              <img src={t.iconUrl} alt="" className="w-10 h-10 object-contain rounded" />
            ) : (
              <span className="text-2xl">{t.icon ?? '🏅'}</span>
            )}
            <div>
              <span className="text-white">{t.name}</span>
              <span className="text-zinc-500 text-sm ml-2">{t.description}</span>
              {t.statisticType && <span className="text-zinc-400 text-xs ml-2">({t.statisticType} ≥ {t.targetValue})</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-sm mt-4">Отзыв достижений у игроков — через раздел «Данные», таблица achievementInstances.</p>
    </div>
  );
}

function AdminTV() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Настройки TV</h2>
      <p className="text-zinc-400 mb-4">Настройка отображения на TV. API для сохранения настроек планируется.</p>
      <p className="text-zinc-500 text-sm">Страница TV: <a href="/tv" className="text-amber-400">/tv</a></p>
    </div>
  );
}
