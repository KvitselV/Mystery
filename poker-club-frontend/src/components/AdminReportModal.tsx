import { useState, useEffect } from 'react';
import { tournamentsApi } from '../api';
import type { Tournament } from '../api';

export function AdminReportModal({
  tournament,
  onClose,
  onSaved,
}: {
  tournament: Tournament;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState('');
  const [cashRubles, setCashRubles] = useState('');
  const [nonCashRubles, setNonCashRubles] = useState('');
  const [expenses, setExpenses] = useState<{ description: string; amount: string }[]>([]);

  useEffect(() => {
    tournamentsApi.getAdminReport(tournament.id)
      .then((r) => {
        const rp = r.data.report;
        setAttendance(String(rp.attendanceCount));
        setCashRubles((rp.cashRevenue / 100).toFixed(0));
        setNonCashRubles((rp.nonCashRevenue / 100).toFixed(0));
        setExpenses((rp.expenses || []).map((e) => ({ description: e.description, amount: (e.amount / 100).toFixed(0) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournament.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await tournamentsApi.updateAdminReport(tournament.id, {
        attendanceCount: parseInt(attendance, 10) || 0,
        cashRevenue: parseFloat(cashRubles) || 0,
        nonCashRevenue: parseFloat(nonCashRubles) || 0,
        expenses: expenses.map((e) => ({ description: e.description, amount: parseFloat(e.amount) || 0 })),
      });
      onSaved();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const addExpense = () => setExpenses([...expenses, { description: '', amount: '' }]);
  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));
  const updateExpense = (i: number, field: 'description' | 'amount', v: string) => {
    const next = [...expenses];
    next[i] = { ...next[i], [field]: v };
    setExpenses(next);
  };

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0) * 100, 0) / 100;
  const cash = parseFloat(cashRubles) || 0;
  const nonCash = parseFloat(nonCashRubles) || 0;
  const profit = cash + nonCash - totalExpenses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Отчёт по турниру: {tournament.name}</h3>
        {loading ? (
          <p className="text-zinc-400">Загрузка...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm">Пришло человек</label>
              <input type="number" value={attendance} onChange={(e) => setAttendance(e.target.value)} className="w-full glass-card px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Наличная выручка (₽)</label>
              <input type="number" value={cashRubles} onChange={(e) => setCashRubles(e.target.value)} className="w-full glass-card px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Безналичная выручка (₽)</label>
              <input type="number" value={nonCashRubles} onChange={(e) => setNonCashRubles(e.target.value)} className="w-full glass-card px-3 py-2 mt-1" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm">Расходы</span>
                <button onClick={addExpense} className="glass-btn px-2 py-1 text-xs">+ На что и сколько</button>
              </div>
              <div className="space-y-2">
                {expenses.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="На что" value={e.description} onChange={(ev) => updateExpense(i, 'description', ev.target.value)} className="flex-1 glass-card px-3 py-2" />
                    <input type="number" placeholder="₽" value={e.amount} onChange={(ev) => updateExpense(i, 'amount', ev.target.value)} className="w-24 glass-card px-3 py-2" />
                    <button onClick={() => removeExpense(i)} className="text-red-400">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-amber-400 font-bold">Итого прибыль: {profit.toFixed(0)} ₽</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="glass-btn px-4 py-2">Сохранить</button>
              <button onClick={onClose} className="text-zinc-400 hover:text-white">Закрыть</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
