import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { adminDataApi } from '../../api';

const EDITABLE_TABLES = [
  'users',
  'clubs',
  'clubSchedules',
  'tournaments',
  'tournamentSeries',
  'tournamentRegistrations',
  'menuCategories',
  'menuItems',
  'orders',
  'playerBills',
  'tournamentAdminReports',
  'rewards',
] as const;

const EDITABLE_FIELDS: Record<string, string[]> = {
  users: ['role', 'isActive', 'managedClubId'],
  clubs: ['name', 'description', 'address', 'phone', 'tableCount', 'isActive'],
  clubSchedules: ['dayOfWeek', 'startTime', 'endTime', 'eventType', 'description'],
  tournaments: ['name', 'status', 'startTime', 'buyInCost', 'startingStack', 'addonChips', 'addonCost', 'rebuyChips', 'rebuyCost', 'maxRebuys', 'maxAddons', 'clubId', 'seriesId', 'blindStructureId'],
  tournamentSeries: ['name', 'periodStart', 'periodEnd', 'daysOfWeek'],
  tournamentRegistrations: ['isArrived', 'isActive', 'currentStack'],
  menuCategories: ['name'],
  menuItems: ['name', 'price', 'categoryId'],
  orders: ['status'],
  playerBills: ['status'],
  tournamentAdminReports: ['attendanceCount', 'cashRevenue', 'nonCashRevenue', 'expenses'],
  rewards: ['name', 'description', 'isActive'],
};

const TABLE_LABELS: Record<string, string> = {
  users: 'Пользователи',
  clubs: 'Клубы',
  clubSchedules: 'Расписание клубов',
  clubTables: 'Столы клубов',
  playerProfiles: 'Профили игроков',
  playerBalances: 'Балансы игроков',
  tournaments: 'Турниры',
  tournamentSeries: 'Турнирные серии',
  tournamentRegistrations: 'Регистрации на турниры',
  tournamentResults: 'Результаты турниров',
  tournamentTables: 'Столы турниров',
  tableSeats: 'Места за столами',
  tournamentLiveStates: 'Live-состояния турниров',
  tournamentLevels: 'Уровни структур',
  tournamentAdminReports: 'Админ-отчёты турниров',
  tournamentPayments: 'Оплаты турниров',
  tournamentRewards: 'Призы турниров',
  playerOperations: 'Операции игроков',
  blindStructures: 'Структуры блайндов',
  menuCategories: 'Категории меню',
  menuItems: 'Позиции меню',
  orders: 'Заказы',
  orderItems: 'Позиции заказов',
  playerBills: 'Счета игроков',
  achievementTypes: 'Типы достижений',
  achievementInstances: 'Достижения игроков',
  leaderboards: 'Рейтинги',
  leaderboardEntries: 'Записи рейтингов',
  rewards: 'Призы (шаблоны)',
};

export default function AdminDataPanel() {
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    adminDataApi
      .getAll()
      .then((r) => setData(r.data ?? {}))
      .catch((e) => setError(e?.response?.data?.error ?? 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <p className="text-zinc-400">Загрузка...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  const keys = Object.keys(data).sort();

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Все данные из БД</h2>
        <NavLink to="/admin" className="text-zinc-400 hover:text-white text-sm">
          ← Назад в админ-панель
        </NavLink>
      </div>

      {keys.map((key) => (
        <DataSection key={key} title={TABLE_LABELS[key] || key} defaultOpen={key === 'users' || key === 'tournaments'}>
          <GenericTable
            tableKey={key}
            rows={data[key] as Record<string, unknown>[]}
            onRefresh={loadData}
          />
        </DataSection>
      ))}

      <DataSection title="Действия" defaultOpen>
        <QuickActionsPanel onRefresh={loadData} />
      </DataSection>
    </div>
  );
}

function DataSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden min-w-0 max-w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex justify-between items-center text-left text-white font-medium hover:bg-white/5 transition-colors"
      >
        {title}
        <span className="text-zinc-500">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="p-4 pt-0 border-t border-white/5 overflow-x-auto">{children}</div>}
    </div>
  );
}

