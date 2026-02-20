import { MetricCalculator, StatisticsContext } from '../types';

type FilterFn<T> = (item: T) => boolean;
type ExtractValueFn<T, V> = (item: T) => V;
type ExtractKeyFn<T> = (item: T) => string;
type ExtractDateFn<T> = (item: T) => Date | null | undefined;

function round2(value: number): number {
  return parseFloat(value.toFixed(2));
}

export function createCountCalculator<TEntity>(
  name: string,
  filterFn?: FilterFn<TEntity>
): MetricCalculator<TEntity, number> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const filtered = filterFn ? data.filter(filterFn) : data;
      return filtered.length;
    },
  };
}

export function createAverageCalculator<TEntity>(
  name: string,
  extractValue: ExtractValueFn<TEntity, number>,
  filterFn?: FilterFn<TEntity>
): MetricCalculator<TEntity, number> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const filtered = filterFn ? data.filter(filterFn) : data;
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((acc, item) => acc + extractValue(item), 0);
      return round2(sum / filtered.length);
    },
  };
}

export function createPercentageCalculator<TEntity>(
  name: string,
  conditionFn: FilterFn<TEntity>,
  filterFn?: FilterFn<TEntity>
): MetricCalculator<TEntity, number> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const filtered = filterFn ? data.filter(filterFn) : data;
      if (filtered.length === 0) return 0;
      const matchCount = filtered.filter(conditionFn).length;
      return round2((matchCount / filtered.length) * 100);
    },
  };
}

export function createMinMaxCalculator<TEntity>(
  name: string,
  extractValue: ExtractValueFn<TEntity, number>
): MetricCalculator<TEntity, { min: number | null; max: number | null }> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const values = data
        .map(extractValue)
        .filter((v) => typeof v === 'number' && !Number.isNaN(v));
      if (values.length === 0) return { min: null, max: null };
      return {
        min: round2(Math.min(...values)),
        max: round2(Math.max(...values)),
      };
    },
  };
}

/** Возвращает только минимальное значение (для bestFinish и т.п.) */
export function createMinCalculator<TEntity>(
  name: string,
  extractValue: ExtractValueFn<TEntity, number>
): MetricCalculator<TEntity, number | null> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const values = data
        .map(extractValue)
        .filter((v) => typeof v === 'number' && !Number.isNaN(v));
      if (values.length === 0) return null;
      return round2(Math.min(...values));
    },
  };
}

export function createGroupByCalculator<TEntity>(
  name: string,
  extractKey: ExtractKeyFn<TEntity>
): MetricCalculator<TEntity, Record<string, number>> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const groups: Record<string, number> = {};
      for (const item of data) {
        const key = extractKey(item) || '(unknown)';
        groups[key] = (groups[key] ?? 0) + 1;
      }
      return groups;
    },
  };
}

export type PeriodType = 'day' | 'week' | 'month' | 'year';

/** ISO 8601 номер недели: неделя 1 = неделя с первым четвергом года */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getFullYear(), week: weekNo };
}

function formatPeriod(date: Date, periodType: PeriodType): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  switch (periodType) {
    case 'day':
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    case 'week': {
      const { year, week } = getISOWeek(date);
      return `${year}-W${String(week).padStart(2, '0')}`;
    }
    case 'month':
      return `${y}-${String(m).padStart(2, '0')}`;
    case 'year':
      return String(y);
    default:
      return `${y}-${String(m).padStart(2, '0')}`;
  }
}

export function createTimeSeriesCalculator<TEntity>(
  name: string,
  extractDate: ExtractDateFn<TEntity>,
  periodType: PeriodType = 'month'
): MetricCalculator<TEntity, { period: string; count: number }[]> {
  return {
    name,
    calculate: (data, _context, _computed) => {
      const byPeriod = new Map<string, number>();
      for (const item of data) {
        const d = extractDate(item);
        if (d) {
          const date = d instanceof Date ? d : new Date(d);
          const period = formatPeriod(date, periodType);
          byPeriod.set(period, (byPeriod.get(period) ?? 0) + 1);
        }
      }
      return Array.from(byPeriod.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count }));
    },
  };
}
