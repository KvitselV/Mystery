import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { adminDataApi, clubsApi, type Club, type ExcelImportData, type ExcelImportPlayer, type ExcelImportTournament } from '../../api';

/**
 * Парсинг Excel по формату:
 * A: Имя, B: номер, C: итого (пропуск), D+: D1=дата турнира, D2=очки игрока в строчке 2
 */
function parseExcelFile(file: File): { players: ExcelImportPlayer[]; tournaments: ExcelImportTournament[] } {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        if (!data) {
          reject(new Error('Не удалось прочитать файл'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' }) as (string | number)[][];

        if (!rows.length) {
          reject(new Error('Таблица пуста'));
          return;
        }

        const playersMap = new Map<string, ExcelImportPlayer>();

        // Row 0: headers — A1=Имя, B1=номер, C1=итого, D1=дата1, E1=дата2, ...
        // Row 1+: data
        const headerRow = rows[0] ?? [];
        for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
          const row = rows[rowIdx] ?? [];
          const name = String(row[0] ?? '').trim();
          const cardNumber = String(row[1] ?? '').trim();
          if (!name || !cardNumber) continue;
          if (!playersMap.has(cardNumber)) playersMap.set(cardNumber, { name, cardNumber });
        }
        const players = Array.from(playersMap.values());
        const tournaments: ExcelImportTournament[] = [];

        // Tournaments: columns D (3), E (4), ...
        for (let colIdx = 3; colIdx < (headerRow?.length ?? 0); colIdx++) {
          const dateVal = headerRow[colIdx];
          if (dateVal === undefined || dateVal === null || dateVal === '') continue;

          let dateStr: string;
          if (dateVal instanceof Date) {
            dateStr = dateVal.toISOString().slice(0, 10);
          } else if (typeof dateVal === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + dateVal * 86400000);
            dateStr = d.toISOString().slice(0, 10);
          } else {
            dateStr = String(dateVal).trim();
          }
          if (!dateStr) continue;

          const results: { cardNumber: string; points: number }[] = [];
          for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx] ?? [];
            const cardNumber = String(row[1] ?? '').trim();
            const pointsVal = row[colIdx];
            if (!cardNumber) continue;
            if (pointsVal === undefined || pointsVal === null || (typeof pointsVal === 'string' && String(pointsVal).trim() === ''))
              continue;
            const points = typeof pointsVal === 'number' ? pointsVal : (parseFloat(String(pointsVal)) || 0);
            results.push({ cardNumber, points });
          }

          tournaments.push({ date: dateStr, results });
        }

        resolve({ players, tournaments });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Ошибка разбора Excel'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportExcelPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubId, setClubId] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ playersCreated: number; playersSkipped: number; tournamentsCreated: number; seriesName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clubsApi.list().then((r) => {
      const list = r.data?.clubs ?? [];
      setClubs(list);
      if (list.length) setClubId((prev) => prev || list[0].id);
    }).catch(() => setClubs([]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setError(null);
    setResult(null);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!file || !clubId || !seriesName.trim()) {
      setError('Выберите файл, клуб и введите название серии');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { players, tournaments } = await parseExcelFile(file);
      if (!players.length || !tournaments.length) {
        setError('В файле нет игроков или турниров. Проверьте формат: A=Имя, B=номер, C=итого, D+=дата и очки.');
        setLoading(false);
        return;
      }
      const data: ExcelImportData = {
        clubId,
        seriesName: seriesName.trim(),
        players,
        tournaments,
      };
      const res = await adminDataApi.importExcel(data);
      setResult({
        playersCreated: res.data?.playersCreated ?? 0,
        playersSkipped: res.data?.playersSkipped ?? 0,
        tournamentsCreated: res.data?.tournamentsCreated ?? 0,
        seriesName: res.data?.seriesName ?? '',
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? (e instanceof Error ? e.message : 'Ошибка импорта');
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Импорт из Excel</h2>
      <p className="text-zinc-400 text-sm">
        Формат: Столбец A — Имя, B — номер карты, C — итого (пропускается), D и далее — D1 дата турнира, D2+ очки игрока.
      </p>

      <div className="glass-card p-4 space-y-4 max-w-xl">
        <div>
          <label className="block text-zinc-400 text-sm mb-1">Клуб *</label>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="glass-select w-full px-4 py-2"
          >
            <option value="">— Выберите клуб —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-1">Название серии *</label>
          <input
            type="text"
            placeholder="Название турнирной серии"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            className="glass-select w-full px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-1">Файл Excel *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass-btn px-4 py-2 rounded-xl"
          >
            {file ? file.name : 'Выбрать файл'}
          </button>
        </div>
        <button
          onClick={handleImport}
          disabled={loading || !file || !clubId || !seriesName.trim()}
          className="glass-btn px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {loading ? 'Импорт…' : 'Импортировать'}
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {result && (
        <div className="glass-card p-4 text-emerald-400">
          <p className="font-medium">Импорт выполнен</p>
          <p className="text-sm">
            Создано игроков: {result.playersCreated}, пропущено (уже есть): {result.playersSkipped}.
            Турниров: {result.tournamentsCreated}. Серия: {result.seriesName}
          </p>
        </div>
      )}
    </div>
  );
}
