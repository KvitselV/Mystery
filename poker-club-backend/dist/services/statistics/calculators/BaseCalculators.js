"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCountCalculator = createCountCalculator;
exports.createAverageCalculator = createAverageCalculator;
exports.createPercentageCalculator = createPercentageCalculator;
exports.createMinMaxCalculator = createMinMaxCalculator;
exports.createMinCalculator = createMinCalculator;
exports.createGroupByCalculator = createGroupByCalculator;
exports.createTimeSeriesCalculator = createTimeSeriesCalculator;
function round2(value) {
    return parseFloat(value.toFixed(2));
}
function createCountCalculator(name, filterFn) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const filtered = filterFn ? data.filter(filterFn) : data;
            return filtered.length;
        },
    };
}
function createAverageCalculator(name, extractValue, filterFn) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const filtered = filterFn ? data.filter(filterFn) : data;
            if (filtered.length === 0)
                return 0;
            const sum = filtered.reduce((acc, item) => acc + extractValue(item), 0);
            return round2(sum / filtered.length);
        },
    };
}
function createPercentageCalculator(name, conditionFn, filterFn) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const filtered = filterFn ? data.filter(filterFn) : data;
            if (filtered.length === 0)
                return 0;
            const matchCount = filtered.filter(conditionFn).length;
            return round2((matchCount / filtered.length) * 100);
        },
    };
}
function createMinMaxCalculator(name, extractValue) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const values = data
                .map(extractValue)
                .filter((v) => typeof v === 'number' && !Number.isNaN(v));
            if (values.length === 0)
                return { min: null, max: null };
            return {
                min: round2(Math.min(...values)),
                max: round2(Math.max(...values)),
            };
        },
    };
}
/** Возвращает только минимальное значение (для bestFinish и т.п.) */
function createMinCalculator(name, extractValue) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const values = data
                .map(extractValue)
                .filter((v) => typeof v === 'number' && !Number.isNaN(v));
            if (values.length === 0)
                return null;
            return round2(Math.min(...values));
        },
    };
}
function createGroupByCalculator(name, extractKey) {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const groups = {};
            for (const item of data) {
                const key = extractKey(item) || '(unknown)';
                groups[key] = (groups[key] ?? 0) + 1;
            }
            return groups;
        },
    };
}
/** ISO 8601 номер недели: неделя 1 = неделя с первым четвергом года */
function getISOWeek(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getFullYear(), week: weekNo };
}
function formatPeriod(date, periodType) {
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
function createTimeSeriesCalculator(name, extractDate, periodType = 'month') {
    return {
        name,
        calculate: (data, _context, _computed) => {
            const byPeriod = new Map();
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
//# sourceMappingURL=BaseCalculators.js.map