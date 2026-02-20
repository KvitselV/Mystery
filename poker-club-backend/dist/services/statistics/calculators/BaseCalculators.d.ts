import { MetricCalculator } from '../types';
type FilterFn<T> = (item: T) => boolean;
type ExtractValueFn<T, V> = (item: T) => V;
type ExtractKeyFn<T> = (item: T) => string;
type ExtractDateFn<T> = (item: T) => Date | null | undefined;
export declare function createCountCalculator<TEntity>(name: string, filterFn?: FilterFn<TEntity>): MetricCalculator<TEntity, number>;
export declare function createAverageCalculator<TEntity>(name: string, extractValue: ExtractValueFn<TEntity, number>, filterFn?: FilterFn<TEntity>): MetricCalculator<TEntity, number>;
export declare function createPercentageCalculator<TEntity>(name: string, conditionFn: FilterFn<TEntity>, filterFn?: FilterFn<TEntity>): MetricCalculator<TEntity, number>;
export declare function createMinMaxCalculator<TEntity>(name: string, extractValue: ExtractValueFn<TEntity, number>): MetricCalculator<TEntity, {
    min: number | null;
    max: number | null;
}>;
/** Возвращает только минимальное значение (для bestFinish и т.п.) */
export declare function createMinCalculator<TEntity>(name: string, extractValue: ExtractValueFn<TEntity, number>): MetricCalculator<TEntity, number | null>;
export declare function createGroupByCalculator<TEntity>(name: string, extractKey: ExtractKeyFn<TEntity>): MetricCalculator<TEntity, Record<string, number>>;
export type PeriodType = 'day' | 'week' | 'month' | 'year';
export declare function createTimeSeriesCalculator<TEntity>(name: string, extractDate: ExtractDateFn<TEntity>, periodType?: PeriodType): MetricCalculator<TEntity, {
    period: string;
    count: number;
}[]>;
export {};
//# sourceMappingURL=BaseCalculators.d.ts.map