function GenericTable({
  tableKey,
  rows,
  onRefresh,
}: {
  tableKey: string;
  rows: Record<string, unknown>[];
  onRefresh: () => void;
}) {
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);

  if (!rows || rows.length === 0) return <p className="text-zinc-500 text-sm">Пусто</p>;

  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter(
    (k) => !['passwordHash', 'password'].includes(k)
  );
  const editable = EDITABLE_TABLES.includes(tableKey as (typeof EDITABLE_TABLES)[number]);
  const editableCols = editable ? (EDITABLE_FIELDS[tableKey] ?? []) : [];

  return (
    <>
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-white/10 text-zinc-400 text-left">
            {columns.map((col) => (
              <th key={col} className="py-2 px-2 font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
            {editable && <th className="py-2 px-2 w-12" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = row.id as string | undefined;
            return (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-2 text-zinc-300 max-w-[200px] truncate" title={String(row[col] ?? '')}>
                    {formatCell(row[col])}
                  </td>
                ))}
                {editable && id && (
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => setEditRow({ ...row })}
                      className="text-zinc-400 hover:text-amber-400 text-xs"
                      title="Редактировать"
                    >
                      ✎
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {editRow && editableCols.length > 0 &&
        createPortal(
          <EditModal
            tableKey={tableKey}
            row={editRow}
            editableFields={editableCols}
            onClose={() => setEditRow(null)}
            onSaved={() => {
              setEditRow(null);
              onRefresh();
            }}
          />,
          document.body
        )}
    </>
  );
}

function EditModal({
  tableKey,
  row,
  editableFields,
  onClose,
  onSaved,
}: {
  tableKey: string;
  row: Record<string, unknown>;
  editableFields: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of editableFields) {
      init[f] = row[f];
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    const id = row.id as string;
    if (!id) return;
    const payload: Record<string, unknown> = { ...form };
    const nullableIdFields = ['managedClubId', 'clubId', 'seriesId', 'blindStructureId', 'categoryId'];
    for (const k of nullableIdFields) {
      if (k in payload && payload[k] === '') payload[k] = null;
    }
    try {
      await adminDataApi.update(tableKey, id, payload);
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка сохранения';
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4">Редактировать</h3>
        <div className="space-y-3">
          {editableFields.map((f) => {
            const val = form[f];
            const isBool = typeof val === 'boolean' || f === 'isActive' || f === 'isArrived';
            const isNumber = f === 'dayOfWeek' || f === 'tableCount' || f.endsWith('Count') || f.endsWith('Cost') || f.endsWith('Chips') || f.endsWith('Stack') || f === 'cashRevenue' || f === 'nonCashRevenue';
            const isJson = f === 'expenses' || f === 'daysOfWeek';
            const isDate = f === 'startTime' || f === 'createdAt' || f === 'updatedAt';

            if (isBool) {
              return (
                <label key={f} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="glass-checkbox shrink-0"
                    checked={Boolean(form[f])}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.checked }))}
                  />
                  <span className="text-zinc-300">{f}</span>
                </label>
              );
            }
            if (isJson) {
              return (
                <div key={f}>
                  <label className="block text-zinc-400 text-sm mb-1">{f}</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono"
                    rows={4}
                    value={JSON.stringify(form[f] ?? [])}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setForm((prev) => ({ ...prev, [f]: parsed }));
                      } catch {
                        // ignore invalid json while typing
                      }
                    }}
                  />
                </div>
              );
            }
            return (
              <div key={f}>
                <label className="block text-zinc-400 text-sm mb-1">{f}</label>
                <input
                  type={isDate ? 'datetime-local' : isNumber ? 'number' : 'text'}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  value={
                    val == null
                      ? ''
                      : isDate && val
                        ? new Date(String(val)).toISOString().slice(0, 16)
                        : String(val)
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f]: isDate ? e.target.value : isNumber ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value,
                    }))
                  }
                />
              </div>
            );
          })}
        </div>
        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={handleSave} disabled={saving} className="glass-btn px-4 py-2 rounded-xl">
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[${value.length}]`;
    const obj = value as Record<string, unknown>;
    if (obj.id) return String(obj.id);
    if (obj.name) return String(obj.name);
    return JSON.stringify(value).slice(0, 50);
  }
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  if (typeof value === 'number') return String(value);
  const s = String(value);
  if (s.length > 40) return s.slice(0, 40) + '…';
  return s;
}

function QuickActionsPanel({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <button onClick={onRefresh} className="glass-btn px-4 py-2 rounded-xl">
          Обновить данные
        </button>
      </div>
      <p className="text-zinc-500 text-sm">
        Смена ролей и статусов — в разделе «Пользователи» и «Турниры» админ-панели или через API.
      </p>
    </div>
  );
}
